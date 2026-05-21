import type { ChatSession, PreviewData } from "../types/chat";
import { buildPreviewResponse } from "../application/conversation/conversationEngine";

export function buildPreview(session: Partial<ChatSession>): { session: ChatSession; preview: PreviewData } {
  const data = buildPreviewResponse(session);
  return { session: data.session, preview: data.preview };
}
