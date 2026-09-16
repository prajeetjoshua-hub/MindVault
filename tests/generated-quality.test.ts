import { test } from "node:test";
import assert from "node:assert/strict";
import { validateOutput } from "../packages/output-gate/validateOutput.ts";
import { validateReplyQuality } from "../packages/output-gate/validateReplyQuality.ts";
import { defaultPreferences } from "../packages/contracts/types.ts";

test("generated role labels and degenerate token loops cannot reach chat", () => {
  assert.equal(validateOutput("Reply. ".repeat(50)).accepted, false);
  assert.equal(validateOutput("You. ".repeat(50)).accepted, false);
  assert.equal(validateOutput("Reply: I hear you.").accepted, false);
  assert.equal(
    validateOutput(
      "Being behind on preparation can make the exam feel daunting. How much time is left?",
    ).accepted,
    true,
  );
});

test("listening and no-question preferences constrain generated replies", () => {
  const listening = { ...defaultPreferences, goal: "listen" as const };
  assert.equal(
    validateReplyQuality("How about trying a study plan?", "", listening, false)
      .accepted,
    false,
  );
  assert.equal(
    validateReplyQuality(
      "When is it? What happened?",
      "",
      defaultPreferences,
      false,
    ).accepted,
    false,
  );
  assert.equal(
    validateReplyQuality("When is it?", "", defaultPreferences, true).accepted,
    false,
  );
  assert.equal(
    validateReplyQuality(
      "That sounds difficult.",
      "That sounds difficult!",
      listening,
      false,
    ).accepted,
    false,
  );
  assert.equal(
    validateReplyQuality(
      "You’re trying to study while the arguments keep replaying. That sounds exhausting.",
      "",
      listening,
      true,
    ).accepted,
    true,
  );
});
