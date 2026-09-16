import type { Preferences } from '../contracts/types.ts';
import { foodReply } from './foodContext.ts';
import { relationshipReply } from './relationshipContext.ts';

/** Authored fallback coverage; not a trained emotion model. */
export function contextualReply(
  text: string,
  context: string,
  preferences: Preferences,
  previousReply = "",
): string | undefined {
  const choose = (answers: string[]) =>
    answers.find((answer) => answer !== previousReply) ?? answers[0];
  if (/\bhow are (?:you|u|yiu)\b/.test(text))
    if (/\b(?:i am|i'm|im) (?:good|fine|great)\b/.test(text))
      return "I’m here with you, and I’m glad you’re doing well. What’s been good about today?";
    else return 'I’m here and ready to chat with you. How has your day been?';
  if (/^(?:i am|i'm|im) (?:good|fine|great)[!.\s]*$/.test(text))
    return 'Glad to hear that. Has it been a relaxed day, or has something good happened?';
  if (/\b(?:i\s+)?(?:feel|feeling|am)\s+hurt(?:ed)?\b/.test(text))
    return choose([
      'Ayyo, what happened? That sounds painful. I’m here with you—tell me what happened.',
      'Oh no, I’m sorry you’re hurting. You can start wherever it feels easiest; I’m listening.',
    ]);
  if (/\b(?:you|u)\b.*\b(?:eat|ate|breakfast)|\bdo you eat\b/.test(text))
    return choose([
      'I don’t eat or have a body, so no breakfast for me! What did you have?',
      'I don’t eat, but I’m interested in yours—what did you have for breakfast?',
    ]);
  const relationship = relationshipReply(text, context, previousReply);
  if (relationship) return relationship;
  const food = foodReply(text, context, previousReply);
  if (food) return food;
  if (/\bmonitor\b/.test(text) && /\b(?:broken|broke|not working|arrived damaged)\b/.test(text))
    return 'That’s frustrating after looking forward to using it. Is the screen damaged, or does it fail to turn on?';
  if (/\b(?:family issues?|issues at home)\b/.test(text) && !/\b(?:fight|fighting|argu(?:e|ing|ments))\b/.test(text))
    return 'I’m listening. You don’t have to explain everything at once. Is the hardest part the conflict, pressure, or feeling unsettled at home?';
  const family = /\b(?:parents|family)\b/.test(text) || /\b(?:parents|family)\b/.test(context) && /\b(?:they|their|fight|harsh|words|sleep|study|studying)\b/.test(text);
  if (family && /\b(?:fight|fighting|harsh|argu(?:e|ing|ments))\b/.test(text)) {
    if (/\b(?:mentally (?:stable|okay)|not (?:so )?mentally|unstable|disturbed|disturbing)\b/.test(text))
      return 'The fighting is affecting your sense of stability as well as your studies. Their conflict is not yours to fix. What feels hardest right now—the noise, the harsh words, or not feeling settled at home?';
    if (/\b(?:sleep|night|mind)\b/.test(text))
      return 'Those arguments seem to stay with you even when the room goes quiet. It makes sense that resting feels difficult when their words keep replaying. You shouldn’t have to be the person who settles their conflict.';
    if (/\b(?:study|studying|focus)\b/.test(text))
      return 'You’re trying to study while your parents are fighting—that sounds upsetting and distracting. Their conflict isn’t yours to solve. Is there a quieter place you can use for a little while, perhaps with someone you trust?';
    return 'Hearing your parents fight can leave home feeling unsettled. You don’t have to take sides or fix the argument. What part has been weighing on you most?';
  }
  if (/\blonely|loneliness\b/.test(text))
    return /\bpassed|won|achievement\b/.test(text)
      ? 'Passing your exam matters, and feeling lonely still matters too. Was there someone you wished you could share the moment with?'
      : 'Loneliness can hurt even when other things are going well. Are you missing a particular person, or the feeling of having someone close?';
  if (/\bmonitor\b/.test(text + ' ' + context)) {
    if (/\bobsessed\b/.test(text))
      return 'Sounds like you’re really enjoying the new setup! What keeps drawing you back to it?';
    if (/\bmovies|series|films\b/.test(text))
      return 'Sounds like your monitor is becoming a little movie corner. What’s the first film or series you’ve enjoyed on it?';
    if (/\b4k|27\s*inch|screen|30k\b/.test(text))
      return 'You sound pleased with it! What has stood out most so far—the picture detail, the extra space, or something else?';
    if (/\bsaved\b/.test(text))
      return 'You worked towards that purchase for months—that gives it a story beyond the screen itself. What was it like finally setting it up?';
    if (/\b(?:talk|back|about)\b.*\bmonitor\b/.test(text))
      return 'We can talk about your monitor. What have you been enjoying on it lately?';
    if (/\b(?:got|bought|ordered)\b.*\bmonitor\b/.test(text))
      return 'A new monitor! How are you liking it so far?';
  }
  if (/\bfailed\b.*\bexam\b/.test(text) && preferences.goal === 'plan')
    return 'That result is disappointing. For tomorrow, try one small step: look at which questions cost you marks, choose one topic, and spend a short session on it. You don’t need to fix the whole subject in one day.';
  return undefined;
}
