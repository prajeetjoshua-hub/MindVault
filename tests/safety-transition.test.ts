import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import { defaultPreferences } from "../packages/contracts/types.ts";
test("reported reassurance sequence exits pending safety without ignoring new evidence", async () => {
  const engine = new ConversationOrchestrator(() => {});
  const send = (input: string) => engine.process(input, defaultPreferences);
  assert.equal(
    (await send("i got a new monitor today i feel like dying")).decision.route,
    "SAFETY",
  );
  assert.equal(
    (await send("why is my brain not working")).decision.route,
    "CLARIFY",
  );
  assert.equal(
    (await send("simply i said bro i am totally fine")).decision.route,
    "CLARIFY",
  );
  const resolved = await send("now i am good i didnt hurt myself");
  assert.equal(resolved.decision.route, "LOW");
  assert.ok(resolved.decision.reasons.includes("user-reported-safe"));
  const next = await send("I feel overwhelmed. I just want someone to listen.");
  assert.equal(next.decision.route, "LOW");
  assert.doesNotMatch(next.text, /emergency|immediate danger/);
  assert.equal((await send("I want to die")).decision.route, "SAFETY");
});
test("reported injury or overdose cannot be cleared by a casual reassurance", async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process("I have taken too many pills", defaultPreferences);
  assert.equal(
    (
      await engine.process(
        "I am fine and I didnt hurt myself",
        defaultPreferences,
      )
    ).decision.route,
    "SAFETY",
  );
});
test("contradictory new intent overrides denial", async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process("I feel like dying", defaultPreferences);
  assert.equal(
    (
      await engine.process(
        "I am fine and didnt hurt myself but I will hurt myself tonight",
        defaultPreferences,
      )
    ).decision.route,
    "SAFETY",
  );
});
test("a standalone denial is not fresh positive harm evidence", async () => {
  const result = await new ConversationOrchestrator(() => {}).process(
    "I didnt hurt myself",
    defaultPreferences,
  );
  assert.equal(result.decision.route, "CLARIFY");
  assert.ok(result.decision.evidence.every((e) => e.category !== "safety"));
});
