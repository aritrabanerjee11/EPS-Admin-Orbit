import type {
  ChatSession,
  CollectedFields,
  Operation as OperationId,
  PreviewData,
  ProviderTarget,
  RequiredField,
  StructuredError
} from "../types/chat";

export type FieldType = "text" | "number" | "select";

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  preview: boolean;
  sensitive?: boolean;
  options?: string[];
  defaultValue?: string | number;
  requiredForProviders?: ProviderTarget[];
};

export type OperationCommand = "preview" | "confirm" | "cancel" | "reset" | "edit" | "retry";

export type OperationManifest = {
  id: OperationId;
  name: string;
  description: string;
  provider: "code" | "admin" | "lookup";
  enabled: boolean;
  fields: FieldDefinition[];
  commands: OperationCommand[];
};

export type OperationValidation = {
  valid: boolean;
  missingFields: RequiredField[];
  errors: StructuredError[];
};

export type OperationExecutionContext = {
  session: ChatSession;
  inputs: CollectedFields;
  providerTarget: ProviderTarget;
  traceId: string;
  requestId: string;
  signal: AbortSignal;
};

export type OperationExecutionResult = {
  success: boolean;
  output: unknown;
  provider: string;
};

export interface Operation {
  id: OperationId;
  name: string;
  manifest: OperationManifest;
  collect(message: string, session: ChatSession): CollectedFields;
  validate(inputs: CollectedFields, session: ChatSession): OperationValidation;
  preview(inputs: CollectedFields, session: ChatSession): PreviewData;
  execute(context: OperationExecutionContext): Promise<OperationExecutionResult>;
}
