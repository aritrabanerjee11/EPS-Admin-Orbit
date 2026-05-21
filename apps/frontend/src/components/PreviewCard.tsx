import { Check, Download, Eye, Pencil } from "lucide-react";
import { downloadRequestSnapshot } from "../services/codeUtils";
import type { ChatSession, PreviewData } from "../types/chat";

type PreviewCardProps = {
  preview?: PreviewData;
  session: ChatSession;
  isBusy: boolean;
  onPreview: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onEdit: () => void;
};

export function PreviewCard({ preview, session, isBusy, onPreview, onConfirm, onEdit }: PreviewCardProps) {
  const canPreview = session.state === "PREVIEW" || Boolean(preview);
  const batchName = String(preview?.requestSnapshot.inputs.batchName ?? "request");

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Preview</h2>
      </div>

      <div className="space-y-4 p-4">
        {preview ? (
          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-3 text-sm">
            <dt className="text-zinc-500">Operation:</dt>
            <dd className="font-medium text-zinc-950">{preview.operationName}</dd>
            {preview.fields.map((field) => (
              <FieldRow key={field.key} label={field.label} value={field.value} />
            ))}
            <dt className="text-zinc-500">Provider:</dt>
            <dd className="font-medium text-zinc-950">{session.providerTarget}</dd>
            <dt className="text-zinc-500">Request:</dt>
            <dd className="break-all font-mono text-xs text-zinc-700">{session.requestId}</dd>
          </dl>
        ) : (
          <p className="text-sm text-zinc-600">{canPreview ? "Preview available." : "Preview empty."}</p>
        )}

        {session.providerTarget === "PROD" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            PROD requires typing CONFIRM PROD before execution.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            title="Preview"
            onClick={onPreview}
            disabled={!canPreview || isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Eye size={16} aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            title="Confirm"
            onClick={onConfirm}
            disabled={!canPreview || isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={16} aria-hidden="true" />
            Confirm
          </button>
          <button
            type="button"
            title="Edit"
            onClick={onEdit}
            disabled={!canPreview || isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            title="Download Request"
            onClick={() => preview && downloadRequestSnapshot(preview.requestSnapshot, batchName)}
            disabled={!preview}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} aria-hidden="true" />
            Request
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <dt className="text-zinc-500">{label}:</dt>
      <dd className="break-words font-medium text-zinc-950">{value}</dd>
    </>
  );
}
