import type { TraceEvent } from "../contracts/types";
export class MonitorClient {
  private pairing?: { url: string; token: string };
  private queue: Promise<void> = Promise.resolve();
  private generation = 0;
  private pending = 0;
  private inFlight?: AbortController;
  constructor(
    private native: boolean,
    private onStatus: (message: string) => void,
  ) {}
  connect(json: string) {
    const parsed = JSON.parse(json);
    const url = new URL(parsed.url);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && loopback && !this.native)
    )
      throw new Error(
        "Use trusted HTTPS for a phone connection. HTTP is only allowed for the desktop loopback preview.",
      );
    if (
      typeof parsed.token !== "string" ||
      !/^[a-f0-9]{64}$/.test(parsed.token)
    )
      throw new Error("Invalid pairing token");
    this.disconnect();
    this.pairing = { url: url.origin, token: parsed.token };
    this.onStatus("Paired — connection will be verified when an event is sent");
  }
  disconnect() {
    this.generation++;
    this.inFlight?.abort();
    this.pairing = undefined;
    this.onStatus("Disconnected");
  }
  send(event: TraceEvent) {
    const pairing = this.pairing,
      generation = this.generation;
    if (!pairing) return;
    if (this.pending >= 100) {
      this.onStatus("Monitor queue full — some diagnostics skipped");
      return;
    }
    this.pending++;
    this.queue = this.queue
      .then(async () => {
        if (generation !== this.generation) return;
        const abort = new AbortController();
        const timeout = setTimeout(() => abort.abort(), 3000);
        this.inFlight = abort;
        try {
          const result = await fetch(`${pairing.url}/api/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${pairing.token}`,
            },
            body: JSON.stringify(event),
            signal: abort.signal,
          });
          if (!result.ok) throw new Error("Monitor rejected event");
          if (generation === this.generation)
            this.onStatus("Connected — diagnostics only; no conversation text");
        } catch {
          if (generation === this.generation)
            this.onStatus("Connection unavailable — app continues locally");
        } finally {
          clearTimeout(timeout);
          if (this.inFlight === abort) this.inFlight = undefined;
        }
      })
      .finally(() => {
        this.pending--;
      });
  }
}
