import { create } from "zustand";
import type {
  ChatMessage,
  ChatSession,
  ChatStatus,
  ConfirmResult,
  ExecutionHistoryItem,
  PreviewData,
  ProviderTarget
} from "../types/chat";

type ChatStore = {
  messages: ChatMessage[];
  session: ChatSession;
  preview?: PreviewData;
  result?: ConfirmResult;
  error?: string;
  draftSaved: boolean;
  history: ExecutionHistoryItem[];
  addMessage: (role: ChatMessage["role"], content: string) => void;
  setSession: (session: ChatSession) => void;
  setSessionStatus: (status: ChatStatus) => void;
  setProviderTarget: (providerTarget: ProviderTarget) => void;
  setPreview: (preview?: PreviewData) => void;
  setResult: (result?: ConfirmResult) => void;
  setError: (error?: string) => void;
  resetForEdit: () => void;
  resetSession: () => void;
  resumePreviousSession: () => void;
  updateCollectedField: (key: string, value: string | number | undefined) => void;
  addHistory: (result: ConfirmResult) => void;
};

const SESSION_KEY = "eps-admin-orbit-session";
const MESSAGES_KEY = "eps-admin-orbit-messages";
const HISTORY_KEY = "eps-admin-orbit-history";

const savedSessionAtStartup = loadSession();
const initialSession = createInitialSession(normalizeProviderTarget(savedSessionAtStartup?.providerTarget));
const initialMessages = [
  {
    id: createMessageId(),
    role: "bot" as const,
    content: "Ready for EPS administrative workflows.",
    createdAt: new Date().toISOString()
  }
];

export const useChatStore = create<ChatStore>((set) => ({
  messages: initialMessages,
  session: initialSession,
  preview: undefined,
  result: undefined,
  error: undefined,
  draftSaved: Boolean(savedSessionAtStartup),
  history: loadHistory(),

  addMessage: (role, content) =>
    set((state) => {
      const messages = [
        ...state.messages,
        {
          id: createMessageId(),
          role,
          content,
          createdAt: new Date().toISOString()
        }
      ];
      saveMessages(messages);
      return { messages };
    }),

  setSession: (session) =>
    set(() => {
      saveSession(session);
      return { session, draftSaved: true };
    }),

  setSessionStatus: (status) =>
    set((state) => {
      const session = {
        ...state.session,
        state: status,
        status,
        updatedAt: new Date().toISOString()
      };
      saveSession(session);
      return { session, draftSaved: true };
    }),

  setProviderTarget: (providerTarget) =>
    set((state) => {
      const session = {
        ...state.session,
        providerTarget,
        updatedAt: new Date().toISOString()
      };
      saveSession(session);
      return { session, draftSaved: true };
    }),

  setPreview: (preview) =>
    set((state) => {
      const session = preview
        ? {
            ...state.session,
            requestSnapshot: preview.requestSnapshot,
            updatedAt: new Date().toISOString()
          }
        : state.session;
      saveSession(session);
      return { preview, session, draftSaved: true };
    }),

  setResult: (result) => set({ result }),

  setError: (error) => set({ error }),

  resetForEdit: () =>
    set((state) => {
      const session = {
        ...state.session,
        state: "COLLECTING" as const,
        status: "COLLECTING" as const,
        executionLock: undefined,
        updatedAt: new Date().toISOString()
      };
      saveSession(session);
      return {
        preview: undefined,
        result: undefined,
        session,
        draftSaved: true
      };
    }),

  resetSession: () =>
    set((state) => {
      const session = createInitialSession(state.session.providerTarget);
      const messages = [
        {
          id: createMessageId(),
          role: "bot" as const,
          content: "Session reset.",
          createdAt: new Date().toISOString()
        }
      ];
      clearSavedDraft();
      return {
        session,
        messages,
        preview: undefined,
        result: undefined,
        error: undefined,
        draftSaved: Boolean(loadSession())
      };
    }),

  resumePreviousSession: () =>
    set((state) => {
      const session = loadSession() ?? state.session;
      const messages = loadMessages() ?? state.messages;
      return { session, messages, draftSaved: Boolean(loadSession()) };
    }),

  addHistory: (result) =>
    set((state) => {
      const item: ExecutionHistoryItem = {
        time: result.metadata.timestamp,
        operation: result.preview.operationName,
        status: result.metadata.status,
        traceId: result.metadata.traceId,
        durationMs: result.metadata.durationMs,
        provider: result.metadata.provider
      };
      const history = [item, ...state.history].slice(0, 10);
      saveHistory(history);
      return { history };
    }),

  updateCollectedField: (key, value) =>
    set((state) => {
      const collectedFields = {
        ...state.session.collectedFields,
        [key]: value
      };

      if (value === undefined || value === "") {
        delete collectedFields[key];
      }

      const session = {
        ...state.session,
        collectedFields,
        state: state.session.state === "IDLE" ? "COLLECTING" as const : state.session.state,
        status: state.session.state === "IDLE" ? "COLLECTING" as const : state.session.status,
        updatedAt: new Date().toISOString()
      };

      saveSession(session);
      return {
        session,
        preview: undefined,
        result: undefined,
        draftSaved: true
      };
    })
}));

function createInitialSession(providerTarget: ProviderTarget = "DEV"): ChatSession {
  const now = new Date().toISOString();

  return {
    sessionId: createMessageId(),
    requestId: createMessageId(),
    operation: "generate_codes",
    activeOperationId: "generate_codes",
    collectedFields: {
      environment: providerTarget
    },
    state: "IDLE",
    status: "IDLE",
    providerTarget,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeProviderTarget(providerTarget: unknown): ProviderTarget {
  return providerTarget === "TEST" || providerTarget === "PREPROD" || providerTarget === "PROD" ? providerTarget : "DEV";
}

function createMessageId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadSession(): ChatSession | undefined {
  return readJson<ChatSession>(SESSION_KEY);
}

function saveSession(session: ChatSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadMessages(): ChatMessage[] | undefined {
  return readJson<ChatMessage[]>(MESSAGES_KEY);
}

function saveMessages(messages: ChatMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

function clearSavedDraft(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(MESSAGES_KEY);
}

function loadHistory(): ExecutionHistoryItem[] {
  return readJson<ExecutionHistoryItem[]>(HISTORY_KEY) ?? [];
}

function saveHistory(history: ExecutionHistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function readJson<T>(key: string): T | undefined {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}
