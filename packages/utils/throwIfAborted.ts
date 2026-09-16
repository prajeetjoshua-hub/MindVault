/**
 * React Native's AbortSignal does not expose throwIfAborted on every Android
 * runtime. Keep cancellation behavior identical without relying on that
 * optional convenience method.
 */
export function throwIfAborted(signal: AbortSignal) {
  if (!signal.aborted) return;
  const reason = (signal as AbortSignal & { reason?: unknown }).reason;
  if (reason instanceof Error) throw reason;
  const error = new Error("Operation cancelled");
  error.name = "AbortError";
  throw error;
}
