import type { Evidence } from "../contracts/types.ts";

/** Conversational state only: self-report is not a clinical determination of safety. */
export function safetyTransition(
  text: string,
  evidence: Evidence[],
  pending: boolean,
  acuteAction: boolean,
) {
  const active = evidence.some((e) => e.category === "safety");
  const reportedAction =
    active &&
    /\b(?:already (?:hurt|harmed)|i (?:have |just )?(?:hurt|harmed) myself|(?:have |just )?(?:taken too many pills|overdosed)|(?:took|swallowed) .{0,30}(?:pills|poison))\b/.test(
      text,
    );
  if (active)
    return {
      pending: true,
      acuteAction: acuteAction || reportedAction,
      resolved: false,
      clarify: false,
      contextFirst:
        !acuteAction &&
        !reportedAction &&
        !evidence.some((e) => e.category === "safety" && ['danger', 'physical-assault'].includes(e.id)) &&
        !/\b(?:tonight|right now|about to|going to|will hurt|will kill|have a plan|made a plan)\b/.test(
          text,
        ),
      evidence,
    };
  const reassurance =
    /\b(?:i(?: am|'m)? (?:totally |completely |now )?(?:safe|fine|okay|ok|good|alright)|i feel better|i am not in (?:any |immediate )?danger)\b/.test(
      text,
    );
  const denial =
    /\b(?:(?:i )?(?:didn'?t|haven'?t|have not|did not) (?:hurt|harm|injure)(?:ed)? myself|no harm|i (?:am not|don't|dont|do not) (?:going to hurt myself|planning to hurt myself|want to die))\b/.test(
      text,
    );
  const otherUncertainty = evidence.some(
    (e) => e.category === "uncertainty" && e.id !== "denied-harm",
  );
  const resolved =
    pending && !acuteAction && reassurance && denial && !otherUncertainty;
  return {
    pending: pending && !resolved,
    acuteAction,
    resolved,
    clarify: pending && !resolved && !acuteAction,
    contextFirst: false,
    evidence: resolved
      ? evidence.filter((e) => e.id !== "denied-harm")
      : evidence,
  };
}
