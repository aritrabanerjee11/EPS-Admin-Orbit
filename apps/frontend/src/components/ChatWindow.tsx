import { Ban, Check, Eye, Pencil } from "lucide-react";
import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import type { ChatSession } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

type ChatWindowProps = {
  session: ChatSession;
  error?: string;
  isBusy: boolean;
  onSend: (message: string) => Promise<void>;
  onPreview: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onCancel: () => Promise<void>;
  onEdit: () => void;
  isSlowExecution: boolean;
  onContinueWaiting: () => void;
};

export function ChatWindow({
  session,
  error,
  isBusy,
  onSend,
  onPreview,
  onConfirm,
  onCancel,
  onEdit,
  isSlowExecution,
  onContinueWaiting
}: ChatWindowProps) {
  const messages = useChatStore((state) => state.messages);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const showActions = session.state === "PREVIEW" || session.state === "EXECUTING";

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isBusy]);

  return (
    <div className="flex min-h-[620px] flex-1 flex-col rounded-md border border-zinc-200 bg-white shadow-sm lg:min-h-0">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Operations Chat</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isBusy ? <TypingIndicator /> : null}
          <div ref={streamEndRef} />
        </div>
      </div>

      {error ? (
        <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isSlowExecution ? (
        <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>Still generating...</span>
          <div className="flex gap-2">
            <button type="button" onClick={onContinueWaiting} className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium">
              Continue waiting
            </button>
            <button type="button" onClick={() => void onCancel()} className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium">
              Cancel Request
            </button>
          </div>
        </div>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap gap-2 border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            title="Preview"
            onClick={onPreview}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Eye size={16} aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            title="Confirm"
            onClick={onConfirm}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={16} aria-hidden="true" />
            Confirm
          </button>
          <button
            type="button"
            title="Edit"
            onClick={onEdit}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          {session.state === "EXECUTING" ? (
            <button
              type="button"
              title="Cancel Request"
              onClick={() => void onCancel()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <Ban size={16} aria-hidden="true" />
              Cancel Request
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-zinc-200 px-4 py-3">
        <QuickAction label="Generate access codes" onClick={() => void onSend("Generate access codes")} disabled={isBusy} />
        <QuickAction label="Preview" onClick={() => void onPreview()} disabled={isBusy} />
        <QuickAction label="Confirm" onClick={() => void onConfirm()} disabled={isBusy} />
        <QuickAction label="Reset" onClick={() => void onSend("reset")} disabled={isBusy} />
      </div>

      <ChatInput disabled={isBusy} onSend={onSend} onPreview={onPreview} onConfirm={onConfirm} />
    </div>
  );
}

function QuickAction({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-8 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:240ms]" />
      </div>
    </div>
  );
}
