import type { ChatResponse, ChatSession, Operation as OperationId, OperationEvent } from "../../types/chat";
import { SessionState } from "../../types/chat";
import { createEvent } from "../../domain/events";
import { writeLog } from "../../infrastructure/logging/logger";
import { ApiError } from "../../services/errors";
import type { ChatRequest } from "../../types/schemas";
import { buildMissingFieldsMessage } from "./fieldCollection";
import { parseCommand } from "./commandParser";
import { createSession, normalizeSession, resetSession, transitionSession } from "./sessionFactory";
import { collectFields, previewOperation } from "../operations/operationEngine";
import { getOperation } from "../operations/operationRegistry";
import { cancelExecution } from "../execution/executionRegistry";

export function handleConversation(request: ChatRequest): ChatResponse {
  const message = request.message.trim();
  const baseSession = normalizeSession(request.session as Partial<ChatSession> | undefined);
  const command = parseCommand(message);
  const operation = getOperation(baseSession.activeOperationId);
  const events: OperationEvent[] = [];

  writeLog("chat", {
    sessionId: baseSession.sessionId,
    requestId: baseSession.requestId,
    operation: baseSession.activeOperationId,
    message,
    state: baseSession.state
  });

  if (baseSession.pendingOperationId) {
    return handlePendingIntent(command.type === "confirm" ? "confirm" : command.type === "cancel" ? "cancel" : "message", baseSession);
  }

  if (command.type === "reset") {
    const session = resetSession(baseSession.providerTarget);
    events.push(createEvent("RESET", session));
    return {
      session,
      mode: "idle",
      missingFields: [],
      assistantMessage: "Session reset.",
      events
    };
  }

  if (command.type === "cancel") {
    const cancelled = cancelExecution(baseSession.requestId);
    const session = transitionSession(baseSession, SessionState.FAILED);
    events.push(createEvent("CANCELLED", session, { cancelled }));
    return {
      session,
      mode: "failed",
      missingFields: [],
      assistantMessage: cancelled ? "Execution cancelled." : "No active execution to cancel.",
      events
    };
  }

  if (command.type === "switch_provider") {
    const session = {
      ...transitionSession(baseSession, baseSession.state),
      providerTarget: command.providerTarget
    };
    return {
      session,
      mode: session.state === SessionState.PREVIEW ? "preview" : "collect",
      missingFields: [],
      assistantMessage: `Environment set to ${command.providerTarget.toLowerCase()}.`,
      events
    };
  }

  if (command.type === "intent" && command.operationId !== baseSession.activeOperationId) {
    return requestIntentSwitch(baseSession, command.operationId);
  }

  if (command.type === "preview") {
    return previewResponse(operation, baseSession);
  }

  if (command.type === "confirm") {
    const validation = operation.validate(baseSession.collectedFields, baseSession);
    if (!validation.valid) {
      return {
        session: transitionSession(baseSession, SessionState.COLLECTING),
        mode: "collect",
        next: validation.missingFields[0],
        missingFields: validation.missingFields,
        assistantMessage: buildMissingFieldsMessage(operation.manifest.fields, validation.missingFields)
      };
    }

    return {
      session: transitionSession(baseSession, SessionState.PREVIEW),
      mode: "preview",
      missingFields: [],
      assistantMessage: "Preview available. Confirm when ready."
    };
  }

  const collected = collectFields(operation, baseSession.state === SessionState.SUCCESS ? createSession("generate_codes", baseSession.providerTarget) : baseSession, message);
  events.push(...collected.events);

  if (collected.missingFields.length > 0) {
    return {
      session: collected.session,
      mode: "collect",
      next: collected.missingFields[0],
      missingFields: collected.missingFields,
      assistantMessage: buildMissingFieldsMessage(operation.manifest.fields, collected.missingFields),
      events
    };
  }

  const preview = operation.preview(collected.session.collectedFields, collected.session);
  const session = {
    ...transitionSession(collected.session, SessionState.PREVIEW),
    requestSnapshot: preview.requestSnapshot
  };

  return {
    session,
    mode: "preview",
    missingFields: [],
    preview,
    assistantMessage: "Preview available.",
    events
  };
}

export function buildPreviewResponse(sessionInput: Partial<ChatSession>): { session: ChatSession; preview: ReturnType<typeof previewOperation>["preview"]; events: OperationEvent[] } {
  const session = normalizeSession(sessionInput);
  const operation = getOperation(session.activeOperationId);
  return previewOperation(operation, session);
}

function previewResponse(operation: ReturnType<typeof getOperation>, session: ChatSession): ChatResponse {
  try {
    const data = previewOperation(operation, session);

    return {
      session: data.session,
      mode: "preview",
      missingFields: [],
      assistantMessage: "Preview ready.",
      preview: data.preview,
      events: data.events
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        session: transitionSession(session, SessionState.COLLECTING),
        mode: "collect",
        missingFields: [],
        assistantMessage: error.message,
        error: error.toStructuredError()
      };
    }

    throw error;
  }
}

function requestIntentSwitch(session: ChatSession, operationId: OperationId): ChatResponse {
  const nextOperation = getOperation(operationId);
  const updatedSession = {
    ...transitionSession(session, SessionState.COLLECTING),
    pendingOperationId: operationId
  };
  const event = createEvent("INTENT_SWITCH_REQUESTED", updatedSession, { nextOperation: operationId });

  return {
    session: updatedSession,
    mode: "collect",
    missingFields: [],
    assistantMessage: `Discard current ${getOperation(session.activeOperationId).name} draft and switch to ${nextOperation.name}? Type confirm to switch or cancel to keep current draft.`,
    events: [event]
  };
}

function handlePendingIntent(command: "confirm" | "cancel" | "message", session: ChatSession): ChatResponse {
  if (command === "cancel") {
    return {
      session: {
        ...transitionSession(session, SessionState.COLLECTING),
        pendingOperationId: undefined
      },
      mode: "collect",
      missingFields: [],
      assistantMessage: "Keeping current draft."
    };
  }

  if (command !== "confirm" || !session.pendingOperationId) {
    return {
      session,
      mode: "collect",
      missingFields: [],
      assistantMessage: "Type confirm to switch operations or cancel to keep the current draft."
    };
  }

  const next = createSession(session.pendingOperationId, session.providerTarget);
  const operation = getOperation(next.activeOperationId);

  if (!operation.manifest.enabled) {
    return {
      session: {
        ...transitionSession(session, SessionState.COLLECTING),
        pendingOperationId: undefined
      },
      mode: "collect",
      missingFields: [],
      assistantMessage: `${operation.name} is prepared but disabled for V1.`
    };
  }

  return {
    session: next,
    mode: "collect",
    missingFields: [],
    assistantMessage: `${operation.name} selected.`
  };
}
