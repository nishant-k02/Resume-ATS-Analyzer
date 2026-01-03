const STOPWORDS = new Set([
  // articles / conjunctions / prepositions
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
  "into",
  "over",
  "under",
  "about",
  "between",
  "among",
  "within",
  "without",
  "through",
  "during",
  "before",
  "after",

  // pronouns / determiners
  "i",
  "me",
  "my",
  "mine",
  "you",
  "your",
  "yours",
  "we",
  "us",
  "our",
  "ours",
  "they",
  "them",
  "their",
  "theirs",
  "he",
  "him",
  "his",
  "she",
  "her",
  "hers",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "which",
  "what",

  // helpers / common verbs
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "doing",
  "have",
  "has",
  "had",
  "having",
  "will",
  "would",
  "can",
  "could",
  "shall",
  "should",
  "may",
  "might",
  "must",

  // common filler words in JDs that should not be “keywords”
  "able",
  "ability",
  "responsible",
  "responsibilities",
  "required",
  "requirements",
  "preferred",
  "plus",
  "nice",
  "strong",
  "excellent",
  "good",
  "great",
  "experience",
  "knowledge",
  "skills",
  "skill",
  "team",
  "teams",
]);

function clean(s: string) {
  return s
    .replace(/\r/g, "\n")
    .replace(/[^\p{L}\p{N}+.#/\- ]/gu, " ") // keep letters/numbers plus common skill chars
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isStopLike(token: string) {
  return STOPWORDS.has(token);
}

function isGarbageKeyword(kw: string) {
  // block super-short or purely numeric junk
  if (kw.length < 2) return true;

  // block if it's entirely stopwords (for phrases like "is a")
  const parts = kw.split(" ").filter(Boolean);
  if (parts.length === 0) return true;

  const nonStop = parts.filter((p) => !isStopLike(p));
  if (nonStop.length === 0) return true;

  // block phrases where the *meaningful* part is too short (e.g. "a i", "is a")
  if (nonStop.join("").length < 3) return true;

  return false;
}

export function normalizeText(s: string) {
  return clean(s);
}

export function extractKeywordsBasic(text: string, max = 40): string[] {
  const t = clean(text);
  const tokens = t.split(" ").filter(Boolean);

  const unigrams: string[] = [];
  for (const tok of tokens) {
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    unigrams.push(tok);
  }

  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (!a || !b) continue;

    const bg = `${a} ${b}`;

    // remove bigrams like "is a", "who is", "a the"
    if (isGarbageKeyword(bg)) continue;

    // keep bigrams only if they include at least one non-stop token already
    // (this avoids "strong communication" being removed, because "communication" isn't a stopword)
    bigrams.push(bg);
  }

  const freq = new Map<string, number>();
  for (const k of [...unigrams, ...bigrams]) {
    if (isGarbageKeyword(k)) continue; // ✅ final guard
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([k]) => k)
    .slice(0, max);
}

export function keywordDiff(resumeText: string, jdText: string) {
  const resumeNorm = clean(resumeText);
  const jdKeywords = extractKeywordsBasic(jdText, 50).filter(
    (k) => !isGarbageKeyword(k)
  );

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

export function computeAtsScoreFromBreakdown(
  breakdownWeightedMatch: number,
  resumeRaw: string
) {
  let score = 0.7 * breakdownWeightedMatch;

  const r = resumeRaw.toLowerCase();

  const has = (re: RegExp) => re.test(r);

  // Section completeness (max 10)
  let section = 0;
  section += has(/\bexperience\b/) ? 3 : 0;
  section += has(/\bskills\b/) ? 3 : 0;
  section += has(/\beducation\b/) ? 2 : 0;
  section += has(/\bprojects?\b/) ? 2 : 0;

  // Metrics / impact (max 10)
  const hasMetrics = /(\b\d+%|\$\d+|\b\d+\b)/.test(resumeRaw);
  const metrics = hasMetrics ? 10 : 3;

  // Bullet structure (max 10)
  const bulletLines = resumeRaw
    .split("\n")
    .filter((l) => /^\s*[-•*]\s+/.test(l)).length;
  const bullets = bulletLines >= 6 ? 10 : bulletLines >= 3 ? 7 : 4;

  // Total heuristics contribution out of 30
  const heuristics = section + metrics * 0.5 + bullets * 0.5;

  score += heuristics;

  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}
