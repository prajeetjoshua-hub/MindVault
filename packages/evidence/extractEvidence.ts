import type { Evidence, Topic } from "../contracts/types.ts";
import { sections } from "../normalisation/normalise.ts";
import { ambiguity, safetyRules, supportRules } from "./rules.ts";
import { throwIfAborted } from "../utils/throwIfAborted.ts";

export async function extractEvidence(
  text: string,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
) {
  const evidence: Evidence[] = [];
  const seen = new Set<string>();
  const total = text.length
    ? Math.max(1, Math.ceil((text.length - 180) / 1620))
    : 0;
  let done = 0;
  const distressContext =
    /\b(?:worried|worry|stressed|stress|sad|low|lonely|overwhelmed|struggling|upset|anxious|nervous|exhausted|depressed|cannot|can't|unable|barely slept|sleep|affecting|avoiding|disrupting|nothing helps)\b/.test(
      text,
    );
  for (const section of sections(text)) {
    throwIfAborted(signal);
    const collect = (
      id: string,
      pattern: RegExp,
      category: Evidence["category"],
      contribution = 0,
    ) => {
      for (const match of section.text.matchAll(
        new RegExp(pattern.source.replace(/ /g, "\\s+"), "g"),
      )) {
        const start = section.offset + match.index!;
        const key = `${id}:${start}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // Negation/history only requests clarification; it never clears safety evidence automatically.
        const prefix =
          text
            .slice(Math.max(0, start - 100), start)
            .split(/\b(?:but|however|now)\b|[.!?;\n]/)
            .at(-1) ?? "";
        const contextualUncertainty =
          category === "safety" &&
          /(?:(?:don'?t|do not|not going to|never)\s+(?:want to\s+|ever\s+)?$|(?:stopped|no longer|not currently|did stop)\s*$|(?:used to|years ago|in (?:a|the) (?:book|movie)|fictional).{0,65}$)/.test(
            prefix,
          );
        const deniedHarm =
          category === "safety" &&
          /(?:didn'?t|did not|haven'?t|have not)\s+$/.test(prefix) &&
          /^(?:hurt|harm(?:ed)?|kill(?:ed)?)\s+myself$/.test(match[0]);
        evidence.push({
          id: deniedHarm
            ? "denied-harm"
            : contextualUncertainty
              ? `${id}-context`
              : id,
          start,
          end: start + match[0].length,
          category:
            deniedHarm || contextualUncertainty ? "uncertainty" : category,
          contribution,
        });
      }
    };
    supportRules.forEach((r) => {
      if (r.id !== "persistence" || distressContext)
        collect(r.id, r.pattern, "support", r.weight);
    });
    safetyRules.forEach((r) => collect(r.id, r.pattern, "safety"));
    collect("ambiguous-safety", ambiguity, "uncertainty");
    onProgress(++done, total);
    if (done % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const topics: [Topic, RegExp][] = [
    [
      "exam",
      /\b(exams?|tests?|study|studies|classes|class|marks|presentation)\b/,
    ],
    ["family", /\b(family|parent|mother|father|home arguments)\b/],
    ["relationships", /\b(friend|breakup|relationship|partner)\b/],
    ["loneliness", /\b(lonely|loneliness|alone|isolated)\b/],
    ["sleep", /\b(sleep|insomnia|tired)\b/],
    ["work", /\b(work|job|career|boss)\b/],
  ];
  const topic: Topic =
    topics.find(([, pattern]) => pattern.test(text))?.[0] ?? "general";
  return { evidence, topic, sectionsProcessed: done };
}
