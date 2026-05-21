import type { ChatSession, CollectedFields, RequiredField } from "../types/chat";
import { completeGenerateFieldsSchema, type CompleteGenerateFields } from "../types/schemas";
import { createSession } from "../application/conversation/sessionFactory";
import { ApiError } from "./errors";

const REQUIRED_FIELDS: RequiredField[] = ["quantity", "environment", "codeType"];

export function createEmptySession(): ChatSession {
  return createSession();
}

export function mergeFields(current: CollectedFields, incoming: CollectedFields): CollectedFields {
  return {
    ...current,
    ...removeUndefined(incoming)
  };
}

export function getMissingFields(fields: CollectedFields): RequiredField[] {
  return REQUIRED_FIELDS.filter((field) => fields[field] === undefined || fields[field] === "");
}

export function getCompleteGenerateFields(session: ChatSession): CompleteGenerateFields {
  const parsed = completeGenerateFieldsSchema.safeParse(session.collectedFields);

  if (!parsed.success) {
    throw new ApiError(400, "Required fields are missing before this operation can run.", "VALIDATION", true);
  }

  return {
    ...parsed.data,
    environment: parsed.data.environment.toUpperCase(),
    codeType: parsed.data.codeType,
    batchName: parsed.data.batchName || "Batch-A"
  };
}

function removeUndefined(fields: CollectedFields): CollectedFields {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  ) as CollectedFields;
}
