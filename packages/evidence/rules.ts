// Prototype rules, authored for regression testing. These are not a validated screening instrument.
export const supportRules = [
  {
    id: "persistence",
    weight: 2,
    pattern:
      /\b(?:all week|for (?:weeks|months|days)|every day|daily|keeps? happening|keeps? (?:arguing|fighting|shouting)|again and again|for (?:\d+|two|three|four|five|six|seven) (?:days|weeks|months))\b/g,
  },
  {
    id: "function",
    weight: 2,
    pattern:
      /\b(?:can(?:not|'t) (?:focus|sleep|study|work|eat)|(?:unable to|not (?:being )?able to) (?:focus|sleep|study|work|eat)|barely (?:slept|sleeping)|affecting my (?:sleep|classes|work)|avoiding friends|missing (?:classes|work)|disrupting my)\b/g,
  },
  {
    id: "overwhelm",
    weight: 1,
    pattern: /\b(?:overwhelmed|overwhelming|too much to handle)\b/g,
  },
  {
    id: "coping",
    weight: 1,
    pattern:
      /\b(?:usual (?:routine|coping|approach).{0,35}(?:not helping|isn't helping|is not helping|doesn't help)|nothing (?:helps|is helping)|coping.{0,25}(?:isn't working|not working))\b/g,
  },
];
export const safetyRules = [
  {
    id: "current-harm",
    pattern: /\b(?:i\s+(?:(?:will|'ll|ll)\s+)?(?:better\s+)?(?:go\s+)?die|(?:wanna|want to|want 2)\s+die|better\s+(?:go\s+)?die)\b/g,
  },
  {
    id: "physical-assault",
    pattern: /\b(?:(?:slapped|punched|kicked|beaten|hitting|hit|slapping|beating)\s+me|(?:mom|mum|mother|dad|father|parent|partner|he|she)\s+(?:just\s+)?(?:slapped|punched|kicked|hit)\s+me)\b/g,
  },
  {
    id: "current-harm",
    pattern:
      /\b(?:hurt(?:ing)?|harm(?:ed|ing)?|kill(?:ed|ing)?)\s+(?:myself|himself|herself|themselves)|\b(?:end(?:ing)?|take|taking)\s+my\s+life|\b(?:suicid(?:e|al)|wants? to die|feel(?:s|ing)? like (?:dying|ending (?:my|their) life)|wish i (?:was|were) dead|wish i (?:could|would) die|want to be dead|(?:don't|dont|do not) want to (?:live|be alive)|no reason to live)\b/g,
  },
  {
    id: "danger",
    pattern:
      /\b(?:not safe|unsafe|threatening me|threatened me|being attacked|in immediate danger|hurt someone|kill someone|overdos(?:e|ed)|taken too many pills)\b/g,
  },
];
export const ambiguity =
  /\b(?:can't do this anymore|cannot do this anymore|can't go on|cannot go on|give up on everything|want to disappear|better off without me|don't want to wake up|do not want to wake up|i(?:'m| am) (?:so )?done(?: with (?:everything|life))?)\b/g;
