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
  await engine.process(
    "I noticed a red kite on the bus ride home",
    defaultPreferences,
  );
  const result = await engine.process(
    "It kept circling above the station while I waited",
    defaultPreferences,
  );
  assert.equal(result.source, "local-model");
  assert.doesNotMatch(requests.at(-1)!.context, /User: i noticed a red kite/);
  assert.equal(requests.at(-1)!.turns?.[0].role, "user");
  assert.equal(
    requests.at(-1)!.turns?.[0].content,
    "I noticed a red kite on the bus ride home",
  );
  assert.equal(requests.at(-1)!.turns?.[1].role, "assistant");
});
test("authored topic replies take precedence over the optional local model", async () => {
  let calls = 0;
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async () => {
      calls++;
      return "A generic generated answer";
    },
  });
  const result = await engine.process(
    "I got a new monitor",
    defaultPreferences,
  );
  assert.equal(result.source, "template");
  assert.match(result.text, /monitor/i);
  assert.equal(calls, 0);
});
test("a specific medium-support reply stays immediate when the local model is ready", async () => {
  let calls = 0;
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async () => {
      calls++;
      return "Generated response";
    },
  });
  const result = await engine.process(
    "My parents have argued every day and I cannot sleep before my exam.",
    defaultPreferences,
  );
  assert.equal(result.decision.route, "MEDIUM");
  assert.equal(result.source, "template");
  assert.equal(calls, 0);
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
test("a direct emergency request responds immediately without invoking the model", async () => {
  let calls = 0;
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async () => {
      calls++;
      return "Generated response";
    },
  });
  const result = await engine.process("help emergency", defaultPreferences);
  assert.equal(result.decision.route, "SAFETY");
  assert.equal(result.source, "template");
  assert.match(result.text, /112|immediate emergency/i);
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
test("runtime failure falls back warmly without exposing model plumbing", async () => {
  const engine = new ConversationOrchestrator(() => {}, {
    ready: () => true,
    cancel: async () => {},
    generate: async () => {
      throw new Error("runtime stopped");
    },
  });
  const result = await engine.process(
    "I found an old blue marble in my coat pocket",
    defaultPreferences,
  );
  assert.equal(result.source, "template");
  assert.match(result.text, /don’t want to brush you off/i);
  assert.doesNotMatch(result.text, /model|runtime|unavailable/i);
});
