import { test } from "node:test";
import assert from "node:assert/strict";
import { MonitorClient } from "../packages/diagnostics/MonitorClient.ts";

test("dashboard pairing reports incomplete copied configuration clearly", () => {
  const client = new MonitorClient(false, () => {});
  assert.throws(
    () => client.connect('{"url":"http://127.0.0.1:8787"'),
    /pairing configuration is incomplete/i,
  );
});

test("dashboard pairing accepts a complete desktop configuration", () => {
  let status = "";
  const client = new MonitorClient(false, (message) => (status = message));
  client.connect(
    JSON.stringify({
      url: "http://127.0.0.1:8787",
      token: "a".repeat(64),
    }),
  );
  assert.match(status, /Paired/);
});
