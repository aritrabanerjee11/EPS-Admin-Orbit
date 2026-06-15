import { randomInt } from "node:crypto";
import { featureFlags } from "../../application/config";
import type { CodeProvider, GenerateCodesInput, GenerateCodesResult, LookupCodesInput, LookupCodesResult } from "../CodeProvider";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const ALPHANUMERIC = `${LETTERS}${DIGITS}`;
const CODE_LENGTH = 12;

export class MockCodeProvider implements CodeProvider {
  async generate(input: GenerateCodesInput): Promise<GenerateCodesResult> {
    const codes = new Set<string>();

    while (codes.size < input.quantity) {
      if (input.signal.aborted) {
        throw new Error("Execution cancelled.");
      }

      const index = codes.size;
      codes.add(featureFlags.enableDemo ? generateDeterministicCode(input, index) : generateCode(input.codeType));
    }

    return {
      batchName: input.batchName,
      environment: input.environment,
      codeType: input.codeType,
      codes: Array.from(codes),
      generatedAt: new Date().toISOString(),
      provider: `DEMO ${input.providerTarget}`
    };
  }

  async lookup(_input: LookupCodesInput): Promise<LookupCodesResult> {
    return {
      codes: []
    };
  }
}

function generateCode(codeType: string): string {
  const characters = getCharacters(codeType);
  let code = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += characters[randomInt(characters.length)];
  }

  return code;
}

function generateDeterministicCode(input: GenerateCodesInput, index: number): string {
  const characters = getCharacters(input.codeType);
  const seed = `${input.batchName}:${input.environment}:${input.codeType}:${index}`;
  let hash = 2166136261;
  let code = "";

  for (let indexSeed = 0; indexSeed < seed.length; indexSeed += 1) {
    hash ^= seed.charCodeAt(indexSeed);
    hash = Math.imul(hash, 16777619);
  }

  for (let codeIndex = 0; codeIndex < CODE_LENGTH; codeIndex += 1) {
    hash ^= codeIndex + index;
    hash = Math.imul(hash, 16777619);
    code += characters[Math.abs(hash) % characters.length];
  }

  return code;
}

function getCharacters(codeType: string): string {
  const normalized = codeType.toLowerCase();

  if (normalized.includes("alphanumeric") || normalized.includes("alpha numeric")) {
    return ALPHANUMERIC;
  }

  if (normalized.includes("numeric")) {
    return DIGITS;
  }

  if (normalized.includes("alpha") && !normalized.includes("numeric")) {
    return LETTERS;
  }

  return ALPHANUMERIC;
}
