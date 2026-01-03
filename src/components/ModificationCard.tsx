"use client";

import { CheckCircle2, XCircle, RefreshCw, Sparkles } from "lucide-react";

type Decision = "accepted" | "rejected" | null;

export function ModificationCard({
  originalText,
  suggestedText,
  reason,
  decision,
  onDecision,
  onRegen,
  isRegenerating,
}: {
  originalText: string;
  suggestedText: string;
  reason: string;
  decision: Decision;
  onDecision: (d: Exclude<Decision, null>) => void;
  onRegen: () => void;
  isRegenerating: boolean;
}) {
  return (
    <div className="group relative border border-zinc-800/50 rounded-2xl p-5 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-zinc-700/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Reason</div>
        </div>
        <div className="text-sm text-zinc-100 mb-5 leading-relaxed">{reason}</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800/50 p-4 bg-zinc-950/40 backdrop-blur-sm hover:border-rose-500/30 transition-colors">
            <div className="text-xs font-medium text-rose-400/80 mb-2 uppercase tracking-wide">Original</div>
            <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {originalText}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 p-4 bg-zinc-950/40 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
            <div className="text-xs font-medium text-emerald-400/80 mb-2 uppercase tracking-wide">Suggested</div>
            <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {suggestedText}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-5 items-center">
          {decision === null ? (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm font-medium hover:from-emerald-600/30 hover:to-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={() => onDecision("accepted")}
                disabled={isRegenerating}
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600/20 to-rose-500/20 border border-rose-500/30 text-rose-200 text-sm font-medium hover:from-rose-600/30 hover:to-rose-500/30 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={() => onDecision("rejected")}
                disabled={isRegenerating}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>

              <button
                className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-zinc-200 text-sm font-medium hover:bg-zinc-800/60 hover:border-zinc-700/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={onRegen}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Regenerating…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <span
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-lg",
                decision === "accepted"
                  ? "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border-emerald-500/30 text-emerald-200 shadow-emerald-500/20"
                  : "bg-gradient-to-r from-rose-600/20 to-rose-500/20 border-rose-500/30 text-rose-200 shadow-rose-500/20",
              ].join(" ")}
            >
              {decision === "accepted" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Accepted
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Rejected
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
