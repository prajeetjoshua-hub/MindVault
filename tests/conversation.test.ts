import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import { defaultPreferences } from "../packages/contracts/types.ts";

test("reported browser conversation responds to each message and prioritises safety", async () => {
  const engine = new ConversationOrchestrator(() => {});
  const inputs = [
    "I feel overwhelmed. I want to talk about it.",
    "i got a new monitor today",
    "i dont like you",
    "i feel like dying",
    "i dont like the way you reply",
  ];
  const replies = [];
  for (const input of inputs)
    replies.push(
      await engine.process(input, {
        ...defaultPreferences,
        style: "direct",
        detail: "balanced",
      }),
    );
  assert.match(replies[0].text, /piling up|slow this down/);
  assert.match(replies[1].text, /monitor/);
  assert.equal(replies[1].decision.route, "LOW");
  assert.match(replies[2].text, /reply didn’t work|stock replies/);
  assert.equal(replies[3].decision.route, "SAFETY");
  assert.match(replies[3].text, /ending your life/);
  assert.equal(replies[4].decision.route, "CLARIFY");
  assert.match(replies[4].text, /replies aren’t helping/);
  assert.equal(new Set(replies.map((reply) => reply.text)).size, 5);
  assert.ok(
    replies.every(
      (reply) =>
        !reply.text.includes(
          "What part of this would you most like us to focus on?",
        ),
    ),
  );
});
for (const input of [
  "i feel like dying",
  "I am feeling like dying",
  "i dont want to live",
  "I wish I could die",
  "I want to be dead",
  "I got a new monitor but I feel like dying",
])
  test(`safety expression: ${input}`, async () => {
    let calls = 0;
    const engine = new ConversationOrchestrator(() => {}, {
      ready: () => true,
      cancel: async () => {},
      generate: async () => {
        calls++;
        return "ignored";
      },
    });
    assert.equal(
      (await engine.process(input, defaultPreferences)).decision.route,
      "SAFETY",
    );
    assert.equal(calls, 0);
  });
test("conversational replies cannot mask safety clarification", async () => {
  const r = await new ConversationOrchestrator(() => {}).process(
    "I feel overwhelmed and I can't go on.",
    defaultPreferences,
  );
  assert.equal(r.decision.route, "CLARIFY");
  assert.match(r.text, /might be hurt/);
});
test("negated safety still clarifies, including missing apostrophe", async () => {
  const r = await new ConversationOrchestrator(() => {}).process(
    "I dont feel like dying",
    defaultPreferences,
  );
  assert.equal(r.decision.route, "CLARIFY");
});
test("adjacent fallback replies do not repeat verbatim", async () => {
  const engine = new ConversationOrchestrator(() => {});
  const a = await engine.process("I have a lot on my mind", defaultPreferences);
  const b = await engine.process(
    "I am still thinking about it",
    defaultPreferences,
  );
  assert.notEqual(a.text, b.text);
});
test("negative update is not mistaken for celebration", async () => {
  const engine = new ConversationOrchestrator(() => {});
  const r = await engine.process(
    "I got a new monitor but it is broken and I am not happy",
    defaultPreferences,
  );
  assert.doesNotMatch(r.text, /moment worth enjoying|A new monitor!/);
});
