import type { Operation, OperationExecutionContext, OperationExecutionResult, OperationValidation } from "../../domain/operation";
import type { ChatSession, CollectedFields, PreviewData } from "../../types/chat";
import { getCodeProvider } from "../../providers";
import { formatCode, unformatCode } from "../../services/codeFormatting";
import { completeGenerateFieldsSchema } from "../../types/schemas";
import { applyFieldDefaults, validateFields } from "../../application/conversation/fieldCollection";
import { writeLog } from "../../infrastructure/logging/logger";
import { generateCodesManifest } from "./manifest";

export const generateCodesOperation: Operation = {
  id: generateCodesManifest.id,
  name: generateCodesManifest.name,
  manifest: generateCodesManifest,

  collect(message: string, session: ChatSession): CollectedFields {
    return collectGenerateCodeFields(message, session.collectedFields);
  },

  validate(inputs: CollectedFields, session: ChatSession): OperationValidation {
    const normalizedInputs = applyFieldDefaults(generateCodesManifest.fields, inputs);
    const fieldValidation = validateFields(generateCodesManifest.fields, normalizedInputs, session);

    if (!fieldValidation.valid) {
      return fieldValidation;
    }

    const parsed = completeGenerateFieldsSchema.safeParse(normalizedInputs);
    if (!parsed.success) {
      return {
        valid: false,
        missingFields: [],
        errors: [
          {
            category: "VALIDATION",
            message: "Code generation inputs are invalid.",
            retryable: true
          }
        ]
      };
    }

    if (session.providerTarget === "PROD" && normalizedInputs.prodConfirmation !== "CONFIRM PROD") {
      return {
        valid: false,
        missingFields: ["prodConfirmation"],
        errors: [
          {
            category: "VALIDATION",
            message: "PROD generation requires typing CONFIRM PROD.",
            retryable: true
          }
        ]
      };
    }

    return {
      valid: true,
      missingFields: [],
      errors: []
    };
  },

  preview(inputs: CollectedFields, session: ChatSession): PreviewData {
    const fields = applyFieldDefaults(generateCodesManifest.fields, inputs);

    return {
      operationId: "generate_codes",
      operationName: generateCodesManifest.name,
      fields: generateCodesManifest.fields
        .filter((field) => field.preview)
        .filter((field) => fields[field.key] !== undefined)
        .map((field) => ({
          key: field.key,
          label: field.label,
          value: fields[field.key] as string | number
        })),
      requestSnapshot: {
        operation: "generate_codes",
        inputs: fields,
        timestamp: new Date().toISOString(),
        requestId: session.requestId,
        provider: session.providerTarget
      }
    };
  },

  async execute(context: OperationExecutionContext): Promise<OperationExecutionResult> {
    const fields = applyFieldDefaults(generateCodesManifest.fields, context.inputs);
    const parsed = completeGenerateFieldsSchema.parse(fields);
    const provider = getCodeProvider(context.providerTarget);

    writeLog("provider", {
      traceId: context.traceId,
      requestId: context.requestId,
      operation: "generate_codes",
      providerTarget: context.providerTarget,
      status: "STARTED"
    });

    const result = await provider.generate({
      ...parsed,
      providerTarget: context.providerTarget,
      traceId: context.traceId,
      signal: context.signal
    });
    const rawCodes = result.codes.map(unformatCode);

    return {
      success: true,
      provider: result.provider,
      output: {
        success: true,
        codes: rawCodes,
        formattedCodes: rawCodes.map(formatCode),
        traceId: context.traceId,
        provider: result.provider,
        generatedAt: result.generatedAt
      }
    };
  }
};

function collectGenerateCodeFields(message: string, current: CollectedFields): CollectedFields {
  const fields: CollectedFields = {};
  const quantity = extractQuantity(message);
  const environment = extractEnvironment(message);
  const codeType = extractCodeType(message);
  const batchName = extractBatchName(message);
  const prodConfirmation = /\bCONFIRM PROD\b/.test(message) ? "CONFIRM PROD" : undefined;
  const edit = extractEdit(message);

  if (quantity !== undefined) {
    fields.quantity = quantity;
  }

  if (environment) {
    fields.environment = environment;
  }

  if (codeType) {
    fields.codeType = codeType;
  }

  if (batchName) {
    fields.batchName = batchName;
  }

  if (prodConfirmation) {
    fields.prodConfirmation = prodConfirmation;
  }

  if (edit) {
    fields[edit.key] = edit.value;
  }

  return {
    ...current,
    ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))
  };
}

function extractQuantity(message: string): number | undefined {
  const explicit = message.match(/\b(?:quantity|qty|count)\s*(?:to|is|:)?\s*(\d{1,5})\b/i);
  const general = message.match(/\b(\d{1,5})\b/);
  const value = explicit?.[1] ?? general?.[1];
  const quantity = value ? Number(value) : undefined;

  return quantity && Number.isInteger(quantity) && quantity > 0 ? quantity : undefined;
}

function extractEnvironment(message: string): string | undefined {
  const normalized = message.toLowerCase().replace(/\s+/g, " ");
  const aliases: Array<[RegExp, string]> = [
    [/\bpreprod\b|\bpre-prod\b|\bpre production\b|\bpreproduction\b/, "PREPROD"],
    [/\bprod\b|\bproduction\b/, "PROD"],
    [/\buat\b/, "UAT"],
    [/\bqa\b/, "QA"],
    [/\bdev\b|\bdevelopment\b/, "DEV"],
    [/\bsit\b/, "SIT"],
    [/\btest\b/, "TEST"],
    [/\bstage\b|\bstaging\b/, "STAGE"]
  ];

  return aliases.find(([pattern]) => pattern.test(normalized))?.[1];
}

function extractCodeType(message: string): string | undefined {
  const normalized = message.toLowerCase();

  if (/\balpha\s*numeric\b|\balphanumeric\b/.test(normalized)) {
    return "Alphanumeric";
  }

  if (/\bnumeric\b|\bdigits?\b|\bnumbers?\b/.test(normalized)) {
    return "Numeric";
  }

  if (/\balpha\b|\balphabetic\b|\bletters?\b/.test(normalized)) {
    return "Alphabetic";
  }

  return undefined;
}

function extractBatchName(message: string): string | undefined {
  const explicitMatch = message.match(/\bbatch(?:\s+name)?\s*(?:to|is|:)?\s*([a-z0-9][a-z0-9-_]*)\b/i);
  if (explicitMatch?.[1]) {
    return normalizeBatchName(explicitMatch[1]);
  }

  const hyphenatedMatch = message.match(/\b(batch[-_][a-z0-9][a-z0-9-_]*)\b/i);
  return hyphenatedMatch?.[1] ? normalizeBatchName(hyphenatedMatch[1]) : undefined;
}

function extractEdit(message: string): { key: string; value: string | number } | undefined {
  const match = message.match(/\b(?:change|set|edit)\s+([a-zA-Z][a-zA-Z0-9]*)\s*(?:to|=|:)?\s*([a-zA-Z0-9-_ ]+)\b/i);
  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const key = normalizeFieldKey(match[1]);
  const rawValue = match[2].trim();

  if (key === "quantity") {
    const quantity = Number(rawValue.match(/\d{1,5}/)?.[0]);
    return Number.isInteger(quantity) && quantity > 0 ? { key, value: quantity } : undefined;
  }

  if (key === "environment") {
    return { key, value: extractEnvironment(rawValue) ?? rawValue.toUpperCase() };
  }

  if (key === "codeType") {
    return { key, value: extractCodeType(rawValue) ?? rawValue };
  }

  if (key === "batchName") {
    return { key, value: normalizeBatchName(rawValue) };
  }

  return { key, value: rawValue };
}

function normalizeFieldKey(key: string): string {
  const normalized = key.toLowerCase();

  if (["qty", "count", "quantity"].includes(normalized)) {
    return "quantity";
  }

  if (["env", "environment"].includes(normalized)) {
    return "environment";
  }

  if (["type", "codetype", "codeType"].map((item) => item.toLowerCase()).includes(normalized)) {
    return "codeType";
  }

  if (["batch", "batchname"].includes(normalized)) {
    return "batchName";
  }

  return key;
}

function normalizeBatchName(batchName: string): string {
  const normalized = batchName.trim().replace(/\s+/g, "-");
  return normalized.replace(/^batch[-_]?/i, "Batch-").replace(/^Batch$/, "Batch-A");
}
