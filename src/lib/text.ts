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

export function scoreFromKeywords(present: string[], missing: string[]) {
  const total = present.length + missing.length;
  const coverage = total === 0 ? 0 : present.length / total;

  // Match is basically coverage
  const matchPercentage = Math.round(coverage * 100);

  // ATS score adds small boosts if the resume looks structured
  // (later we’ll make this much smarter)
  let ats = matchPercentage;

  // slight bonus if resume contains common section headers
  const bonus = (txt: string, pattern: RegExp) => (pattern.test(txt) ? 3 : 0);

  // NOTE: caller will pass normalized resume; keep regex simple
  // We'll add these bonuses in API handler with raw resume text.
  ats = Math.min(100, ats);

  return { matchPercentage, atsScore: ats };
}
