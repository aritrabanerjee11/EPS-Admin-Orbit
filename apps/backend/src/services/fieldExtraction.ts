import type { CollectedFields } from "../types/chat";

const ENVIRONMENT_ALIASES = new Map<string, string>([
  ["preprod", "PREPROD"],
  ["pre-prod", "PREPROD"],
  ["pre production", "PREPROD"],
  ["preproduction", "PREPROD"],
  ["prod", "PROD"],
  ["production", "PROD"],
  ["uat", "UAT"],
  ["qa", "QA"],
  ["dev", "DEV"],
  ["development", "DEV"],
  ["sit", "SIT"],
  ["test", "TEST"],
  ["staging", "STAGE"],
  ["stage", "STAGE"]
]);

export function extractFields(message: string): CollectedFields {
  return {
    ...extractQuantity(message),
    ...extractEnvironment(message),
    ...extractCodeType(message),
    ...extractBatchName(message)
  };
}

function extractQuantity(message: string): Pick<CollectedFields, "quantity"> {
  const match = message.match(/\b(\d{1,5})\b/);
  if (!match) {
    return {};
  }

  const quantity = Number(match[1]);
  return Number.isInteger(quantity) && quantity > 0 ? { quantity } : {};
}

function extractEnvironment(message: string): Pick<CollectedFields, "environment"> {
  const normalized = message.toLowerCase().replace(/\s+/g, " ").trim();

  for (const [alias, environment] of ENVIRONMENT_ALIASES.entries()) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escapedAlias}\\b`, "i").test(normalized)) {
      return { environment };
    }
  }

  return {};
}

function extractCodeType(message: string): Pick<CollectedFields, "codeType"> {
  const normalized = message.toLowerCase();

  if (/\balpha\s*numeric\b|\balphanumeric\b/.test(normalized)) {
    return { codeType: "Alphanumeric" };
  }

  if (/\bnumeric\b|\bdigits?\b|\bnumbers?\b/.test(normalized)) {
    return { codeType: "Numeric" };
  }

  if (/\balpha\b|\balphabetic\b|\bletters?\b/.test(normalized)) {
    return { codeType: "Alphabetic" };
  }

  return {};
}

function extractBatchName(message: string): Pick<CollectedFields, "batchName"> {
  const explicitMatch = message.match(/\bbatch(?:\s+name)?\s*(?:is|:)?\s*([a-z0-9][a-z0-9-_]*)\b/i);
  if (explicitMatch?.[1]) {
    return { batchName: normalizeBatchName(explicitMatch[1]) };
  }

  const hyphenatedMatch = message.match(/\b(batch[-_][a-z0-9][a-z0-9-_]*)\b/i);
  if (hyphenatedMatch?.[1]) {
    return { batchName: normalizeBatchName(hyphenatedMatch[1]) };
  }

  return {};
}

function normalizeBatchName(batchName: string): string {
  return batchName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^batch[-_]?/i, "Batch-")
    .replace(/^Batch$/, "Batch-A");
}
