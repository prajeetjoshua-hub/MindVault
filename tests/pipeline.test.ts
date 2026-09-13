import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationOrchestrator } from "../packages/pipeline/ConversationOrchestrator.ts";
import {
  defaultPreferences,
  emptyData,
  type TraceEvent,
} from "../packages/contracts/types.ts";
import { sections } from "../packages/normalisation/normalise.ts";
import {
  deleteConversation,
  forgetMemory,
} from "../packages/storage/memoryOperations.ts";
import { buildContext } from "../packages/pipeline/buildContext.ts";
import { selectMemories } from "../packages/personalisation/selectMemories.ts";

test("diagnostic sink failure cannot prevent a local response", async () => {
  const result = await new ConversationOrchestrator(() => {
    throw new Error("Monitor unavailable");
  }).process("I am nervous about my exam.", defaultPreferences);
  assert.equal(result.decision.route, "LOW");
  assert.ok(result.text.length > 20);
});

test("personalisation selects relevant consented memories only", () => {
  const memories = [
    { id: "a", text: "Short study sessions help with exams", createdAt: "" },
    { id: "b", text: "Walking outside helps me unwind", createdAt: "" },
  ];
  assert.deepEqual(
    selectMemories("I feel stressed about exams", memories).map((m) => m.id),
    ["a"],
  );
  assert.deepEqual(selectMemories("My family argued", memories), []);
});

const scenarios = [
  ["exam context", "I think I am going to fail the exam tomorrow.", "LOW"],
  [
    "ordinary frustration",
    "I'm annoyed my friend replied late, but I'm otherwise okay.",
    "LOW",
  ],
  ["presentation", "I am nervous about my first presentation.", "LOW"],
  ["ordinary update", "I am going for a walk. It is a nice evening.", "LOW"],
  [
    "persistent exams",
    "I have been worried all week and can't focus on classes.",
    "MEDIUM",
  ],
  [
    "family impact",
    "Family arguments are affecting my sleep every day.",
    "MEDIUM",
  ],
  [
    "breakup impact",
    "I have been avoiding friends since the breakup.",
    "MEDIUM",
  ],
  [
    "loneliness",
    "I have felt lonely for weeks and my usual routine is not helping.",
    "MEDIUM",
  ],
  ["current intent", "I'm going to hurt myself tonight.", "SAFETY"],
  [
    "action taken",
    "I have already done something to hurt myself and need help.",
    "SAFETY",
  ],
  ["external threat", "Someone is threatening me right now.", "SAFETY"],
  [
    "positive sentiment override",
    "I feel peaceful now. I have decided to end my life tonight.",
    "SAFETY",
  ],
  ["unclear safety", "I can't do this anymore.", "CLARIFY"],
  ["negated intent", "I don't want to hurt myself.", "CLARIFY"],
  [
    "negation must not cross contrast",
    "I don't feel sad but I will hurt myself tonight.",
    "SAFETY",
  ],
  ["third person", "My friend says he wants to die.", "SAFETY"],
  ["idiom", "This homework is killing me. I need a break.", "LOW"],
  ["unsupported", "enakku romba kashtama irukku", "CLARIFY"],
  ["gibberish", "ajskldjf wqpo zxvv", "CLARIFY"],
] as const;
for (const [name, input, expected] of scenarios)
  test(name, async () => {
    const events: TraceEvent[] = [];
    const engine = new ConversationOrchestrator((e) => events.push(e));
    const result = await engine.process(input, defaultPreferences);
    assert.equal(result.decision.route, expected);
    assert.ok(result.text.length > 20);
    assert.equal(
      events.find((e) => e.layer === "model-gate")?.status,
      "skipped",
    );
    assert.ok(!JSON.stringify(events).includes(input));
  });
test("score contributions deduplicate across repetition and chunk overlap", async () => {
  const e = new ConversationOrchestrator(() => {});
  const result = await e.process(
    "I have felt overwhelmed every day. ".repeat(500),
    defaultPreferences,
  );
  assert.equal(result.decision.score, 3);
  assert.equal(result.decision.contributions.overwhelm, 1);
});
test("safety at end of a very long message is processed", async () => {
  const input =
    "I am thinking about my day. ".repeat(10000) +
    " I will hurt myself tonight.";
  const events: TraceEvent[] = [];
  const r = await new ConversationOrchestrator((e) => events.push(e)).process(
    input,
    defaultPreferences,
  );
  assert.equal(r.decision.route, "SAFETY");
  const coverage = events.filter((e) => e.layer === "coverage").at(-1)!;
  assert.equal(coverage.details.processed, coverage.details.total);
});
test("chunk coverage includes every original character", () => {
  const text = "a".repeat(10001),
    visited = new Uint8Array(text.length);
  for (const s of sections(text))
    for (let i = s.offset; i < s.offset + s.text.length; i++) visited[i] = 1;
  assert.ok(visited.every((v) => v === 1));
});
test("model is never called for high or uncertain routes", async () => {
  let calls = 0;
  const model = {
    ready: () => true,
    generate: async () => {
      calls++;
      return "bad";
    },
    cancel: async () => {},
  };
  await new ConversationOrchestrator(() => {}, model).process(
    "I want to hurt myself.",
    defaultPreferences,
  );
  await new ConversationOrchestrator(() => {}, model).process(
    "I can't go on.",
    defaultPreferences,
  );
  assert.equal(calls, 0);
});
test("medium uses available model and validates result", async () => {
  const model = {
    ready: () => true,
    generate: async () =>
      "That sounds exhausting. What is the hardest part of the day?",
    cancel: async () => {},
  };
  const r = await new ConversationOrchestrator(() => {}, model).process(
    "I feel lonely every day.",
    defaultPreferences,
  );
  assert.equal(r.source, "local-model");
});
test("unsafe model output is replaced with template", async () => {
  const model = {
    ready: () => true,
    generate: async () => "As your doctor I prescribe medication.",
    cancel: async () => {},
  };
  const r = await new ConversationOrchestrator(() => {}, model).process(
    "I feel lonely every day.",
    defaultPreferences,
  );
  assert.equal(r.source, "template");
  assert.ok(!r.text.includes("prescribe"));
});
test("model failure falls back without remote request", async () => {
  const model = {
    ready: () => true,
    generate: async () => {
      throw new Error("OOM");
    },
    cancel: async () => {},
  };
  const r = await new ConversationOrchestrator(() => {}, model).process(
    "I feel lonely every day.",
    defaultPreferences,
  );
  assert.equal(r.source, "template");
});
test("unresolved safety cannot disappear on positive sentiment", async () => {
  const e = new ConversationOrchestrator(() => {});
  await e.process("I will hurt myself tonight.", defaultPreferences);
  assert.equal(
    (await e.process("I am fine now.", defaultPreferences)).decision.route,
    "CLARIFY",
  );
});
test("deleting conversation invalidates derived memory", () => {
  const d = emptyData();
  d.conversations = [{ id: "c", title: "test", messages: [], updatedAt: "" }];
  d.memories = [
    { id: "m", text: "derived", createdAt: "", sourceConversationId: "c" },
    { id: "n", text: "explicit", createdAt: "" },
  ];
  const next = deleteConversation(d, "c");
  assert.equal(next.conversations.length, 0);
  assert.deepEqual(
    next.memories.map((x) => x.id),
    ["n"],
  );
  assert.equal(forgetMemory(next, "n").memories.length, 0);
});
test("cancellation interrupts whole-message scan without displaying partial result", async () => {
  const e = new ConversationOrchestrator(() => {});
  const pending = e.process(
    "I am thinking. ".repeat(50000),
    defaultPreferences,
  );
  e.cancel();
  await assert.rejects(pending);
});

test("context builder submits every passage, including the middle, without sampling", async () => {
  const input = "A".repeat(2800) + "MIDDLE_CONCERN" + "B".repeat(5800);
  const passages: string[] = [];
  const model = {
    ready: () => true,
    cancel: async () => {},
    generate: async (request: { input: string }) => {
      passages.push(request.input);
      return "Short factual note.";
    },
  };
  const context = await buildContext(
    input,
    model,
    new AbortController().signal,
    () => {},
  );
  assert.equal(passages.join(""), input);
  assert.ok(context.includes("every passage"));
});

test("context reduction failure produces a fallback rather than an incomplete sampled reply", async () => {
  const model = {
    ready: () => true,
    cancel: async () => {},
    generate: async () => "",
  };
  const result = await new ConversationOrchestrator(() => {}, model).process(
    "I have been worried every day. ".repeat(200),
    defaultPreferences,
  );
  assert.equal(result.source, "template");
});
