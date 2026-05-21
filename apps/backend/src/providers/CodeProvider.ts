import type { CompleteGenerateFields } from "../types/schemas";
import type { ProviderTarget } from "../types/chat";

export type GenerateCodesInput = CompleteGenerateFields & {
  providerTarget: ProviderTarget;
  traceId: string;
  signal: AbortSignal;
};

export type GenerateCodesResult = {
  batchName: string;
  environment: string;
  codeType: string;
  codes: string[];
  generatedAt: string;
  provider: string;
};

export type LookupCodesInput = {
  batchName: string;
};

export type LookupCodesResult = {
  codes: string[];
};

export interface CodeProvider {
  generate(input: GenerateCodesInput): Promise<GenerateCodesResult>;
  lookup(input: LookupCodesInput): Promise<LookupCodesResult>;
}
