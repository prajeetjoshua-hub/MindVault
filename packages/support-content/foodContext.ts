/** Small authored food conversation coverage for ordinary, non-clinical chat. */
const foodWords =
  /\b(?:idli|dosa|vada|poori|upma|pongal|paratha|chapati|roti|naan|rice|biryani|dal|sambar|rasam|curry|paneer|chicken|fish|egg|eggs|meat|pizza|burger|fries|noodles|pasta|sandwich|salad|soup|fruit|fruits|vegetables|veggies|cake|ice cream|chocolate|sweet|sweets|biscuits?|cookies?|chips?|popcorn|snack|snacks)\b/;
const drinkWords =
  /\b(?:tea|chai|coffee|water|juice|milk|smoothie|shake|lemonade)\b/;

export function foodReply(
  text: string,
  _context: string,
  previousReply = "",
): string | undefined {
  const choose = (answers: string[]) =>
    answers.find((answer) => answer !== previousReply) ?? answers[0];
  const food = text.match(foodWords)?.[0];
  const drink = text.match(drinkWords)?.[0];
  const mealCue = /\b(?:breakfast|lunch|dinner|brunch|meal|snack|food|hungry)\b/.test(
    text,
  );
  const mealReport =
    /\b(?:i|we)\s+(?:just\s+)?(?:ate|had|ordered|cooked|made|tried|am having|are having)\b/.test(
      text,
    ) &&
    (Boolean(food) || Boolean(drink) || mealCue);
  if (mealReport && food)
    return choose([
      `That ${food} sounds good! Did it hit the spot, or were you trying something new?`,
      `${food[0].toUpperCase()}${food.slice(1)} is a lovely choice. Was it homemade or from somewhere outside?`,
    ]);
  if (mealReport && drink)
    return choose([
      `A ${drink} sounds nice. Was it a quick pick-me-up or a little break for you?`,
      `That ${drink} sounds like a good pause in the day. How are you feeling now?`,
    ]);
  if (mealReport)
    return choose([
      "How was it? Did it hit the spot, or are you still deciding what you feel like eating?",
      "I’m listening. Was that meal comforting, exciting, or just something you grabbed quickly?",
    ]);
  if (/\b(?:hungry|starving|need to eat|want something to eat)\b/.test(text))
    return choose([
      "Being hungry can make everything feel harder. What sounds manageable right now—something warm, light, or filling?",
      "Let’s find something that feels doable. Are you in the mood for a proper meal, a snack, or a drink first?",
    ]);
  if (/\b(?:not hungry|no appetite|lost my appetite|don'?t feel like eating)\b/.test(text))
    return choose([
      "I’m sorry food doesn’t feel appealing right now. Is that because you’re stressed, feeling unwell, or simply not hungry today?",
      "That can happen when a lot is going on. Would something small and easy feel manageable, or would you rather leave food for a little later?",
    ]);
  if (/\b(?:favourite|favorite) food\b|\bwhat do you like to eat\b/.test(text))
    return "I don’t eat, so I don’t have a favourite food, but I’d love to hear yours. What do you usually crave?";
  if (/\b(?:cooking|cook|baking|bake|recipe)\b/.test(text))
    return choose([
      "That sounds fun. What are you making?",
      "A kitchen project! Are you following a recipe or making it your own way?",
    ]);
  if (/\b(?:food|meal)\b.*\b(?:bad|awful|terrible|disgusting|tasteless)\b|\b(?:bad|awful|terrible)\s+(?:food|meal)\b/.test(text))
    return "Oh no, that sounds disappointing. Was it the taste, the portion, or how it was prepared?";
  return undefined;
}
