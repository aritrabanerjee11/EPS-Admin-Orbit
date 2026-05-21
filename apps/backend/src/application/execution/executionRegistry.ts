const controllersByRequestId = new Map<string, AbortController>();
const activeSessions = new Set<string>();

export function createExecutionController(requestId: string, sessionId: string): AbortController {
  if (activeSessions.has(sessionId)) {
    throw new Error("Execution already in progress for this session.");
  }

  const controller = new AbortController();
  activeSessions.add(sessionId);
  controllersByRequestId.set(requestId, controller);
  return controller;
}

export function releaseExecution(requestId: string, sessionId: string): void {
  activeSessions.delete(sessionId);
  controllersByRequestId.delete(requestId);
}

export function cancelExecution(requestId: string): boolean {
  const controller = controllersByRequestId.get(requestId);
  if (!controller) {
    return false;
  }

  controller.abort();
  controllersByRequestId.delete(requestId);
  return true;
}
