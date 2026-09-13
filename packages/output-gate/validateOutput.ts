export function validateOutput(text: string): {
  accepted: boolean;
  reason: string;
} {
  if (!text.trim() || text.length > 1600)
    return { accepted: false, reason: "length" };
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  if (words.length > 15 && Math.max(...counts.values()) / words.length > 0.3)
    return { accepted: false, reason: "degenerate-repetition" };
  if (/^(?:reply|user|companion)\s*:/i.test(text.trim()))
    return { accepted: false, reason: "role-label-leak" };
  if (/https?:|www\.|\b\d{3}[- ]?\d{3}[- ]?\d{4}\b/.test(text))
    return { accepted: false, reason: "unverified-resource" };
  if (
    /\b(diagnos|prescrib|medication|dosage|kill|suicid|hurt yourself|harm yourself|guarantee|therapist|doctor|cure|ignore.{0,12}rules|system prompt)/i.test(
      text,
    )
  )
    return { accepted: false, reason: "restricted-content" };
  return {
    accepted: true,
    reason: "basic-checks-passed-not-clinical-validation",
  };
}
