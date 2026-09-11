/**
 * Normalizes text for lenient answer comparison: lowercase, diacritics
 * stripped, punctuation removed, whitespace collapsed. "Café-Bar!" and
 * "cafe bar" both normalize to "cafe bar".
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[.,!?'"();:\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Splits the pipe-separated alt-answers column into a clean list. */
export function splitAltAnswers(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** True if `input` matches the canonical answer or any accepted alternate. */
export function isAnswerAccepted(input: string, canonical: string, alternates: string[]): boolean {
  const normalizedInput = normalizeAnswer(input)
  if (!normalizedInput) return false
  const accepted = [canonical, ...alternates].map(normalizeAnswer)
  return accepted.includes(normalizedInput)
}
