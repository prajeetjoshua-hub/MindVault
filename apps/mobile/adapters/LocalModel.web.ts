import type {
  ModelAdapter,
  ModelRequest,
} from "../../../packages/contracts/types";
export class LocalModel implements ModelAdapter {
  private readonly storageKey = "mindvault-qwen-session";
  modelName = "not-connected";
  private token = "";
  private active?: AbortController;
  ready() {
    return Boolean(this.token);
  }
  async autoConnect() {
    const token = sessionStorage.getItem(this.storageKey);
    if (!token) return false;
    try {
      await this.importFile(token);
      return true;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return false;
    }
  }
  async generate(request: ModelRequest): Promise<string> {
    if (!this.token)
      throw new Error("Desktop conversation model is not connected");
    request.signal.throwIfAborted();
    const active = new AbortController();
    this.active = active;
    const abort = () => active.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 90_000);
    try {
      try {
        const response = await fetch("http://127.0.0.1:8791/generate", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: request.input,
            context: request.context,
            instruction: request.instruction,
            turns: request.turns,
          }),
          signal: active.signal,
        });
        if (!response.ok) throw new Error("Desktop generation unavailable");
        const result = await response.json();
        if (typeof result.text !== "string")
          throw new Error("Invalid response");
        return result.text;
      } catch (error) {
        // A user cancellation should keep a healthy connection. Any other
        // failure invalidates the token so the interface cannot claim that a
        // stopped or restarted runtime is still connected.
        if (!request.signal.aborted) {
          this.token = "";
          this.modelName = "not-connected";
          sessionStorage.removeItem(this.storageKey);
        }
        throw error;
      }
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", abort);
      if (this.active === active) this.active = undefined;
    }
  }
  async cancel() {
    this.active?.abort();
  }
  async importFile(sessionToken?: string) {
    if (!["localhost", "127.0.0.1"].includes(window.location.hostname))
      throw new Error("Connect only from the local preview.");
    const token =
      sessionToken?.trim() ||
      window.prompt(
        "Paste the private session token printed by npm run model:desktop. Messages will be processed on this computer, with no cloud model.",
      );
    if (!token) throw new Error("Connection cancelled");
    if (!/^[a-f0-9]{64}$/.test(token.trim()))
      throw new Error("Invalid session token");
    const response = await fetch("http://127.0.0.1:8791/health", {
      headers: { Authorization: `Bearer ${token.trim()}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      throw new Error(
        "The local model is not ready. Check the desktop runtime and retry.",
      );
    const status = await response.json();
    if (
      !status.ready ||
      !["gemma-3-1b-it-q4_0", "qwen3-4b-instruct-2507-q4_k_m"].includes(
        status.model,
      )
    )
      throw new Error("Unexpected local model");
    this.modelName = status.model;
    this.token = token.trim();
    sessionStorage.setItem(this.storageKey, this.token);
  }
  async release() {
    await this.cancel();
    this.token = "";
    this.modelName = "not-connected";
  }
}
