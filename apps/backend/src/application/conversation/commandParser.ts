import type { Operation, ProviderTarget } from "../../types/chat";

export type ParsedCommand =
  | { type: "preview" }
  | { type: "confirm" }
  | { type: "cancel" }
  | { type: "reset" }
  | { type: "retry" }
  | { type: "switch_provider"; providerTarget: ProviderTarget }
  | { type: "intent"; operationId: Operation }
  | { type: "message" };

export function parseCommand(message: string): ParsedCommand {
  const normalized = message.trim().toLowerCase();

  if (/^(preview|show preview|review)$/i.test(message.trim())) {
    return { type: "preview" };
  }

  if (/^(confirm|execute|run)$/i.test(message.trim())) {
    return { type: "confirm" };
  }

  if (/^(cancel|cancel request|stop)$/i.test(message.trim())) {
    return { type: "cancel" };
  }

  if (/^(reset|start over|discard)$/i.test(message.trim())) {
    return { type: "reset" };
  }

  if (/^(retry|try again)$/i.test(message.trim())) {
    return { type: "retry" };
  }

  const providerMatch = normalized.match(/\b(?:switch(?: provider)? to|use)\s+(mock|preprod|prod)\b/);
  if (providerMatch?.[1]) {
    return { type: "switch_provider", providerTarget: providerMatch[1].toUpperCase() as ProviderTarget };
  }

  if (/\bcreate\s+user\b|\buser\s+creation\b/.test(normalized)) {
    return { type: "intent", operationId: "create_user" };
  }

  if (/\blookup\b|\bsearch\b/.test(normalized)) {
    return { type: "intent", operationId: "lookup" };
  }

  if (/\bgenerate\b.*\bcodes?\b|\bcodes?\b.*\bgenerate\b/.test(normalized)) {
    return { type: "intent", operationId: "generate_codes" };
  }

  return { type: "message" };
}
