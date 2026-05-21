export type AssistantSuggestionInput = {
  message: string;
  operationId?: string;
};

export type AssistantExplanationInput = {
  error: string;
  operationId?: string;
};

export interface AssistantService {
  suggest(input: AssistantSuggestionInput): Promise<string[]>;
  explain(input: AssistantExplanationInput): Promise<string>;
}

export class NoopAssistantService implements AssistantService {
  async suggest(_input: AssistantSuggestionInput): Promise<string[]> {
    return [];
  }

  async explain(input: AssistantExplanationInput): Promise<string> {
    return input.error;
  }
}
