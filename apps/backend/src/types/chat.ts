export type Operation = "generate_codes" | "create_user" | "lookup";

export enum SessionState {
  IDLE = "IDLE",
  COLLECTING = "COLLECTING",
  PREVIEW = "PREVIEW",
  EXECUTING = "EXECUTING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED"
}

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

export type ExecutionLock = {
  requestId: string;
  status: "RUNNING" | "COMPLETED" | "CANCELLED" | "FAILED";
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
  executionLock?: ExecutionLock;
  requestSnapshot?: RequestSnapshot;
  createdAt: string;
  updatedAt: string;
};

export type RequiredField = string;

export type ChatMode = "idle" | "collect" | "preview" | "executing" | "completed" | "failed";

export type StructuredError = {
  category: "VALIDATION" | "PROVIDER" | "NETWORK" | "SYSTEM";
  message: string;
  retryable: boolean;
};

export type OperationEventType =
  | "FIELD_COLLECTED"
  | "PREVIEW_OPENED"
  | "CONFIRMED"
  | "PROVIDER_STARTED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "RESET"
  | "INTENT_SWITCH_REQUESTED";

export type OperationEvent = {
  type: OperationEventType;
  traceId?: string;
  requestId: string;
  sessionId: string;
  operation: Operation;
  timestamp: string;
  details?: Record<string, unknown>;
};

export type ChatResponse = {
  session: ChatSession;
  mode: ChatMode;
  next?: RequiredField;
  missingFields: RequiredField[];
  assistantMessage: string;
  preview?: PreviewData;
  error?: StructuredError;
  events?: OperationEvent[];
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
