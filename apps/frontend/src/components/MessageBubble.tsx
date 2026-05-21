import type { ChatMessage } from "../types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] rounded-md px-3 py-2 text-sm leading-6 shadow-sm sm:max-w-[72%] ${
          isUser
            ? "bg-zinc-950 text-white"
            : "border border-zinc-200 bg-zinc-50 text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-line break-words">{message.content}</p>
      </div>
    </div>
  );
}
