import type { SessionState } from "./SessionState";

const KEY = "mindvault-ui-session";

export function loadSessionState(): Partial<SessionState> {
  try {
    const value = sessionStorage.getItem(KEY);
    return value ? (JSON.parse(value) as SessionState) : {};
  } catch {
    return {};
  }
}

export function saveSessionState(state: SessionState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function clearSessionState() {
  sessionStorage.removeItem(KEY);
}
