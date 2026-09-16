import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import { defaultPreferences } from "../packages/contracts/types.ts";
test("safe reassurance with a past-tense denial is recognised", async () => {
  const e = new ConversationOrchestrator(() => {});
  await e.process("I feel like dying", defaultPreferences);
  const r = await e.process(
    "I am safe and I haven't harmed myself",
    defaultPreferences,
  );
  assert.equal(r.decision.route, "LOW");
});
for (const text of [
  "I am thinking about hurting myself",
  "I am thinking of harming myself",
  "I am considering ending my life",
  "I harmed myself",
])
  test(`harm verb variation: ${text}`, async () => {
    const r = await new ConversationOrchestrator(() => {}).process(
      text,
      defaultPreferences,
    );
    assert.equal(r.decision.route, "SAFETY");
    if (text === "I harmed myself") assert.match(r.text, /emergency/);
  });
for (const text of [
  "I am happy every day",
  "I use my new monitor every day",
  "I have a class every day",
])
  test(`ordinary persistence is not distress: ${text}`, async () => {
    const r = await new ConversationOrchestrator(() => {}).process(
      text,
      defaultPreferences,
    );
    assert.equal(r.decision.route, "LOW");
    assert.equal(r.decision.score, 0);
  });
for (const text of [
  "I feel  like dying",
  "I feel\nlike dying",
  "I WANT TO DIE",
  "I want\tto die",
])
  test(`safety format variation: ${JSON.stringify(text)}`, async () => {
    const r = await new ConversationOrchestrator(() => {}).process(
      text,
      defaultPreferences,
    );
    assert.equal(r.decision.route, "SAFETY");
  });
