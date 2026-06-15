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
  onFieldChange: (key: string, value: string | number | undefined) => void;
};

const activationFields = [
  { key: "quantity", label: "Number of Tokens", type: "number" },
  { key: "allowedUsages", label: "Allowed Usages", type: "number" },
  { key: "productId", label: "ISBN or Product ID", type: "text" },
  { key: "environment", label: "Environment", type: "select", options: ["DEV", "TEST", "PREPROD", "PROD"] },
  { key: "systemId", label: "System ID", type: "select", options: ["olb", "vst"] },
  { key: "validFrom", label: "Valid From", type: "date" },
  { key: "validTo", label: "Valid To", type: "date" },
  { key: "batchName", label: "Batch", type: "text" }
] as const;

export function PreviewCard({ preview, session, isBusy, onPreview, onConfirm, onEdit, onFieldChange }: PreviewCardProps) {
  const canPreview = session.state === "PREVIEW" || Boolean(preview);
  const fields = session.collectedFields;
  const batchName = String(preview?.requestSnapshot.inputs.batchName ?? fields.batchName ?? "request");

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Activation Request</h2>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3">
          {activationFields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={field.key === "environment" ? fields.environment ?? session.providerTarget : fields[field.key]}
              disabled={isBusy}
              onChange={onFieldChange}
            />
          ))}
        </div>

        {preview ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <h3 className="mb-3 text-sm font-semibold text-zinc-950">Preview</h3>
            <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-zinc-500">Operation:</dt>
              <dd className="font-medium text-zinc-950">{preview.operationName}</dd>
              {preview.fields.map((field) => (
                <FieldRow key={field.key} label={field.label} value={field.value} />
              ))}
              <dt className="text-zinc-500">Environment:</dt>
              <dd className="font-medium text-zinc-950">{session.providerTarget.toLowerCase()}</dd>
              <dt className="text-zinc-500">Request:</dt>
              <dd className="break-all font-mono text-xs text-zinc-700">{session.requestId}</dd>
            </dl>
          </div>
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
            disabled={isBusy}
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

function FormField({
  field,
  value,
  disabled,
  onChange
}: {
  field: typeof activationFields[number];
  value: string | number | undefined;
  disabled: boolean;
  onChange: (key: string, value: string | number | undefined) => void;
}) {
  const commonClass =
    "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-100";

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-zinc-700">{field.label}</span>
      {field.type === "select" ? (
        <select
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(event) => onChange(field.key, event.target.value || undefined)}
          className={commonClass}
        >
          <option value="">Select</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option.toLowerCase()}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = field.type === "number" ? Number(event.target.value) : event.target.value;
            onChange(field.key, event.target.value === "" ? undefined : nextValue);
          }}
          className={commonClass}
        />
      )}
    </label>
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
