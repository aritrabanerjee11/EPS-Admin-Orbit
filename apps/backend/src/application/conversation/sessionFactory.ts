import { randomUUID } from "node:crypto";
import type { ChatSession, CollectedFields, Operation, ProviderTarget } from "../../types/chat";
import { SessionState } from "../../types/chat";

export function createSession(operation: Operation = "generate_codes", providerTarget: ProviderTarget = "DEV"): ChatSession {
  const now = new Date().toISOString();

  return {
    sessionId: randomUUID(),
    requestId: randomUUID(),
    operation,
    activeOperationId: operation,
    collectedFields: {
      environment: providerTarget
    },
    state: SessionState.IDLE,
    status: SessionState.IDLE,
    providerTarget,
    createdAt: now,
    updatedAt: now
  };
}

export function normalizeSession(input?: Partial<ChatSession>): ChatSession {
  if (!input) {
    return createSession();
  }

  const now = new Date().toISOString();
  const state = input.state ?? input.status ?? SessionState.IDLE;
  const operation = input.activeOperationId ?? input.operation ?? "generate_codes";

  return {
    sessionId: input.sessionId ?? randomUUID(),
    requestId: input.requestId ?? randomUUID(),
    traceId: input.traceId,
    operation,
    activeOperationId: operation,
    pendingOperationId: input.pendingOperationId,
    collectedFields: input.collectedFields ?? {},
    state,
    status: state,
    providerTarget: normalizeProviderTarget(input.providerTarget),
    executionLock: input.executionLock,
    requestSnapshot: input.requestSnapshot,
    createdAt: input.createdAt ?? now,
    updatedAt: now
  };
}

export function transitionSession(
  session: ChatSession,
  state: SessionState,
  fields?: CollectedFields
): ChatSession {
  return {
    ...session,
    collectedFields: fields ?? session.collectedFields,
    state,
    status: state,
    updatedAt: new Date().toISOString()
  };
}

export function resetSession(providerTarget: ProviderTarget): ChatSession {
  return createSession("generate_codes", providerTarget);
}

function normalizeProviderTarget(providerTarget: unknown): ProviderTarget {
  return providerTarget === "TEST" || providerTarget === "PREPROD" || providerTarget === "PROD" ? providerTarget : "DEV";
}
