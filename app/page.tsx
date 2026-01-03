"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScoreRing } from "@/src/components/ScoreRing";
import { KeywordBadge } from "@/src/components/KeywordBadge";
import { Tabs } from "@/src/components/Tabs";
import { ModificationCard } from "@/src/components/ModificationCard";
import type { AnalyzeResponse } from "@/src/lib/schemas";

// type AcceptedMap = Record<string, boolean>;
type Decision = "accepted" | "rejected" | null;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePunctuation(s: string) {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");
}

/**
 * Try to replace originalText in resume with suggestedText.
 * Returns { nextText, applied }.
 */
function applyOne(text: string, originalText: string, suggestedText: string) {
  // 1) Exact replace-all
  {
    const escaped = escapeRegex(originalText);
    const re = new RegExp(escaped, "g");
    const next = text.replace(re, suggestedText);
    if (next !== text) return { nextText: next, applied: true };
  }

  // 2) Whitespace-insensitive match:
  // Turn "foo   bar\nbaz" into /foo\s+bar\s+baz/g
  {
    const tokens = originalText.trim().split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const pattern = tokens.map(escapeRegex).join("\\s+");
      const re = new RegExp(pattern, "g");
      const next = text.replace(re, suggestedText);
      if (next !== text) return { nextText: next, applied: true };
    }
  }

  // 3) Normalize punctuation (quotes/hyphens) + whitespace-insensitive
  {
    const normOrig = normalizePunctuation(originalText);
    const normText = normalizePunctuation(text);

    // We need to apply replacements to original text, not normalized only.
    // So we re-run patterns on the ORIGINAL text but using a forgiving regex built from normOrig.
    const tokens = normOrig.trim().split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const pattern = tokens.map(escapeRegex).join("\\s+");
      const re = new RegExp(pattern, "g");
      const next = text.replace(re, suggestedText);
      if (next !== text) return { nextText: next, applied: true };
    }

    // As a last attempt: exact match on normalized (if text was normalized by extraction)
    if (normText.includes(normOrig)) {
      // Replace in normalized world, but apply naive fallback in original:
      // safest: do nothing unless you want a riskier approach.
      // We'll just mark as not applied.
    }
  }

  return { nextText: text, applied: false };
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("modifications");
  const [regenLoading, setRegenLoading] = useState<Record<string, boolean>>({});

  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  // accepted/rejected per suggestion id
  // const [accepted, setAccepted] = useState<AcceptedMap>({});

  // derived updated resume (apply accepted modifications as simple replacements)
  const updatedResume = useMemo(() => {
    if (!result) return resumeText;

    let text = resumeText;

    for (const mod of result.suggestions.modifications) {
      if (decisions[mod.id] === "accepted") {
        const out = applyOne(text, mod.originalText, mod.suggestedText);
        text = out.nextText;
      }
    }

    return text;
  }, [decisions, result, resumeText]);

  const applyReport = useMemo(() => {
    if (!result) return { applied: 0, failed: 0, failedIds: [] as string[] };

    let text = resumeText;
    let applied = 0;
    const failedIds: string[] = [];

    for (const mod of result.suggestions.modifications) {
      if (decisions[mod.id] === "accepted") {
        const out = applyOne(text, mod.originalText, mod.suggestedText);
        text = out.nextText;
        if (out.applied) applied += 1;
        else failedIds.push(mod.id);
      }
    }

    return { applied, failed: failedIds.length, failedIds };
  }, [decisions, result, resumeText]);

  async function handleUpload(file: File) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Upload failed");
      return;
    }

    setResumeText(data.text || "");
  }

  async function analyze() {
    setLoading(true);
    setResult(null);
    // setAccepted({});
    setDecisions({});

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Analyze failed");
      setResult(data);
      setDecisions(() => {
        const next: Record<string, Decision> = {};
        for (const m of data.suggestions.modifications) next[m.id] = null;
        return next;
      });

      setActiveTab("modifications");
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message ?? "Analyze failed");
      } else {
        alert(String(e) || "Analyze failed");
      }
    } finally {
      setLoading(false);
    }
  }

  // placeholder: in MVP, “regen one suggestion” just re-runs analyze
  // next step we’ll implement /api/regenerate-suggestion with stable IDs
  async function regenOneSuggestion(
    suggestionId: string,
    kind: "modification" | "restructuring"
  ) {
    if (!result) return;

    setRegenLoading((p) => ({ ...p, [suggestionId]: true }));

    try {
      const res = await fetch("/api/regenerate-suggestion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          suggestionId,
          kind,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to regenerate");

      setResult((prev) => {
        if (!prev) return prev;

        if (kind === "modification") {
          const mods = prev.suggestions.modifications.map((m) =>
            m.id === suggestionId ? data.suggestion : m
          );
          return {
            ...prev,
            suggestions: { ...prev.suggestions, modifications: mods },
          };
        } else {
          const rs = prev.suggestions.restructuring.map((r) =>
            r.id === suggestionId ? data.suggestion : r
          );
          return {
            ...prev,
            suggestions: { ...prev.suggestions, restructuring: rs },
          };
        }
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Failed";
      alert(msg);
    } finally {
      setRegenLoading((p) => ({ ...p, [suggestionId]: false }));
    }
  }

  const tabs = [
    {
      id: "modifications",
      label: "Modifications",
      content: (
        <div className="space-y-3">
          {!result ? (
            <div className="text-zinc-400 text-sm">
              Run analysis to see AI-powered modifications.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  className="px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-600/30 text-indigo-200 text-sm hover:bg-indigo-600/30"
                  onClick={() => setResumeText(updatedResume)}
                  disabled={
                    result.suggestions.modifications.length === 0 ||
                    !Object.values(decisions).some((d) => d === "accepted")
                  }
                >
                  Regenerate My Resume (apply accepted)
                </button>
                <div className="text-xs text-zinc-500">
                  Applies accepted changes into your resume text area.
                </div>
              </div>

              {result.suggestions.modifications.map((m) => (
                <ModificationCard
                  key={m.id}
                  originalText={m.originalText}
                  suggestedText={m.suggestedText}
                  reason={m.reason}
                  decision={decisions[m.id] ?? null}
                  onDecision={(d) => {
                    // lock decision in parent state
                    setDecisions((prev) => ({ ...prev, [m.id]: d }));

                    // // accepted map is used for updatedResume generation
                    // setAccepted((prev) => ({
                    //   ...prev,
                    //   [m.id]: d === "accepted",
                    // }));
                  }}
                  isRegenerating={!!regenLoading[m.id]}
                  onRegen={() => regenOneSuggestion(m.id, "modification")}
                />
              ))}
            </>
          )}
        </div>
      ),
    },
    {
      id: "restructuring",
      label: "Restructuring",
      content: (
        <div className="space-y-2">
          {!result ? (
            <div className="text-zinc-400 text-sm">
              Run analysis to see restructuring recommendations.
            </div>
          ) : (
            result.suggestions.restructuring.map((r) => (
              <div
                key={r.id}
                className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 flex gap-3"
              >
                <span
                  className={[
                    "px-2 py-1 rounded-full text-xs border h-fit",
                    r.badge === "add" &&
                      "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
                    r.badge === "remove" &&
                      "bg-rose-500/15 border-rose-500/30 text-rose-200",
                    r.badge === "reorder" &&
                      "bg-amber-500/15 border-amber-500/30 text-amber-200",
                    r.badge === "improve" &&
                      "bg-sky-500/15 border-sky-500/30 text-sky-200",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {r.badge.toUpperCase()}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-white">{r.title}</div>
                    <span
                      className={[
                        "text-xs px-2 py-0.5 rounded-full border",
                        r.severity === "high" &&
                          "border-rose-500/30 text-rose-200 bg-rose-500/10",
                        r.severity === "medium" &&
                          "border-amber-500/30 text-amber-200 bg-amber-500/10",
                        r.severity === "low" &&
                          "border-emerald-500/30 text-emerald-200 bg-emerald-500/10",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-300 mt-1">{r.details}</div>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },

    {
      id: "breakdown",
      label: "Breakdown",
      content: (
        <div className="space-y-4">
          {!result ? (
            <div className="text-zinc-400 text-sm">
              Run analysis to see requirement-level breakdown.
            </div>
          ) : (
            <>
              {/* Top summary */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40">
                  <div className="text-xs text-zinc-400 mb-1">
                    Weighted Match
                  </div>
                  <div className="text-2xl font-semibold">
                    {clamp(result.breakdown.weightedMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Requirements weighted by importance.
                  </div>
                </div>

                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40">
                  <div className="text-xs text-zinc-400 mb-1">
                    Must-have Match
                  </div>
                  <div className="text-2xl font-semibold">
                    {clamp(result.breakdown.mustHaveMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Core requirements coverage.
                  </div>
                </div>

                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40">
                  <div className="text-xs text-zinc-400 mb-1">
                    Nice-to-have Match
                  </div>
                  <div className="text-2xl font-semibold">
                    {clamp(result.breakdown.niceToHaveMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Helpful extras coverage.
                  </div>
                </div>
              </div>

              {/* Requirements list */}
              <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-white">Requirements</div>
                    <div className="text-xs text-zinc-400">
                      Matched requirements include evidence from your resume.
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Total: {result.breakdown.requirements.length}
                  </div>
                </div>

                <div className="space-y-3">
                  {result.breakdown.requirements.map((req) => {
                    const matched = result.breakdown.matched.find(
                      (m) => m.requirementId === req.id
                    );
                    const missing = result.breakdown.missing.find(
                      (m) => m.requirementId === req.id
                    );

                    const status = matched ? "matched" : "missing";

                    return (
                      <div
                        key={req.id}
                        className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/30"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "px-2 py-1 rounded-full text-xs border",
                              status === "matched"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                                : "bg-rose-500/15 border-rose-500/30 text-rose-200",
                            ].join(" ")}
                          >
                            {status === "matched" ? "MATCHED" : "MISSING"}
                          </span>

                          <span
                            className={[
                              "px-2 py-1 rounded-full text-xs border",
                              req.importance === "must"
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
                                : "bg-sky-500/15 border-sky-500/30 text-sky-200",
                            ].join(" ")}
                          >
                            {req.importance === "must"
                              ? "MUST-HAVE"
                              : "NICE-TO-HAVE"}
                          </span>

                          <span className="px-2 py-1 rounded-full text-xs border border-zinc-800 text-zinc-300 bg-zinc-900/40">
                            {req.category}
                          </span>

                          <span className="text-sm text-white font-medium">
                            {req.skill}
                          </span>

                          <span className="ml-auto text-xs text-zinc-500">
                            weight: {req.weight.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-3 grid md:grid-cols-2 gap-3">
                          <div className="border border-zinc-800 rounded-lg p-3">
                            <div className="text-xs text-zinc-400 mb-1">
                              Evidence in JD
                            </div>
                            <div className="text-sm text-zinc-200 whitespace-pre-wrap">
                              {req.evidenceInJD}
                            </div>
                          </div>

                          <div className="border border-zinc-800 rounded-lg p-3">
                            <div className="text-xs text-zinc-400 mb-1">
                              {matched ? "Evidence in Resume" : "Suggestion"}
                            </div>
                            {matched ? (
                              <div className="text-sm text-zinc-200 whitespace-pre-wrap">
                                {matched.evidenceInResume}
                              </div>
                            ) : (
                              <div className="text-sm text-zinc-200 whitespace-pre-wrap">
                                {missing?.suggestion ??
                                  "Consider adding this if it truthfully applies to you."}
                              </div>
                            )}
                          </div>
                        </div>

                        {req.aliases?.length ? (
                          <div className="mt-3">
                            <div className="text-xs text-zinc-400 mb-2">
                              Aliases
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {req.aliases.slice(0, 12).map((a) => (
                                <span
                                  key={`${req.id}-${a}`}
                                  className="px-2 py-1 rounded-full text-xs border border-zinc-800 text-zinc-300 bg-zinc-900/40"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      ),
    },

    {
      id: "updated",
      label: "Updated Resume",
      content: (
        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40">
          <div className="text-xs text-zinc-400 mb-2">
            Preview after applying accepted modifications
          </div>
          {result && (
            <div className="text-xs text-zinc-400 mb-3">
              Applied:{" "}
              <span className="text-zinc-200">{applyReport.applied}</span>{" "}
              &nbsp;|&nbsp; Failed to apply:{" "}
              <span className="text-zinc-200">{applyReport.failed}</span>
              {applyReport.failed > 0 ? (
                <div className="mt-2 text-amber-200">
                  Some accepted changes could not be applied because the exact
                  text was not found in your resume. (This can happen due to PDF
                  formatting or edits after analysis.)
                </div>
              ) : null}
            </div>
          )}

          <pre className="text-sm text-zinc-200 whitespace-pre-wrap">
            {updatedResume}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-semibold">Resume ATS Analyzer</h1>
            <p className="text-sm text-zinc-400">
              Upload/paste a resume, add a job description, and get ATS scoring
              + AI improvements.
            </p>
          </div>

          <button
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              setResumeText("");
              setJobDescription("");
              setResult(null);
              // setAccepted({});
              setDecisions({});
              setRegenLoading({});
            }}
          >
            Reset
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Resume */}
          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-200">Resume</div>
              <label className="text-sm cursor-pointer px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
                Upload PDF/DOCX
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here..."
              className="w-full min-h-70 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>

          {/* JD */}
          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950/40">
            <div className="text-sm text-zinc-200 mb-3">Job Description</div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full min-h-70 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3 items-center">
          <button
            onClick={analyze}
            disabled={loading || !resumeText.trim() || !jobDescription.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          <div className="text-xs text-zinc-500">
            Tip: For best results, paste the full JD (responsibilities +
            requirements).
          </div>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border border-zinc-800 rounded-2xl p-4 bg-zinc-950/40"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex gap-6">
                <ScoreRing value={result.matchPercentage} label="Match" />
                <ScoreRing value={result.atsScore} label="ATS Score" />
              </div>

              <div className="flex-1">
                <div className="text-sm text-zinc-200 mb-2">Keywords</div>

                <div className="mb-3">
                  <div className="text-xs text-zinc-400 mb-2">Present</div>
                  <div className="flex flex-wrap gap-2">
                    {result.presentKeywords.slice(0, 30).map((k) => (
                      <KeywordBadge key={k} text={k} variant="present" />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-2">Missing</div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.slice(0, 30).map((k) => (
                      <KeywordBadge key={k} text={k} variant="missing" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
