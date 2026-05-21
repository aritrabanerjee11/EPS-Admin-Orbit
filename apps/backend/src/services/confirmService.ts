import type { ChatSession, ConfirmResult, GenerationResult } from "../types/chat";
import { SessionState } from "../types/chat";
import { timeoutConfig } from "../application/config";
import { normalizeSession } from "../application/conversation/sessionFactory";
import { createExecutionController, releaseExecution } from "../application/execution/executionRegistry";
import { withRequestTimeout } from "../application/execution/timeout";
import { completeExecutionSession, prepareExecutionSession, previewOperation } from "../application/operations/operationEngine";
import { getOperation } from "../application/operations/operationRegistry";
import { writeLog } from "../infrastructure/logging/logger";
import { ApiError } from "./errors";

export async function confirmCodes(session: Partial<ChatSession>): Promise<{ session: ChatSession; result: ConfirmResult }> {
  const baseSession = normalizeSession(session);
  const operation = getOperation(baseSession.activeOperationId);

  if (baseSession.state === SessionState.SUCCESS || baseSession.executionLock?.status === "COMPLETED") {
    throw new ApiError(409, "This request already completed. Reset to run another request.", "VALIDATION", false);
  }

  const validation = operation.validate(baseSession.collectedFields, baseSession);
  if (!validation.valid) {
    throw new ApiError(400, validation.errors[0]?.message ?? "Required fields are missing.", "VALIDATION", true);
  }

  const executingSession = prepareExecutionSession(baseSession);
  const controller = createExecutionController(executingSession.requestId, executingSession.sessionId);
  const timeout = withRequestTimeout(controller, timeoutConfig.requestTimeoutMs);
  const startedAt = Date.now();
  const preview = previewOperation(operation, baseSession).preview;

  writeLog("execution", {
    traceId: executingSession.traceId,
    requestId: executingSession.requestId,
    sessionId: executingSession.sessionId,
    operation: executingSession.activeOperationId,
    provider: executingSession.providerTarget,
    event: "CONFIRMED",
    timestamp: new Date().toISOString()
  });

  try {
    const execution = await operation.execute({
      session: executingSession,
      inputs: executingSession.collectedFields,
      providerTarget: executingSession.providerTarget,
      traceId: executingSession.traceId ?? executingSession.requestId,
      requestId: executingSession.requestId,
      signal: controller.signal
    });
    const durationMs = Date.now() - startedAt;
    const output = execution.output as {
      success: boolean;
      codes: string[];
      formattedCodes?: string[];
      traceId: string;
      provider: string;
      generatedAt?: string;
    };
    const generation: GenerationResult = {
      success: output.success,
      codes: output.codes,
      traceId: output.traceId,
      provider: output.provider
    };
    const completedSession = completeExecutionSession(executingSession, "SUCCESS");

    writeLog("execution", {
      traceId: generation.traceId,
      requestId: completedSession.requestId,
      sessionId: completedSession.sessionId,
      operation: completedSession.activeOperationId,
      provider: generation.provider,
      duration: durationMs,
      status: "SUCCESS"
    });

    return {
      session: completedSession,
      result: {
        preview,
        generation,
        rawCodes: output.codes,
        formattedCodes: output.formattedCodes ?? output.codes,
        generatedAt: output.generatedAt ?? new Date().toISOString(),
        metadata: {
          sessionId: completedSession.sessionId,
          requestId: completedSession.requestId,
          traceId: generation.traceId,
          timestamp: new Date().toISOString(),
          provider: generation.provider,
          durationMs,
          status: "SUCCESS"
        }
      }
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const cancelled = controller.signal.aborted;
    const status = cancelled ? "CANCELLED" : "FAILED";
    const failedSession = completeExecutionSession(executingSession, status);
    const message = cancelled ? "Execution cancelled or timed out." : error instanceof Error ? error.message : "Execution failed.";
    const structuredError = {
      category: cancelled ? "NETWORK" as const : "PROVIDER" as const,
      message: cancelled ? "Provider timed out or request was cancelled." : "Provider unavailable.",
      retryable: true
    };

    writeLog("execution", {
      traceId: failedSession.traceId,
      requestId: failedSession.requestId,
      sessionId: failedSession.sessionId,
      operation: failedSession.activeOperationId,
      provider: failedSession.providerTarget,
      duration: durationMs,
      status,
      error: message
    });

    return {
      session: failedSession,
      result: {
        preview,
        generation: {
          success: false,
          codes: [],
          traceId: failedSession.traceId ?? failedSession.requestId,
          provider: failedSession.providerTarget
        },
        rawCodes: [],
        formattedCodes: [],
        generatedAt: new Date().toISOString(),
        metadata: {
          sessionId: failedSession.sessionId,
          requestId: failedSession.requestId,
          traceId: failedSession.traceId ?? failedSession.requestId,
          timestamp: new Date().toISOString(),
          provider: failedSession.providerTarget,
          durationMs,
          status
        },
        error: structuredError
      }
    };
  } finally {
    clearTimeout(timeout);
    releaseExecution(executingSession.requestId, executingSession.sessionId);
  }
}
