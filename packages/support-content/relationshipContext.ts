/** Small authored relationship-context coverage; safety rules still take priority. */
export function relationshipReply(
  text: string,
  context: string,
  previousReply = "",
): string | undefined {
  const choose = (answers: string[]) =>
    answers.find((answer) => answer !== previousReply) ?? answers[0];
  const combined = `${text} ${context}`;
  const relationshipContext = /\b(?:break[- ]?up|broke up|relationship|partner|boyfriend|girlfriend|ex|crush|dating|ghosted|ignoring me|not replying|stopped talking|left me on read|cheat(?:ed|ing)?|betray(?:ed|al))\b/.test(
    combined,
  );
  if (
    /\b(?:had|went through|going through) a?\s*break[- ]?up\b|\bbroke up with me\b/.test(
      text,
    )
  )
    return choose([
      "Oh no, that sounds really sad. Breakups can hurt deeply. I’m here to hear your story—what happened?",
      "I’m sorry. That kind of loss can leave a lot running through your mind. You can tell me the story at your own pace.",
    ]);
  if (
    relationshipContext &&
    /\b(?:left me|dumped me|chose someone else|bad (?:girl|boy)|not good enough|rejected me)\b/.test(
      text,
    )
  )
    return choose([
      "That really hurts, especially after a breakup. Someone leaving does not make you less worthy—you deserve to be treated with care. Do you want to tell me what happened?",
      "Their choice does not decide your worth. I’m here with you—would you like to share what led up to it, or just talk about how it feels right now?",
    ]);
  if (
    relationshipContext &&
    /\b(?:ghosted|ignoring me|won'?t reply|not replying|stopped talking|left me on read)\b/.test(
      text,
    )
  )
    return "Being left without an explanation can really sting. You deserve clear and respectful communication. Do you want to tell me what happened before they stopped replying?";
  if (
    relationshipContext &&
    /\b(?:cheat(?:ed|ing)?|betray(?:ed|al)|lied to me|unfaithful)\b/.test(text)
  )
    return "That kind of betrayal can shake your trust and your sense of worth. You didn’t deserve to be lied to. What feels hardest right now—the anger, the loss, or deciding what you want next?";
  if (
    (relationshipContext ||
      /\bwe\b.{0,35}\b(?:argu(?:e|ed|ing|ment)|fight(?:ing)?)\b/.test(text)) &&
    /\b(?:argu(?:e|ed|ing|ment)|fight(?:ing)?|conflict|misunderstanding)\b/.test(
      text,
    )
  )
    return "That sounds exhausting, especially when there are feelings on both sides. What was the moment that hurt you most in the argument?";
  if (
    relationshipContext &&
    /\b(?:miss|missing|still love|think about)\b.*\b(?:ex|him|her|them)\b/.test(
      text,
    )
  )
    return "Missing someone after a relationship ends is understandable. It doesn’t mean you have to go back or ignore what hurt you. What do you miss most?";
  if (
    relationshipContext &&
    /\b(?:long distance|far away|different cities|online relationship)\b/.test(
      text,
    )
  )
    return "Distance can make a relationship feel uncertain and lonely. What part has been hardest—the waiting, the communication, or feeling apart?";
  if (/\b(?:crush|like someone|rejected|rejection|one[- ]sided)\b/.test(text))
    return "That’s a tender place to be in. Someone not returning your feelings can hurt, but it doesn’t make you less lovable. Do you want to talk about what happened?";
  return undefined;
}
