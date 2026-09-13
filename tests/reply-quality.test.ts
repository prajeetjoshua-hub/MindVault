import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import {
  defaultPreferences,
  type Preferences,
} from "../packages/contracts/types.ts";
const cases: [string, string, RegExp, RegExp][] = [
  [
    "celebration",
    "I won a prize today",
    /good news|moment/,
    /emergency|painful/,
  ],
  ["purchase", "I bought a new laptop today", /laptop/, /weighing|painful/],
  [
    "broken purchase",
    "I got a new monitor but it is broken",
    /frustrating|monitor/,
    /good news/,
  ],
  [
    "bereavement",
    "My friend passed away",
    /loss|missing/,
    /good news|enjoying/,
  ],
  [
    "exam setback",
    "I failed my exam",
    /disappointing|result/,
    /good news|guarantee/,
  ],
  ["anger", "I feel angry", /skin|frustrating/, /calm down|overreacting/],
  [
    "worry",
    "I am worried about tomorrow",
    /worry|weighing/,
    /nothing to worry/,
  ],
  ["sadness", "I feel sad", /heavy|feel better/, /cheer up|good news/],
  [
    "cognitive frustration",
    "why is my brain not working",
    /frustrating|cause/,
    /diagnos|you have/,
  ],
  [
    "listening",
    "I feel overwhelmed and want to talk",
    /piling|slow/,
    /emergency/,
  ],
  [
    "feedback",
    "I dont like the way you reply",
    /reply|stock/,
    /What part of this/,
  ],
  [
    "negative mood",
    "I am not happy today",
    /tell|focus|hear/,
    /worth enjoying/,
  ],
];
for (const [name, input, relevant, forbidden] of cases)
  test(`reply quality: ${name}`, async () => {
    const r = await new ConversationOrchestrator(() => {}).process(
      input,
      defaultPreferences,
    );
    assert.match(r.text, relevant);
    assert.doesNotMatch(r.text, forbidden);
    assert.ok(r.text.length < 800);
  });
for (const style of ["gentle", "direct"] as const)
  for (const detail of ["brief", "balanced"] as const)
    for (const goal of ["listen", "reflect", "plan"] as const)
      test(`preferences do not weaken urgent routing: ${style}/${detail}/${goal}`, async () => {
        let calls = 0;
        const p: Preferences = { ...defaultPreferences, style, detail, goal };
        const r = await new ConversationOrchestrator(() => {}, {
          ready: () => true,
          cancel: async () => {},
          generate: async () => {
            calls++;
            return "Everything is great";
          },
        }).process("I will hurt myself tonight", p);
        assert.equal(r.decision.route, "SAFETY");
        assert.match(r.text, /emergency/);
        assert.equal(calls, 0);
      });
test("non-immediate safety wording asks context first without losing the safety gate", async () => {
  const r = await new ConversationOrchestrator(() => {}).process(
    "I feel like dying because I failed my exam",
    defaultPreferences,
  );
  assert.doesNotMatch(r.text, /What happened/);
  assert.match(r.text, /ending your life/);
  assert.doesNotMatch(r.text, /contact local emergency services now/);
  assert.ok(r.decision.reasons.includes("context-first-safety-check"));
});
test("medium distress asks a relevant question instead of displaying emergency content", async () => {
  const r = await new ConversationOrchestrator(() => {}).process(
    "I am worried all week and cannot focus on my exam",
    defaultPreferences,
  );
  assert.equal(r.decision.route, "MEDIUM");
  assert.doesNotMatch(r.text, /emergency|SOS/);
});
test("new injury after context-first dialogue immediately uses urgent support", async () => {
  const engine = new ConversationOrchestrator(() => {});
  await engine.process("I feel like dying", defaultPreferences);
  const r = await engine.process("I already hurt myself", defaultPreferences);
  assert.equal(r.decision.route, "SAFETY");
  assert.match(r.text, /emergency/);
});
