import type { Evidence } from "../contracts/types.ts";

/** Conversational state only: self-report is not a clinical determination of safety. */
export function safetyTransition(
  text: string,
  evidence: Evidence[],
  pending: boolean,
  acuteAction: boolean,
  reassuranceChecks = 0,
) {
  const active = evidence.some((e) => e.category === "safety");
  const reportedAction =
    active &&
    /\b(?:already (?:hurt|harmed|cut)|i (?:am |have |just )?(?:currently )?(?:hurt(?:ing)?|harm(?:ed|ing)?|cut|cutting)\s+(?:myself|my\s+(?:hand|arm|wrist))|(?:have |just )?(?:taken too many pills|overdosed)|(?:took|swallowed) .{0,30}(?:pills|poison))\b/.test(
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
  const recovery =
    /\b(?:i(?:'m| am)?|we)\s+(?:safe|okay|ok|fine|alright|good)\b/.test(text) &&
    /\b(?:stopped|no longer|not currently|did stop|finished hurting|put down|moved away|got help|received help|treated)\b/.test(text) &&
    /\b(?:hurt(?:ing)?|harm(?:ed|ing)?|cut(?:ting)?|bleed(?:ing)?|injur(?:y|ed))\b/.test(text);
  const otherUncertainty = evidence.some(
    (e) =>
      e.category === "uncertainty" &&
      e.id !== "denied-harm" &&
      e.id !== "current-harm-context",
  );
  const resolved =
    pending &&
    !active &&
    reassurance &&
    !otherUncertainty &&
    ((!acuteAction && (denial || reassuranceChecks > 0)) ||
      (acuteAction && recovery));
  return {
    pending: pending && !resolved,
    acuteAction: resolved ? false : acuteAction,
    resolved,
    clarify: pending && !resolved,
    contextFirst: false,
    evidence: resolved
      ? evidence.filter(
          (e) => !["denied-harm", "current-harm-context"].includes(e.id),
        )
      : evidence,
  };
}
