import { SentimentIntensityAnalyzer } from 'vader-sentiment';
import { throwIfAborted } from '../utils/throwIfAborted.ts';

/** Advisory text polarity. Never a diagnosis, emotion certainty, or safety score. */
export async function analyseSentiment(input: string, signal: AbortSignal) {
  const text = input.normalize('NFKC'); // Preserve case: emphasis is part of VADER.
  let processed = 0, count = 0, sum = 0, min = 1, max = -1;
  // Bounded sections keep the older JS port responsive. Aggregation is our
  // approximate section mean, not VADER's single-document compound score.
  while (processed < text.length) {
    throwIfAborted(signal);
    let end = Math.min(processed + 1800, text.length);
    if (end < text.length) {
      const space = text.lastIndexOf(' ', end);
      if (space > processed) end = space + 1;
    }
    const score = SentimentIntensityAnalyzer.polarity_scores(text.slice(processed, end)).compound;
    sum += score; min = Math.min(min, score); max = Math.max(max, score);
    count++; processed = end;
    if (count % 8 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  return { mean: count ? sum / count : 0, min: count ? min : 0, max: count ? max : 0, sections: count, processed };
}
