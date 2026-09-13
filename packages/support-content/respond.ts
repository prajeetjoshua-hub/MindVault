import type { Decision, Preferences } from "../contracts/types.ts";
import { conversationalReply, isReplyFeedback } from "./conversation.ts";
import { contextualReply } from './contextualReply.ts';
export function respond(
  decision: Decision,
  text: string,
  preferences: Preferences,
  previousUser = "",
  previousReply = "",
): string {
  if (decision.route === "SAFETY") {
    if (decision.reasons.includes("unresolved-safety-state"))
      return isReplyFeedback(text)
        ? "I hear that my replies aren’t helping, and I’m sorry. I’ll keep this direct: you raised a safety concern earlier, and I don’t want to overlook it. Are you in immediate danger or have you already hurt yourself? If so, contact local emergency services now and reach someone you trust who can stay with you."
        : "Before we move on, I want to check on the safety concern you shared. Are you in immediate danger, or have you already hurt yourself? If so, please contact local emergency services now. If possible, reach someone you trust who can stay with you.";
    if (decision.reasons.includes("danger"))
      return "I'm sorry you're facing this. If you are in immediate danger or may already be injured, contact local emergency services now. If possible, move somewhere safer and reach a person you trust. This app cannot contact anyone or monitor your safety.";
    return "I'm sorry things feel this painful. Are you thinking about ending your life, or have you already done something to hurt yourself? If you might act on this or have already hurt yourself, contact local emergency services or go to the nearest emergency department now. If possible, reach someone you trust who can stay with you. This app cannot monitor your safety.";
  }
  if (decision.route === "CLARIFY") {
    if (decision.evidence.some((e) => e.category === "uncertainty"))
      return "I want to understand what you mean. Are you describing feeling overwhelmed, or are you concerned that you or someone else might be hurt? If there is immediate danger, please contact local emergency services now.";
    if (isReplyFeedback(text)) {
      const feedback = conversationalReply(text, preferences, previousReply);
      if (feedback) return feedback;
    }
    const known = contextualReply(text, previousUser, preferences, previousReply);
    if (known) return known;
    return "I haven’t quite understood that message. My local conversation model isn’t available to help with this reply yet. Could you explain what you mean?";
  }
  if (/^(hi|hello|hey|good morning|good evening)[!.\s]*$/.test(text.trim()))
    return "Hi. It’s good to see you. Would you like to talk something through, or just share how your day is going?";
  const specific = contextualReply(text, previousUser, preferences, previousReply) ?? conversationalReply(text, preferences, previousReply);
  if (specific) return specific;
  if (
    /\b(walk|nice evening|nice day|good day|happy|excited)\b/.test(text) &&
    decision.score === 0 &&
    !/\b(?:not|don'?t|sad|upset|hate|unhappy)\b/.test(text)
  )
    return "That sounds like a moment worth enjoying. What has stood out to you today?";
  if (/^(?:thanks|thank you)(?: so much| a lot)?[!.\s]*$/.test(text.trim()))
    return "You’re welcome. We can take this at your pace.";
  const followupExam =
    /\b(exam|fail|study)\b/.test(previousUser) &&
    /\b(prepar|time|chapter|subject|marks|mock|family)\b/.test(text);
  if (followupExam && preferences.goal === "plan")
    return "That helps me understand the obstacle. Let’s choose one topic you can work on for a short, manageable session, then take a break. Which topic would make the biggest difference?";
  const question = {
    exam: "What is making this feel difficult—preparation, recent results, or something happening outside your studies?",
    family:
      "What part of what is happening at home is affecting you most right now?",
    relationships:
      "What about this situation with them has been hardest for you?",
    loneliness: "When does the feeling of being alone become strongest?",
    sleep: "What tends to be going on when you try to rest?",
    work: "Which part of the situation at work feels most difficult to manage?",
    general:
      preferences.goal === "listen"
        ? "You can keep going; there’s no need to turn this into a task."
        : "Would you like to tell me a little more about that?",
  }[decision.topic];
  const acknowledgement =
    preferences.style === "direct"
      ? "Let’s focus on what you need right now."
      : decision.route === "MEDIUM"
        ? "It sounds like this has been taking a lot out of you."
        : "Thank you for telling me.";
  const plan =
    preferences.goal === "plan"
      ? " We can work towards one small next step."
      : preferences.goal === "listen"
        ? " You don’t have to solve everything right now."
        : "";
  const reply = `${acknowledgement}${plan} ${question}`;
  if (reply === previousReply)
    return preferences.goal === "plan"
      ? "We haven’t found a useful next step yet. We could start by separating what you can change today from what needs more time."
      : "I don’t want to keep asking you the same thing. I’m listening—tell me what you want me to understand, and we can take it from there.";
  return reply;
}
