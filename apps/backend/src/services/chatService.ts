import type { ChatResponse } from "../types/chat";
import type { ChatRequest } from "../types/schemas";
import { handleConversation } from "../application/conversation/conversationEngine";

export function handleChat(request: ChatRequest): ChatResponse {
  return handleConversation(request);
}
