export type Operation = "generate_codes" | "create_user" | "lookup";

export type SessionState = "IDLE" | "COLLECTING" | "PREVIEW" | "EXECUTING" | "SUCCESS" | "FAILED";

export type ChatStatus = SessionState;

export type ProviderTarget = "DEV" | "TEST" | "PREPROD" | "PROD";

export type CollectedFields = {
  quantity?: number;
  environment?: string;
  codeType?: string;
  batchName?: string;
  allowedUsages?: number;
  productId?: string;
  systemId?: string;
  validFrom?: string;
  validTo?: string;
  prodConfirmation?: string;
  [key: string]: string | number | undefined;
};

export type RequestSnapshot = {
  operation: Operation;
  inputs: CollectedFields;
  timestamp: string;
  requestId: string;
  provider: ProviderTarget;
};

export type ChatSession = {
  sessionId: string;
  requestId: string;
  traceId?: string;
  operation: Operation;
  activeOperationId: Operation;
  pendingOperationId?: Operation;
  collectedFields: CollectedFields;
  state: SessionState;
  status: ChatStatus;
  providerTarget: ProviderTarget;
  executionLock?: {
    requestId: string;
    status: "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED";
  };
  requestSnapshot?: RequestSnapshot;
  createdAt: string;
  updatedAt: string;
};

export type RequiredField = string;

export type StructuredError = {
  category: "VALIDATION" | "PROVIDER" | "NETWORK" | "SYSTEM";
  message: string;
  retryable: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  createdAt: string;
};

export type ChatResponse = {
  session: ChatSession;
  mode: "collect" | "preview";
  next?: RequiredField;
  missingFields: RequiredField[];
  assistantMessage: string;
  preview?: PreviewData;
  error?: StructuredError;
};

export type PreviewData = {
  operationId: Operation;
  operationName: string;
  fields: Array<{
    key: string;
    label: string;
    value: string | number;
  }>;
  requestSnapshot: RequestSnapshot;
};

export type ExecutionMetadata = {
  sessionId: string;
  requestId: string;
  traceId: string;
  timestamp: string;
  provider: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
};

export type GenerationResult = {
  success: boolean;
  codes: string[];
  traceId: string;
  provider: string;
};

export type ConfirmResult = {
  preview: PreviewData;
  generation: GenerationResult;
  rawCodes: string[];
  formattedCodes: string[];
  generatedAt: string;
  metadata: ExecutionMetadata;
  error?: StructuredError;
};

export type ProviderHealth = {
  target: ProviderTarget;
  label: string;
  status: "Healthy" | "Slow" | "Unavailable";
  active: boolean;
  provider: string;
};

export type ExecutionHistoryItem = {
  time: string;
  operation: string;
  status: string;
  traceId: string;
  durationMs: number;
  provider: string;
};

export type LogsResponse = {
  chat: Array<Record<string, unknown>>;
  provider: Array<Record<string, unknown>>;
  execution: Array<Record<string, unknown>>;
};
