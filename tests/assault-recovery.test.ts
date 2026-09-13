import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import { defaultPreferences } from "../packages/contracts/types.ts";

test("requests for help after assault route to action, and reaching safety ends the loop", async () => {
  const engine = new ConversationOrchestrator(() => {});
  const send = (text: string) => engine.process(text, defaultPreferences);
  await send("they hit me with the scale and it hurts");
  for (const text of ["its hurting", "paining huhhhhhh"])
    assert.equal((await send(text)).decision.route, "SAFETY");
  for (const text of [
    "my mom is coming to hit me",
    "help",
    "help mee",
    "save me",
  ]) {
    const response = await send(text);
    assert.equal(response.decision.route, "SAFETY");
    assert.match(response.text, /call emergency services/);
    assert.doesNotMatch(response.text, /whether you are somewhere safe/);
  }
  const safe = await send("safe i have come to different place");
  assert.equal(safe.decision.route, "LOW");
  assert.match(safe.text, /don’t need to keep confirming/);
  assert.equal(
    (await send("i want to talk about my exam now")).decision.route,
    "LOW",
  );
  assert.equal((await send("she hit me again")).decision.route, "SAFETY");
});
test("physical safety does not clear a distinct self-harm concern", async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process("I want to die", defaultPreferences);
  await engine.process("my mom hit me", defaultPreferences);
  assert.notEqual(
    (await engine.process("I am safe now", defaultPreferences)).decision.route,
    "LOW",
  );
});
