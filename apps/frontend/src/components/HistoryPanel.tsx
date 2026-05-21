import type { ExecutionHistoryItem, LogsResponse } from "../types/chat";

type HistoryPanelProps = {
  history: ExecutionHistoryItem[];
  logs?: LogsResponse;
};

export function HistoryPanel({ history, logs }: HistoryPanelProps) {
  const completed = history.filter((item) => item.status === "SUCCESS").length;
  const avgDuration = completed
    ? Math.round(history.filter((item) => item.status === "SUCCESS").reduce((sum, item) => sum + item.durationMs, 0) / completed)
    : 0;
  const completionRate = history.length ? Math.round((completed / history.length) * 100) : 0;
  const executionLogs = logs?.execution.slice(-5).reverse() ?? [];

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Execution History</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="Avg" value={avgDuration ? `${avgDuration}ms` : "0ms"} />
          <Metric label="Complete" value={`${completionRate}%`} />
          <Metric label="Recent" value={String(history.length)} />
        </div>

        {history.length ? (
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <div key={`${item.traceId}-${item.time}`} className="rounded-md border border-zinc-200 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900">{item.operation}</span>
                  <span className={item.status === "SUCCESS" ? "text-emerald-700" : "text-red-700"}>{item.status}</span>
                </div>
                <div className="mt-1 break-all font-mono text-zinc-500">{item.traceId}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No recent actions.</p>
        )}

        <div className="border-t border-zinc-200 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">Logs</h3>
          {executionLogs.length ? (
            <div className="max-h-36 space-y-2 overflow-auto font-mono text-xs text-zinc-600">
              {executionLogs.map((entry, index) => (
                <div key={index} className="break-all rounded bg-zinc-50 p-2">
                  {JSON.stringify(entry)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Logs visible after first action.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
      <span className="block text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-950">{value}</span>
    </div>
  );
}
