export function normalise(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

// Offsets refer to normalised text. Every character is covered; overlap protects boundary phrases.
export function* sections(
  text: string,
  size = 1800,
  overlap = 180,
): Generator<{ text: string; offset: number }> {
  if (size <= overlap || overlap < 0)
    throw new Error("Invalid section settings");
  for (let offset = 0; offset < text.length; offset += size - overlap) {
    yield { text: text.slice(offset, offset + size), offset };
    if (offset + size >= text.length) break;
  }
}
