import type { Operation, OperationExecutionContext, OperationExecutionResult } from "../../domain/operation";
import type { ChatSession, CollectedFields, PreviewData } from "../../types/chat";
import { validateFields } from "../../application/conversation/fieldCollection";
import { lookupManifest } from "./manifest";

export const lookupOperation: Operation = {
  id: lookupManifest.id,
  name: lookupManifest.name,
  manifest: lookupManifest,
  collect(_message: string, session: ChatSession): CollectedFields {
    return session.collectedFields;
  },
  validate(inputs: CollectedFields, session: ChatSession) {
    if (!lookupManifest.enabled) {
      return {
        valid: false,
        missingFields: [],
        errors: [
          {
            category: "VALIDATION",
            message: "Lookup is prepared but disabled for V1.",
            retryable: false
          }
        ]
      };
    }

    return validateFields(lookupManifest.fields, inputs, session);
  },
  preview(inputs: CollectedFields, session: ChatSession): PreviewData {
    return {
      operationId: "lookup",
      operationName: lookupManifest.name,
      fields: lookupManifest.fields
        .filter((field) => field.preview && inputs[field.key] !== undefined)
        .map((field) => ({ key: field.key, label: field.label, value: inputs[field.key] as string | number })),
      requestSnapshot: {
        operation: "lookup",
        inputs,
        timestamp: new Date().toISOString(),
        requestId: session.requestId,
        provider: session.providerTarget
      }
    };
  },
  async execute(_context: OperationExecutionContext): Promise<OperationExecutionResult> {
    throw new Error("Lookup is prepared but disabled for V1.");
  }
};
