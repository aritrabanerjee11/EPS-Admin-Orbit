import { Send } from "lucide-react";
import { FormEvent, useState } from "react";

type ChatInputProps = {
  disabled: boolean;
  onSend: (message: string) => Promise<void>;
  onPreview: () => Promise<void>;
  onConfirm: () => Promise<void>;
};

export function ChatInput({ disabled, onSend, onPreview, onConfirm }: ChatInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const message = value.trim();

    if (!message || disabled) {
      return;
    }

    setValue("");
    await onSend(message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-200 p-4">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            void onConfirm();
            return;
          }

          if (event.key === "Enter" && event.ctrlKey) {
            event.preventDefault();
            void onPreview();
          }
        }}
        disabled={disabled}
        placeholder="Message EPS Admin Orbit"
        className="h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
      />
      <button
        type="submit"
        title="Send"
        disabled={disabled || !value.trim()}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={18} aria-hidden="true" />
        <span className="sr-only">Send</span>
      </button>
    </form>
  );
}
