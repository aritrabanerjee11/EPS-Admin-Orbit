import { randomUUID } from "node:crypto";
import type { Operation } from "../../domain/operation";
import { createEvent } from "../../domain/events";
import type { ChatSession, CollectedFields, ConfirmResult, OperationEvent, PreviewData, RequestSnapshot } from "../../types/chat";
import { SessionState } from "../../types/chat";
import { ApiError } from "../../services/errors";
import { buildMissingFieldsMessage } from "../conversation/fieldCollection";
import { transitionSession } from "../conversation/sessionFactory";

export function collectFields(operation: Operation, session: ChatSession, message: string): {
  session: ChatSession;
  missingFields: string[];
  events: OperationEvent[];
} {
  const before = session.collectedFields;
  const collectedFields = operation.collect(message, session);
  const updatedSession = transitionSession(session, SessionState.COLLECTING, collectedFields);
  const validation = operation.validate(collectedFields, updatedSession);
  const events = Object.keys(collectedFields)
    .filter((key) => before[key] !== collectedFields[key])
    .map((key) => createEvent("FIELD_COLLECTED", updatedSession, { field: key }));

  return {
    session: validation.valid ? transitionSession(updatedSession, SessionState.PREVIEW) : updatedSession,
    missingFields: validation.missingFields,
    events
  };
}

export function previewOperation(operation: Operation, session: ChatSession): { session: ChatSession; preview: PreviewData; events: OperationEvent[] } {
  const validation = operation.validate(session.collectedFields, session);
  if (!validation.valid) {
    throw new ApiError(400, buildMissingFieldsMessage(operation.manifest.fields, validation.missingFields), "VALIDATION", true);
  }

  const preview = operation.preview(session.collectedFields, session);
  const updatedSession = {
    ...transitionSession(session, SessionState.PREVIEW),
    requestSnapshot: preview.requestSnapshot
  };

  return {
    session: updatedSession,
    preview,
    events: [createEvent("PREVIEW_OPENED", updatedSession)]
  };
}

export function createRequestSnapshot(operation: Operation, session: ChatSession): RequestSnapshot {
  return operation.preview(session.collectedFields, session).requestSnapshot;
}

export function prepareExecutionSession(session: ChatSession): ChatSession {
  const traceId = randomUUID();
  return {
    ...transitionSession(session, SessionState.EXECUTING),
    traceId,
    executionLock: {
      requestId: session.requestId,
      status: "RUNNING"
    }
  };
}

export function completeExecutionSession(session: ChatSession, status: ConfirmResult["metadata"]["status"]): ChatSession {
  return {
    ...transitionSession(session, status === "SUCCESS" ? SessionState.SUCCESS : status === "CANCELLED" ? SessionState.FAILED : SessionState.FAILED),
    executionLock: {
      requestId: session.requestId,
      status: status === "SUCCESS" ? "COMPLETED" : status
    }
  };
}
