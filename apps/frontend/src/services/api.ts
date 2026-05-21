import type { ChatResponse, ChatSession, ConfirmResult, LogsResponse, PreviewData, ProviderHealth, StructuredError } from "../types/chat";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: string;
  structuredError?: StructuredError;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function postChat(payload: { message: string; session: ChatSession }): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", payload);
}

export async function postPreview(session: ChatSession): Promise<{ session: ChatSession; preview: PreviewData }> {
  return request<{ session: ChatSession; preview: PreviewData }>("/api/preview", { session });
}

export async function postConfirm(session: ChatSession): Promise<{ session: ChatSession; result: ConfirmResult }> {
  return request<{ session: ChatSession; result: ConfirmResult }>("/api/confirm", { session });
}

export async function postCancel(session: ChatSession): Promise<{ cancelled: boolean }> {
  return request<{ cancelled: boolean }>("/api/cancel", { session });
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  return getRequest<ProviderHealth[]>("/api/providers/health");
}

export async function getLogs(): Promise<LogsResponse> {
  return getRequest<LogsResponse>("/api/logs");
}

async function request<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw createApiError(json.success ? "Request failed" : json.error, json.success ? undefined : json.structuredError);
  }

  return json.data;
}

async function getRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw createApiError(json.success ? "Request failed" : json.error, json.success ? undefined : json.structuredError);
  }

  return json.data;
}

function createApiError(message: string, structuredError?: StructuredError): Error {
  const error = new Error(structuredError?.message ?? message);
  if (structuredError) {
    Object.assign(error, { structuredError });
  }
  return error;
}
