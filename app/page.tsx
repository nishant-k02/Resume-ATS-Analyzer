"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  Sparkles,
  RotateCcw,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  Target,
  TrendingUp,
  FileCheck,
  // Edit,
  BarChart3,
  Eye,
  Wand2,
  ArrowRight,
  Info,
  Plus,
  Minus,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import { ScoreRing } from "@/src/components/ScoreRing";
import { KeywordBadge } from "@/src/components/KeywordBadge";
import { Tabs } from "@/src/components/Tabs";
import { ModificationCard } from "@/src/components/ModificationCard";
import { Navbar } from "@/src/components/Navbar";
import { Footer } from "@/src/components/Footer";
import type { AnalyzeResponse } from "@/src/lib/schemas";

type AcceptedMap = Record<string, boolean>;
type Decision = "accepted" | "rejected" | null;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
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
  const [accepted, setAccepted] = useState<AcceptedMap>({});

  // derived updated resume (apply accepted modifications as simple replacements)
  const updatedResume = useMemo(() => {
    if (!result) return resumeText;
    let text = resumeText;

    for (const mod of result.suggestions.modifications) {
      if (accepted[mod.id]) {
        // naive replacement: first occurrence
        const idx = text.indexOf(mod.originalText);
        if (idx >= 0) {
          text =
            text.slice(0, idx) +
            mod.suggestedText +
            text.slice(idx + mod.originalText.length);
        }
      }
    }
    return text;
  }, [accepted, result, resumeText]);

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
    setAccepted({});
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
      icon: Wand2,
      content: (
        <div className="space-y-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800/50">
              <Wand2 className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Run analysis to see AI-powered modifications.</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-sm font-medium hover:from-indigo-600/40 hover:to-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  onClick={() => setResumeText(updatedResume)}
                  disabled={result.suggestions.modifications.length === 0}
                >
                  <ArrowRight className="w-4 h-4" />
                  Apply Accepted Changes
                </button>
                <div className="text-xs text-zinc-400 leading-relaxed">
                  Applies all accepted modifications into your resume text area.
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

                    // accepted map is used for updatedResume generation
                    setAccepted((prev) => ({
                      ...prev,
                      [m.id]: d === "accepted",
                    }));
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
      icon: TrendingUp,
      content: (
        <div className="space-y-3">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800/50">
              <TrendingUp className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Run analysis to see restructuring recommendations.</span>
            </div>
          ) : (
            result.suggestions.restructuring.map((r) => (
              <div
                key={r.id}
                className="group border border-zinc-800/50 rounded-xl p-4 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm hover:border-zinc-700/50 hover:shadow-lg transition-all duration-300 flex gap-3"
              >
                <span
                  className={[
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border h-fit",
                    r.badge === "add" &&
                      "bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border-emerald-500/40 text-emerald-200",
                    r.badge === "remove" &&
                      "bg-gradient-to-r from-rose-500/20 to-rose-400/20 border-rose-500/40 text-rose-200",
                    r.badge === "reorder" &&
                      "bg-gradient-to-r from-amber-500/20 to-amber-400/20 border-amber-500/40 text-amber-200",
                    r.badge === "improve" &&
                      "bg-gradient-to-r from-sky-500/20 to-sky-400/20 border-sky-500/40 text-sky-200",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {r.badge === "add" && <Plus className="w-3 h-3" />}
                  {r.badge === "remove" && <Minus className="w-3 h-3" />}
                  {r.badge === "reorder" && <ArrowUpDown className="w-3 h-3" />}
                  {r.badge === "improve" && <Zap className="w-3 h-3" />}
                  {r.badge.toUpperCase()}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-white">{r.title}</div>
                    <span
                      className={[
                        "text-xs px-2.5 py-1 rounded-full border font-medium",
                        r.severity === "high" &&
                          "border-rose-500/40 text-rose-200 bg-gradient-to-r from-rose-500/20 to-rose-400/20",
                        r.severity === "medium" &&
                          "border-amber-500/40 text-amber-200 bg-gradient-to-r from-amber-500/20 to-amber-400/20",
                        r.severity === "low" &&
                          "border-emerald-500/40 text-emerald-200 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20",
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
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800/50">
              <BarChart3 className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Run analysis to see requirement-level breakdown.</span>
            </div>
          ) : (
            <>
              {/* Top summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="group border border-zinc-800/50 rounded-xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Weighted Match
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {clamp(result.breakdown.weightedMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    Requirements weighted by importance.
                  </div>
                </div>

                <div className="group border border-zinc-800/50 rounded-xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Must-have Match
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {clamp(result.breakdown.mustHaveMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    Core requirements coverage.
                  </div>
                </div>

                <div className="group border border-zinc-800/50 rounded-xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm hover:border-sky-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Nice-to-have Match
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {clamp(result.breakdown.niceToHaveMatch)}%
                  </div>
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    Helpful extras coverage.
                  </div>
                </div>
              </div>

              {/* Requirements list */}
              <div className="border border-zinc-800/50 rounded-2xl p-5 lg:p-6 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      <div className="text-sm font-semibold text-white">
                        Requirements
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      Matched requirements include evidence from your resume.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-xs font-medium text-zinc-300">
                    <Info className="w-3.5 h-3.5" />
                    Total: {result.breakdown.requirements.length}
                  </div>
                </div>

                <div className="space-y-4">
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
                        className="group border border-zinc-800/50 rounded-xl p-5 bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 backdrop-blur-sm hover:border-zinc-700/50 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span
                            className={[
                              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                              status === "matched"
                                ? "bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border-emerald-500/40 text-emerald-200"
                                : "bg-gradient-to-r from-rose-500/20 to-rose-400/20 border-rose-500/40 text-rose-200",
                            ].join(" ")}
                          >
                            {status === "matched" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                MATCHED
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                MISSING
                              </>
                            )}
                          </span>

                          <span
                            className={[
                              "px-3 py-1 rounded-full text-xs font-medium border",
                              req.importance === "must"
                                ? "bg-gradient-to-r from-amber-500/20 to-amber-400/20 border-amber-500/40 text-amber-200"
                                : "bg-gradient-to-r from-sky-500/20 to-sky-400/20 border-sky-500/40 text-sky-200",
                            ].join(" ")}
                          >
                            {req.importance === "must"
                              ? "MUST-HAVE"
                              : "NICE-TO-HAVE"}
                          </span>

                          <span className="px-3 py-1 rounded-full text-xs font-medium border border-zinc-800/50 text-zinc-300 bg-zinc-900/60">
                            {req.category}
                          </span>

                          <span className="text-sm text-white font-semibold">
                            {req.skill}
                          </span>

                          <span className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/40 border border-zinc-800/50">
                            weight: {req.weight.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                          <div className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-950/40">
                            <div className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                              Evidence in JD
                            </div>
                            <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                              {req.evidenceInJD}
                            </div>
                          </div>

                          <div className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-950/40">
                            <div className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                              {matched ? "Evidence in Resume" : "Suggestion"}
                            </div>
                            {matched ? (
                              <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                {matched.evidenceInResume}
                              </div>
                            ) : (
                              <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed italic">
                                {missing?.suggestion ??
                                  "Consider adding this if it truthfully applies to you."}
                              </div>
                            )}
                          </div>
                        </div>

                        {req.aliases?.length ? (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wide">
                              Aliases
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {req.aliases.slice(0, 12).map((a) => (
                                <span
                                  key={`${req.id}-${a}`}
                                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-800/50 text-zinc-300 bg-zinc-900/60"
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
      icon: FileCheck,
      content: (
        <div className="border border-zinc-800/50 rounded-xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-indigo-400" />
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Preview after applying accepted modifications
            </div>
          </div>
          <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-950/40 rounded-lg p-4 border border-zinc-800/50 overflow-x-auto">
            {updatedResume}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 relative z-10" id="analyzer">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent mb-2">
              ResumeLens
            </h1>
            <p className="text-sm lg:text-base text-zinc-400 leading-relaxed">
              Upload or paste your resume, add a job description, and get
              AI-powered ATS scoring
              <span className="text-indigo-400">
                {" "}
                + intelligent improvements
              </span>
              .
            </p>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 text-zinc-200 hover:bg-zinc-800/60 hover:border-zinc-700/50 hover:shadow-lg transition-all duration-200 font-medium text-sm"
            onClick={() => {
              setResumeText("");
              setJobDescription("");
              setResult(null);
              setAccepted({});
              setDecisions({});
              setRegenLoading({});
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resume */}
          <div className="group relative border border-zinc-800/50 rounded-2xl p-5 bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-zinc-700/50 transition-all duration-300 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4 h-[40px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div className="text-sm font-semibold text-zinc-200">
                    Resume
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all duration-200 font-medium whitespace-nowrap">
                  <Upload className="w-4 h-4" />
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
                className="w-full flex-1 min-h-[320px] bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* JD */}
          <div className="group relative border border-zinc-800/50 rounded-2xl p-5 bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-zinc-700/50 transition-all duration-300 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4 h-[40px]">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <div className="text-sm font-semibold text-zinc-200">
                    Job Description
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm px-4 py-2 invisible">
                  <Upload className="w-4 h-4" />
                  <span>Upload PDF/DOCX</span>
                </div>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                className="w-full flex-1 min-h-[320px] bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <button
            onClick={analyze}
            disabled={loading || !resumeText.trim() || !jobDescription.trim()}
            className="group relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:hover:from-indigo-600 disabled:hover:to-purple-600 transition-all duration-200 font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 disabled:shadow-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Resume</span>
              </>
            )}
          </button>

          <div className="flex items-start gap-2 text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800/50 rounded-lg px-3 py-2 backdrop-blur-sm">
            <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Tip: For best results, paste the full JD (responsibilities +
              requirements).
            </span>
          </div>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 border border-zinc-800/50 rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 backdrop-blur-sm shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-8">
              <div className="flex gap-8 justify-center lg:justify-start">
                <ScoreRing value={result.matchPercentage} label="Match" />
                <ScoreRing value={result.atsScore} label="ATS Score" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <div className="text-sm font-semibold text-zinc-200">
                    Keywords
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-medium text-emerald-400/80 mb-3 uppercase tracking-wide">
                    Present
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.presentKeywords.slice(0, 30).map((k) => (
                      <KeywordBadge key={k} text={k} variant="present" />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-rose-400/80 mb-3 uppercase tracking-wide">
                    Missing
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.slice(0, 30).map((k) => (
                      <KeywordBadge key={k} text={k} variant="missing" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} />
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
