import { z } from "zod";
import { SessionState } from "./chat";

const stateSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.toUpperCase();
  const legacyMap: Record<string, SessionState> = {
    COLLECTING: SessionState.COLLECTING,
    PREVIEW: SessionState.PREVIEW,
    EXECUTING: SessionState.EXECUTING,
    COMPLETED: SessionState.SUCCESS,
    SUCCESS: SessionState.SUCCESS,
    FAILED: SessionState.FAILED,
    IDLE: SessionState.IDLE
  };

  return legacyMap[normalized] ?? value;
}, z.nativeEnum(SessionState));

export const collectedFieldsSchema = z.object({
  quantity: z.number().int().min(1).max(100000).optional(),
  environment: z.string().trim().min(1).max(40).optional(),
  codeType: z.string().trim().min(1).max(40).optional(),
  batchName: z.string().trim().min(1).max(80).optional(),
  allowedUsages: z.number().int().min(1).max(100000).optional(),
  productId: z.string().trim().min(1).max(80).optional(),
  systemId: z.string().trim().min(1).max(40).optional(),
  validFrom: z.string().trim().min(1).max(20).optional(),
  validTo: z.string().trim().min(1).max(20).optional(),
  prodConfirmation: z.string().trim().max(40).optional()
}).catchall(z.union([z.string(), z.number(), z.undefined()]));

export const requestSnapshotSchema = z.object({
  operation: z.enum(["generate_codes", "create_user", "lookup"]),
  inputs: collectedFieldsSchema,
  timestamp: z.string(),
  requestId: z.string(),
  provider: z.preprocess((value) => value === "MOCK" ? "DEV" : value, z.enum(["DEV", "TEST", "PREPROD", "PROD"]))
});

export const chatSessionSchema = z.object({
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  traceId: z.string().optional(),
  operation: z.enum(["generate_codes", "create_user", "lookup"]).default("generate_codes"),
  activeOperationId: z.enum(["generate_codes", "create_user", "lookup"]).optional(),
  pendingOperationId: z.enum(["generate_codes", "create_user", "lookup"]).optional(),
  collectedFields: collectedFieldsSchema,
  state: stateSchema.optional(),
  status: stateSchema.optional(),
  providerTarget: z.preprocess((value) => value === "MOCK" ? "DEV" : value, z.enum(["DEV", "TEST", "PREPROD", "PROD"])).default("DEV"),
  executionLock: z.object({
    requestId: z.string(),
    status: z.enum(["RUNNING", "COMPLETED", "CANCELLED", "FAILED"])
  }).optional(),
  requestSnapshot: requestSnapshotSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  session: chatSessionSchema.optional()
});

export const sessionRequestSchema = z.object({
  session: chatSessionSchema
});

export const cancelRequestSchema = z.object({
  session: chatSessionSchema.optional(),
  requestId: z.string().optional(),
  traceId: z.string().optional()
});

export const completeGenerateFieldsSchema = collectedFieldsSchema.extend({
  quantity: z.number().int().min(1).max(100000),
  environment: z.string().trim().min(1).max(40),
  codeType: z.string().trim().min(1).max(40).optional().default("Numeric"),
  batchName: z.string().trim().min(1).max(80).optional().default("Batch-A"),
  allowedUsages: z.number().int().min(1).max(100000).optional().default(1),
  productId: z.string().trim().min(1).max(80),
  systemId: z.string().trim().min(1).max(40).optional().default("olb"),
  validFrom: z.string().trim().min(1).max(20),
  validTo: z.string().trim().min(1).max(20)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SessionRequest = z.infer<typeof sessionRequestSchema>;
export type CancelRequest = z.infer<typeof cancelRequestSchema>;
export type CompleteGenerateFields = z.infer<typeof completeGenerateFieldsSchema>;
