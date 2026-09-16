import type { Preferences } from "../contracts/types.ts";
import { validateOutput } from "./validateOutput.ts";

/** Conservative surface checks; not a semantic or clinical assessment. */
export function validateReplyQuality(
  text: string,
  previous: string,
  preferences: Preferences,
  noQuestions: boolean,
) {
  const basic = validateOutput(text);
  if (!basic.accepted) return basic;
  const questions = (text.match(/\?/g) ?? []).length;
  if (questions > (noQuestions ? 0 : 1))
    return { accepted: false, reason: "question-preference-violation" };
  const canonical = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (previous && canonical(text) === canonical(previous))
    return { accepted: false, reason: "repeated-reply" };
  if (
    /anything you(?:’|')?d like to talk about|how do you want to proceed|tell me a little more about that/i.test(
      text,
    )
  )
    return { accepted: false, reason: "generic-conversation-reset" };
  if (
    preferences.goal === "listen" &&
    /\b(?:you should|you could try|how about (?:trying|starting|setting)|try (?:a |to |making|taking)|start by|make a list)\b/i.test(
      text,
    )
  )
    return { accepted: false, reason: "unsolicited-plan" };
  return basic;
}
