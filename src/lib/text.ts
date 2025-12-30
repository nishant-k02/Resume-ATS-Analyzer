const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "else",
  "when",
  "while",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "them",
  "our",
  "your",
  "their",
]);

function clean(s: string) {
  return s
    .replace(/\r/g, "\n")
    .replace(/[^\p{L}\p{N}+.#/\- ]/gu, " ") // keep letters/numbers plus common skill chars
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeText(s: string) {
  return clean(s);
}

export function extractKeywordsBasic(text: string, max = 40): string[] {
  const t = clean(text);
  const tokens = t.split(" ").filter(Boolean);

  // add simple 2-grams (e.g., "machine learning", "react js")
  const unigrams: string[] = [];
  for (const tok of tokens) {
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    unigrams.push(tok);
  }

  const bigrams: string[] = [];
  for (let i = 0; i < unigrams.length - 1; i++) {
    const a = unigrams[i];
    const b = unigrams[i + 1];
    const bg = `${a} ${b}`;
    // avoid useless bigrams
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    bigrams.push(bg);
  }

  // frequency rank
  const freq = new Map<string, number>();
  for (const k of [...unigrams, ...bigrams]) {
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([k]) => k)
    .slice(0, max);
}

export function keywordDiff(resumeText: string, jdText: string) {
  const resumeNorm = clean(resumeText);
  const jdKeywords = extractKeywordsBasic(jdText, 50);

  const present: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    if (resumeNorm.includes(kw)) present.push(kw);
    else missing.push(kw);
  }

  return { presentKeywords: present, missingKeywords: missing };
}

export function scoreFromKeywords(
  present: string[],
  missing: string[],
  resumeRaw?: string
) {
  const total = present.length + missing.length;
  const coverage = total === 0 ? 0 : present.length / total;

  const matchPercentage = Math.round(coverage * 100);

  let ats = matchPercentage;

  if (resumeRaw) {
    const r = resumeRaw.toLowerCase();

    const has = (re: RegExp) => re.test(r);

    // Section presence bonuses
    const sectionBonus =
      (has(/\bexperience\b/) ? 4 : 0) +
      (has(/\bskills\b/) ? 4 : 0) +
      (has(/\beducation\b/) ? 3 : 0) +
      (has(/\bprojects?\b/) ? 2 : 0);

    // Impact metrics bonus (numbers, %, $, etc.)
    const metricsBonus = has(/(\b\d+%|\$\d+|\b\d+\b)/) ? 4 : 0;

    // Action verbs bonus (rough signal)
    const actionBonus = has(
      /\b(led|built|implemented|designed|optimized|delivered|improved|launched)\b/
    )
      ? 3
      : 0;

    // Bullet usage penalty if almost no bullet-like lines
    const bulletLines = resumeRaw
      .split("\n")
      .filter((l) => /^\s*[-•*]\s+/.test(l)).length;
    const bulletPenalty = bulletLines < 3 ? -3 : 0;

    ats += sectionBonus + metricsBonus + actionBonus + bulletPenalty;
  }

  ats = Math.max(0, Math.min(100, Math.round(ats)));

  return { matchPercentage, atsScore: ats };
}
