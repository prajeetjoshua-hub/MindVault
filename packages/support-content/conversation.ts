import type { Preferences } from "../contracts/types.ts";

export function isReplyFeedback(text: string) {
  return /\b(?:don'?t|do not|dislike|hate).{0,35}(?:like you|your (?:repl|answer)|way you (?:repl|talk|respond)|you\b)|\b(?:same (?:answer|question|reply)|repetitive|stop (?:asking|repeating)|not (?:helpful|listening)|you (?:are|sound|keep).{0,20}(?:robot|repeat|annoy|ask)|(?:you|u) don'?t know anything)|\b(?:you|u) (?:said|told me).{0,100}\b(?:leave|go away)\b.{0,60}\b(?:die|hurt|suicid)\b|\bwhen i said.{0,80}\b(?:die|hurt|suicid)\b/.test(
    text,
  );
}

export function conversationalReply(
  text: string,
  preferences: Preferences,
  previousReply: string,
): string | undefined {
  const choose = (answers: string[]) =>
    answers.find((answer) => answer !== previousReply) ?? answers[0];
  if (
    /\b(?:my .{0,30}(?:died|passed away)|lost my (?:mother|father|mum|mom|dad|friend|pet|dog|cat))\b/.test(
      text,
    )
  )
    return choose([
      "I’m sorry for your loss. You don’t have to make this sound tidy or find a positive side. If you want, you can tell me about them.",
      "That’s a lot to carry. We can stay with what you’re missing about them, without trying to fix the feeling.",
    ]);
  if (
    /\b(?:failed|didn'?t pass|got low marks).{0,25}(?:exam|test)|\bfailed my\b/.test(
      text,
    )
  )
    return preferences.goal === "plan"
      ? "That result can hurt. When you’re ready, we can pick one topic that was difficult and make a small plan for it. One result doesn’t have to decide your next step."
      : "That sounds disappointing, especially if you were hoping for more. You don’t have to jump straight into fixing it. What has been hardest about getting that result?";
  if (
    /\b(?:brain (?:is )?not working|can'?t think straight|mind (?:is )?blank)\b/.test(
      text,
    )
  )
    return "It’s frustrating when thinking feels difficult. What were you trying to do when you noticed it? We can take one piece at a time; I can’t tell the cause from a message.";
  if (
    /\b(?:i (?:am|feel)|i'm) (?:so |really )?(?:angry|frustrated|annoyed)\b/.test(
      text,
    )
  )
    return choose([
      "Something has really got under your skin. You can tell me what happened without having to soften it.",
      "We don’t have to rush into a solution. What felt unfair or frustrating about it?",
    ]);
  if (isReplyFeedback(text))
    if (/\b(?:you|u) don'?t know anything\b/.test(text))
      return choose([
        "I don’t know everything, and I missed what you were trying to say. Tell me the part that matters most, and I’ll respond to that directly.",
        "You’re right that I haven’t understood you well enough. I’ll stop guessing and pay attention to the details you give me.",
      ]);
    else
    return choose([
      "That reply didn’t work for you. I’ll keep this shorter and stop pushing questions. You can say what you wanted me to hear, in your own words.",
      "You’re right to point it out. I’ve been leaning on stock replies instead of responding to what you said. I’ll give you space to finish, without another question.",
    ]);
  const purchase = text.match(
    /\b(?:got|bought|received|picked up) (?:a |an |my |the )?(?:brand[- ]?)?new (monitor|phone|laptop|keyboard|headphones|bike|book|computer)\b/,
  );
  if (purchase && /\b(?:broken|doesn'?t work|not working)\b/.test(text))
    return `That’s frustrating, especially when your ${purchase[1]} is new. Would you like to talk about the disappointment, or think through what to do about it?`;
  if (
    purchase &&
    !/\b(?:broken|broke|regret|hate|sad|upset|overwhelmed|disappointed|doesn'?t work|not working)\b/.test(
      text,
    )
  ) {
    const item = purchase[1];
    return choose([
      `A new ${item}! How are you liking it so far?`,
      `What are you looking forward to using your new ${item} for?`,
    ]);
  }
  if (
    /\b(?:overwhelmed|overwhelming|too much to handle)\b/.test(text) &&
    !/\b(?:not|never) overwhelmed\b/.test(text)
  )
    return choose(
      preferences.goal === "plan"
        ? [
            "When everything feels like too much, a smaller next step can help. Pick one thing that needs attention today; the rest can wait for a moment.",
            "Let’s make the load smaller. You could write down what’s pressing, then choose just one manageable task to start with.",
          ]
        : [
            "It sounds like a lot is piling up. You don’t have to organise it neatly or solve it all right now. I’m listening—start with whatever feels heaviest.",
            "We can slow this down. You can tell me one piece at a time, even if it comes out messy. There’s no need to have an answer yet.",
          ],
    );
  if (
    /\b(?:sad|upset|down|low|lonely|alone)\b/.test(text) &&
    preferences.goal === "listen"
  )
    return choose([
      "That sounds hard to sit with. You don’t need to turn it into a plan right away. There’s room to talk about it here.",
      "I’m listening. You can say more about what happened, or stay with how it feels for a moment.",
    ]);
  if (
    /\b(?:i (?:feel|am|'m)|i'm) (?:really |so |very )?(?:sad|upset|low|down)\b/.test(
      text,
    )
  )
    return choose([
      "I’m sorry today feels heavy. Did something happen, or has this feeling been around for a while?",
      "You don’t have to force yourself to feel better on command. We can start with what today has been like for you.",
    ]);
  if (
    /\b(?:worried|anxious|nervous|stressed)\b/.test(text) &&
    !/\b(?:exam|test|class|work|family|not worried|not anxious)\b/.test(text)
  )
    if (/\b(?:sleep|rest|night)\b/.test(text))
      return choose([
        "A week of worry that is disturbing your sleep can leave you exhausted. What tends to run through your mind when you try to rest?",
        "It sounds like the worry is following you into the night. You don’t have to solve it all at once—what part keeps coming back?",
      ]);
    else
    return choose([
      "It sounds like something is weighing on you. What is the worry saying might happen?",
      "We can take the worry one piece at a time. You could start with what happened and what you’re afraid it means.",
    ]);
  if (
    /\b(?:passed|won|promoted|got (?:the|a) job|good news)\b/.test(text) &&
    !/\b(?:not|never|haven't|didn't|didnt|passed away)\b/.test(text)
  )
    return choose([
      "That sounds like good news! How are you feeling about it?",
      "That’s a moment you can take in. What does it mean to you?",
    ]);
  return undefined;
}
