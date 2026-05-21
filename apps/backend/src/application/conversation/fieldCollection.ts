import type { FieldDefinition, OperationValidation } from "../../domain/operation";
import type { ChatSession, CollectedFields, ProviderTarget, RequiredField } from "../../types/chat";

export function getRequiredFields(fields: FieldDefinition[], providerTarget: ProviderTarget): FieldDefinition[] {
  return fields.filter(
    (field) => field.required || field.requiredForProviders?.includes(providerTarget)
  );
}

export function validateFields(fields: FieldDefinition[], inputs: CollectedFields, session: ChatSession): OperationValidation {
  const required = getRequiredFields(fields, session.providerTarget);
  const missingFields = required
    .filter((field) => isMissing(inputs[field.key]))
    .map((field) => field.key as RequiredField);

  return {
    valid: missingFields.length === 0,
    missingFields,
    errors: missingFields.map((field) => ({
      category: "VALIDATION",
      message: `${getFieldLabel(fields, field)} is required.`,
      retryable: true
    }))
  };
}

export function buildMissingFieldsMessage(fields: FieldDefinition[], missingFields: RequiredField[]): string {
  const labels = missingFields.map((field) => getFieldLabel(fields, field)).join("\n");
  return `I need:\n\n${labels}`;
}

export function getFieldLabel(fields: FieldDefinition[], key: string): string {
  return fields.find((field) => field.key === key)?.label ?? key;
}

export function applyFieldDefaults(fields: FieldDefinition[], inputs: CollectedFields): CollectedFields {
  const next = { ...inputs };

  for (const field of fields) {
    if (next[field.key] === undefined && field.defaultValue !== undefined) {
      next[field.key] = field.defaultValue;
    }
  }

  return next;
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}
