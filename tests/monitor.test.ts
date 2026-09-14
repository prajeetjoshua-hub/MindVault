import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

test("monitor authenticates, redacts, deduplicates, keeps one session pairing, and rejects oversized input", async () => {
  const port = 19000 + Math.floor(Math.random() * 10000),
    origin = `http://127.0.0.1:${port}`;
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../tools/monitor-service/server.mjs", import.meta.url),
      ),
    ],
    {
      env: {
        ...process.env,
        MONITOR_PORT: String(port),
        MONITOR_ORIGIN: origin,
        MONITOR_CERT: "",
        MONITOR_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  try {
    const admin = await new Promise<string>((resolve, reject) => {
      let output = "";
      const timer = setTimeout(
        () => reject(new Error("Monitor startup timed out")),
        8000,
      );
      child.stdout.on("data", (chunk) => {
        output += chunk;
        const match = output.match(/session=([a-f0-9]{64})/);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
      child.on("error", reject);
    });
    const call = (
      path: string,
      token?: string,
      method = "GET",
      body?: unknown,
    ) =>
      fetch(`${origin}/api/${path}`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    assert.equal((await call("events")).status, 401);
    assert.equal((await call("events", "é".repeat(64))).status, 401);
    const pair = await (await call("pair", admin, "POST")).json();
    assert.equal((await call("events", pair.token)).status, 401);
    const event = {
      traceId: "synthetic-1",
      sequence: 1,
      layer: "policy",
      status: "completed",
      details: {
        route: "MEDIUM",
        score: 4,
        text: "PRIVATE_SENTINEL",
        input: "PRIVATE_SENTINEL",
      },
    };
    assert.equal((await call("events", pair.token, "POST", event)).status, 200);
    assert.equal((await call("events", pair.token, "POST", event)).status, 200);
    const stored = await (await call("events", admin)).json();
    assert.equal(stored.events.length, 1);
    assert.ok(!JSON.stringify(stored).includes("PRIVATE_SENTINEL"));
    assert.equal(
      (
        await call("events", pair.token, "POST", {
          ...event,
          details: { text: "x".repeat(21000) },
        })
      ).status,
      413,
    );
    const samePair = await (await call("pair", admin, "POST")).json();
    assert.equal(samePair.token, pair.token);
    assert.equal((await call("events", pair.token, "POST", { ...event, sequence: 2 })).status, 200);
    await call("events", admin, "DELETE");
    assert.equal((await (await call("events", admin)).json()).events.length, 0);
  } finally {
    child.kill();
  }
});
