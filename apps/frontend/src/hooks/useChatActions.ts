import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getLogs, getProviderHealth, postCancel, postChat, postConfirm, postPreview } from "../services/api";
import { useChatStore } from "../store/chatStore";
import type { ProviderTarget } from "../types/chat";

export function useChatActions() {
  const addMessage = useChatStore((state) => state.addMessage);
  const setSession = useChatStore((state) => state.setSession);
  const setSessionStatus = useChatStore((state) => state.setSessionStatus);
  const setProviderTarget = useChatStore((state) => state.setProviderTarget);
  const setPreview = useChatStore((state) => state.setPreview);
  const setResult = useChatStore((state) => state.setResult);
  const setError = useChatStore((state) => state.setError);
  const resetForEdit = useChatStore((state) => state.resetForEdit);
  const resetSession = useChatStore((state) => state.resetSession);
  const resumePreviousSession = useChatStore((state) => state.resumePreviousSession);
  const addHistory = useChatStore((state) => state.addHistory);
  const [isSlowExecution, setIsSlowExecution] = useState(false);

  const chatMutation = useMutation({ mutationFn: postChat });
  const previewMutation = useMutation({ mutationFn: postPreview });
  const confirmMutation = useMutation({ mutationFn: postConfirm });
  const cancelMutation = useMutation({ mutationFn: postCancel });
  const providerHealthQuery = useQuery({
    queryKey: ["provider-health"],
    queryFn: getProviderHealth,
    refetchInterval: 15000
  });
  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: getLogs,
    refetchInterval: 5000
  });
  const isBusy = chatMutation.isPending || previewMutation.isPending || confirmMutation.isPending;

  useEffect(() => {
    if (!confirmMutation.isPending) {
      setIsSlowExecution(false);
      return;
    }

    const timer = window.setTimeout(() => setIsSlowExecution(true), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmMutation.isPending]);

  async function sendMessage(content: string): Promise<void> {
    const message = content.trim();
    if (!message || isBusy) {
      return;
    }

    addMessage("user", message);

    const normalized = message.toLowerCase();
    if (normalized === "preview" || normalized === "show preview") {
      await showPreview();
      return;
    }

    if (normalized === "confirm") {
      await confirm();
      return;
    }

    if (normalized === "cancel" || normalized === "cancel request") {
      await cancel();
      return;
    }

    if (normalized === "reset") {
      resetSession();
      return;
    }

    try {
      setError(undefined);
      setResult(undefined);
      const session = useChatStore.getState().session;
      const data = await chatMutation.mutateAsync({ message, session });

      setSession(data.session);
      if (data.preview) {
        setPreview(data.preview);
      } else if (data.mode !== "preview") {
        setPreview(undefined);
      }
      addMessage("bot", data.assistantMessage);
    } catch (error) {
      reportError(error);
    }
  }

  async function showPreview(): Promise<void> {
    try {
      setError(undefined);
      setResult(undefined);
      const session = useChatStore.getState().session;
      const data = await previewMutation.mutateAsync(session);

      setSession(data.session);
      setPreview(data.preview);
      addMessage("bot", "Preview ready.");
    } catch (error) {
      reportError(error);
    }
  }

  async function confirm(): Promise<void> {
    try {
      setError(undefined);
      setSessionStatus("EXECUTING");
      const session = useChatStore.getState().session;
      const data = await confirmMutation.mutateAsync(session);

      setSession(data.session);
      setPreview(data.result.preview);
      setResult(data.result);

      if (data.result.error || !data.result.generation.success) {
        addMessage("bot", data.result.error?.message ?? "Provider unavailable.");
        setError(data.result.error?.message ?? "Provider unavailable.");
      } else {
        addMessage("bot", "Generated successfully.");
        addHistory(data.result);
      }
    } catch (error) {
      setSessionStatus("FAILED");
      reportError(error);
    }
  }

  async function cancel(): Promise<void> {
    try {
      const session = useChatStore.getState().session;
      const data = await cancelMutation.mutateAsync(session);
      setSessionStatus("FAILED");
      addMessage("bot", data.cancelled ? "Execution cancelled." : "No active execution to cancel.");
    } catch (error) {
      reportError(error);
    }
  }

  function edit(): void {
    resetForEdit();
    addMessage("bot", "What should change?");
  }

  function switchProvider(providerTarget: ProviderTarget): void {
    setProviderTarget(providerTarget);
    setPreview(undefined);
    setResult(undefined);
    addMessage("bot", `Provider set to ${providerTarget}.`);
  }

  function continueWaiting(): void {
    setIsSlowExecution(false);
  }

  function reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    setError(message);
    addMessage("bot", message);
  }

  return {
    sendMessage,
    showPreview,
    confirm,
    cancel,
    edit,
    switchProvider,
    continueWaiting,
    resumePreviousSession,
    isBusy,
    isExecuting: confirmMutation.isPending,
    isSlowExecution,
    providerHealth: providerHealthQuery.data ?? [],
    logs: logsQuery.data
  };
}
