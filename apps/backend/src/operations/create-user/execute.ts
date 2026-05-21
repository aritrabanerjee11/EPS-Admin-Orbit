import type { Operation, OperationExecutionContext, OperationExecutionResult } from "../../domain/operation";
import type { ChatSession, CollectedFields, PreviewData } from "../../types/chat";
import { validateFields } from "../../application/conversation/fieldCollection";
import { createUserManifest } from "./manifest";

export const createUserOperation: Operation = {
  id: createUserManifest.id,
  name: createUserManifest.name,
  manifest: createUserManifest,
  collect(_message: string, session: ChatSession): CollectedFields {
    return session.collectedFields;
  },
  validate(inputs: CollectedFields, session: ChatSession) {
    if (!createUserManifest.enabled) {
      return {
        valid: false,
        missingFields: [],
        errors: [
          {
            category: "VALIDATION",
            message: "Create User is prepared but disabled for V1.",
            retryable: false
          }
        ]
      };
    }

    return validateFields(createUserManifest.fields, inputs, session);
  },
  preview(inputs: CollectedFields, session: ChatSession): PreviewData {
    return {
      operationId: "create_user",
      operationName: createUserManifest.name,
      fields: createUserManifest.fields
        .filter((field) => field.preview && inputs[field.key] !== undefined)
        .map((field) => ({ key: field.key, label: field.label, value: inputs[field.key] as string | number })),
      requestSnapshot: {
        operation: "create_user",
        inputs,
        timestamp: new Date().toISOString(),
        requestId: session.requestId,
        provider: session.providerTarget
      }
    };
  },
  async execute(_context: OperationExecutionContext): Promise<OperationExecutionResult> {
    throw new Error("Create User is prepared but disabled for V1.");
  }
};
