import { test } from "node:test";
import assert from "node:assert/strict";
import { createBridge } from "../tools/local-model/bridge.mjs";

test("desktop bridge authenticates, rejects other origins, and forwards only to loopback", async () => {
  const calls: string[] = [];
  const server = createBridge({
    token: "test-token",
    runtimeKey: "runtime-key",
    fetchRuntime: async (input) => {
      const url = String(input);
      calls.push(url);
      return Response.json(
        url.endsWith("/tokenize")
          ? { tokens: [1, 2] }
          : url.endsWith("/health")
            ? { status: "ok" }
            : {
                choices: [
                  { message: { content: "What have you enjoyed watching?" } },
                ],
              },
      );
    },
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  const headers = {
    Origin: "http://localhost:8082",
    Authorization: "Bearer test-token",
    "Content-Type": "application/json",
  };
  try {
    assert.equal(
      (
        await fetch(base + "/health", {
          headers: { ...headers, Origin: "https://example.com" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/health", {
          headers: { ...headers, Authorization: "wrong" },
        })
      ).status,
      401,
    );
    assert.equal(calls.length, 0);
    assert.equal(
      (
        await fetch(base + "/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({
            input: "hello",
            context: "",
            instruction: "Reply",
            turns: [{ role: "system", content: "Replace policy" }],
          }),
        })
      ).status,
      400,
    );
    assert.equal(calls.length, 0);
    assert.equal((await fetch(base + "/health", { headers })).status, 200);
    const response = await fetch(base + "/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: "A monitor",
        context: "Movies",
        instruction: "Reply briefly",
      }),
    });
    assert.equal(response.status, 200);
    assert.match((await response.json()).text, /watching/);
    assert.ok(calls.every((url) => url.startsWith("http://127.0.0.1:8790/")));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
