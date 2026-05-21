import type { Operation } from "../../domain/operation";
import type { Operation as OperationId } from "../../types/chat";
import { createUserOperation } from "../../operations/create-user/execute";
import { generateCodesOperation } from "../../operations/generate-codes/execute";
import { lookupOperation } from "../../operations/lookup/execute";

const operations = new Map<OperationId, Operation>([
  [generateCodesOperation.id, generateCodesOperation],
  [createUserOperation.id, createUserOperation],
  [lookupOperation.id, lookupOperation]
]);

export function getOperation(id: OperationId): Operation {
  const operation = operations.get(id);
  if (!operation) {
    throw new Error(`Operation is not registered: ${id}`);
  }

  return operation;
}

export function getOperations(): Operation[] {
  return Array.from(operations.values());
}
