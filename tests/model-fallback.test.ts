import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import {
  defaultPreferences,
  type ModelRequest,
} from "../packages/contracts/types.ts";

test("available local model handles ordinary unknown wording and receives conversation turns", async () => {
  const requests: ModelRequest[] = [];
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async (request) => {
      requests.push(request);
      return requests.length === 1
        ? "A new setup can be exciting. What did you get?"
        : "That sounds like an enjoyable upgrade. What have you watched on it?";
    },
  });
  await engine.process("I got a new monitor", defaultPreferences);
  const result = await engine.process(
    "its so good its a 4K monitor",
    defaultPreferences,
  );
  assert.equal(result.source, "local-model");
  assert.doesNotMatch(requests.at(-1)!.context, /User: i got a new monitor/);
  assert.equal(requests.at(-1)!.turns?.[0].role, "user");
  assert.equal(requests.at(-1)!.turns?.[0].content, "I got a new monitor");
  assert.equal(requests.at(-1)!.turns?.[1].role, "assistant");
});
test("safety ambiguity and unresolved concern never use the ordinary fallback model", async () => {
  let calls = 0;
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async () => {
      calls++;
      return "Hello";
    },
  });
  await engine.process("I cannot do this anymore", defaultPreferences);
  await engine.process("I feel suicidal", defaultPreferences);
  await engine.process("did you eat", defaultPreferences);
  assert.equal(calls, 0);
});
test("unavailable model still answers supported small talk without language warning", async () => {
  const engine = new ConversationOrchestrator(() => {});
  assert.match(
    (await engine.process("did you eat", defaultPreferences)).text,
    /don’t eat/,
  );
  assert.match(
    (await engine.process("i am good how are you", defaultPreferences)).text,
    /here with you|glad you’re doing well/,
  );
});
