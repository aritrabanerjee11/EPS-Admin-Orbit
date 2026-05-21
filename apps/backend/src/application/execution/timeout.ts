export function withRequestTimeout(controller: AbortController, timeoutMs: number): NodeJS.Timeout {
  return setTimeout(() => {
    controller.abort();
  }, timeoutMs);
}
