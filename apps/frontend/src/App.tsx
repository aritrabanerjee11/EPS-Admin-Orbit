import { Activity, CircleDot, RotateCcw } from "lucide-react";
import { ChatWindow } from "./components/ChatWindow";
import { CodePanel } from "./components/CodePanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { PreviewCard } from "./components/PreviewCard";
import { ProviderStatus } from "./components/ProviderStatus";
import { useChatActions } from "./hooks/useChatActions";
import { useChatStore } from "./store/chatStore";

export function App() {
  const actions = useChatActions();
  const session = useChatStore((state) => state.session);
  const preview = useChatStore((state) => state.preview);
  const result = useChatStore((state) => state.result);
  const error = useChatStore((state) => state.error);
  const draftSaved = useChatStore((state) => state.draftSaved);
  const history = useChatStore((state) => state.history);

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white">
              <CircleDot size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-6 text-zinc-950">EPS Admin Orbit</h1>
              <p className="text-sm text-zinc-600">Conversational Operations Console for EPS administrative workflows</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ProviderStatus active={session.providerTarget} providers={actions.providerHealth} onSwitch={actions.switchProvider} />
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Activity size={16} aria-hidden="true" />
              <span>{session.state}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_410px]">
        <section className="min-h-[620px] space-y-3">
          {draftSaved ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span>Draft Saved</span>
              <button
                type="button"
                onClick={actions.resumePreviousSession}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 font-medium text-emerald-800 hover:bg-emerald-100"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Resume Previous Session
              </button>
            </div>
          ) : null}

          <ChatWindow
            session={session}
            error={error}
            isBusy={actions.isBusy}
            isSlowExecution={actions.isSlowExecution}
            onCancel={actions.cancel}
            onConfirm={actions.confirm}
            onContinueWaiting={actions.continueWaiting}
            onEdit={actions.edit}
            onPreview={actions.showPreview}
            onSend={actions.sendMessage}
          />
        </section>
        <aside className="space-y-4">
          <PreviewCard
            preview={preview}
            session={session}
            isBusy={actions.isBusy}
            onConfirm={actions.confirm}
            onEdit={actions.edit}
            onPreview={actions.showPreview}
          />
          <CodePanel result={result} onRetry={actions.confirm} onSwitchToMock={() => actions.switchProvider("MOCK")} />
          <HistoryPanel history={history} logs={actions.logs} />
        </aside>
      </main>
    </div>
  );
}
