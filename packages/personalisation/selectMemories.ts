import type { Memory } from "../contracts/types.ts";
const stop = new Set([
  "that",
  "this",
  "with",
  "have",
  "feel",
  "want",
  "like",
  "from",
  "what",
  "when",
  "will",
  "would",
  "should",
  "about",
  "just",
  "been",
  "your",
  "mine",
]);
const words = (text: string) =>
  new Set(
    (text.toLowerCase().match(/[a-z]{4,}/g) || []).filter(
      (word) => !stop.has(word),
    ),
  );
/** Retrieval from explicitly consented notes only. No embeddings, training, or inferred memories. */
export function selectMemories(input: string, memories: Memory[]): Memory[] {
  const terms = words(input);
  return memories
    .map((memory) => ({
      memory,
      score: [...words(memory.text)].filter((word) => terms.has(word)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.memory);
}
