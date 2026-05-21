import type { CodeProvider, GenerateCodesInput, GenerateCodesResult, LookupCodesInput, LookupCodesResult } from "../CodeProvider";

export class SoapCodeProvider implements CodeProvider {
  async generate(_input: GenerateCodesInput): Promise<GenerateCodesResult> {
    throw new Error("Provider unavailable.");
  }

  async lookup(_input: LookupCodesInput): Promise<LookupCodesResult> {
    throw new Error("Provider unavailable.");
  }
}
