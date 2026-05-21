import type { ChatSession, OperationEvent, OperationEventType } from "../types/chat";

export function createEvent(
  type: OperationEventType,
  session: ChatSession,
  details?: Record<string, unknown>
): OperationEvent {
  return {
    type,
    traceId: session.traceId,
    requestId: session.requestId,
    sessionId: session.sessionId,
    operation: session.activeOperationId,
    timestamp: new Date().toISOString(),
    details
  };
}
