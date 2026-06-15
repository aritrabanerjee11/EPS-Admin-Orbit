import { Copy, Download, RefreshCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { copyCodes, downloadCodes, downloadCodesCsv, type CodeView } from "../services/codeUtils";
import type { ConfirmResult } from "../types/chat";

type CodePanelProps = {
  result?: ConfirmResult;
  onRetry: () => Promise<void>;
  onSwitchToMock: () => void;
};

export function CodePanel({ result, onRetry, onSwitchToMock }: CodePanelProps) {
  const [view, setView] = useState<CodeView>("formatted");
  const [notice, setNotice] = useState<string>();
  const codes = result ? (view === "formatted" ? result.formattedCodes : result.rawCodes) : [];
  const batchName = String(result?.preview.requestSnapshot.inputs.batchName ?? "Batch-A");

  async function handleCopy(targetView: CodeView): Promise<void> {
    if (!result) {
      return;
    }

    await copyCodes(result.rawCodes, targetView);
    setNotice(targetView === "formatted" ? "Copied formatted codes." : "Copied raw codes.");
  }

  function handleDownloadTxt(): void {
    if (!result) {
      return;
    }

    downloadCodes(result.rawCodes, view, batchName);
    setNotice("TXT download created.");
  }

  function handleDownloadCsv(): void {
    if (!result) {
      return;
    }

    downloadCodesCsv(result.rawCodes, batchName);
    setNotice("CSV download created.");
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Generated Codes</h2>
        {result ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              result.generation.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.generation.success ? "Generated Successfully" : "Provider Down"}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        {result?.error ? (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{result.error.message}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRetry()}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-red-200 bg-white px-3 font-medium text-red-700 hover:bg-red-100"
              >
                <RefreshCcw size={15} aria-hidden="true" />
                Retry
              </button>
              <button
                type="button"
                onClick={onSwitchToMock}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-red-200 bg-white px-3 font-medium text-red-700 hover:bg-red-100"
              >
                <Shuffle size={15} aria-hidden="true" />
                Switch to dev
              </button>
            </div>
          </div>
        ) : null}

        {result?.generation.success ? (
          <>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
              <div>
                <span className="block text-zinc-500">Trace</span>
                <span className="break-all font-mono">{result.metadata.traceId}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Provider</span>
                <span className="font-medium">{result.metadata.provider}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Duration</span>
                <span className="font-medium">{result.metadata.durationMs}ms</span>
              </div>
              <div>
                <span className="block text-zinc-500">Status</span>
                <span className="font-medium">{result.metadata.status}</span>
              </div>
            </div>

            <div className="flex rounded-md border border-zinc-300 p-1">
              <button
                type="button"
                onClick={() => setView("formatted")}
                className={`h-8 flex-1 rounded px-3 text-sm font-medium ${
                  view === "formatted" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Formatted
              </button>
              <button
                type="button"
                onClick={() => setView("raw")}
                className={`h-8 flex-1 rounded px-3 text-sm font-medium ${
                  view === "raw" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Raw
              </button>
            </div>

            <div className="max-h-72 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm leading-6 text-zinc-900">
              {codes.map((code) => (
                <div key={code}>{code}</div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
              <button
                type="button"
                title="Copy Formatted"
                onClick={() => void handleCopy("formatted")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                <Copy size={16} aria-hidden="true" />
                Copy Formatted
              </button>
              <button
                type="button"
                title="Copy Raw"
                onClick={() => void handleCopy("raw")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                <Copy size={16} aria-hidden="true" />
                Copy Raw
              </button>
              <button
                type="button"
                title="Download TXT"
                onClick={handleDownloadTxt}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Download size={16} aria-hidden="true" />
                Download TXT
              </button>
              <button
                type="button"
                title="Download CSV"
                onClick={handleDownloadCsv}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Download size={16} aria-hidden="true" />
                Download CSV
              </button>
            </div>
          </>
        ) : !result ? (
          <p className="text-sm text-zinc-600">No Codes.</p>
        ) : null}

        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      </div>
    </div>
  );
}
