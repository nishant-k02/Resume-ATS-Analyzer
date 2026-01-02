"use client";

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
    <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40">
      <div className="text-xs text-zinc-400 mb-2">Reason</div>
      <div className="text-sm text-zinc-200 mb-4">{reason}</div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400 mb-1">Original</div>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap">
            {originalText}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400 mb-1">Suggested</div>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap">
            {suggestedText}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4 items-center">
        {decision === null ? (
          <>
            <button
              className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-200 text-sm hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onDecision("accepted")}
              disabled={isRegenerating}
            >
              Accept
            </button>

            <button
              className="px-3 py-2 rounded-lg bg-rose-600/20 border border-rose-600/30 text-rose-200 text-sm hover:bg-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onDecision("rejected")}
              disabled={isRegenerating}
            >
              Reject
            </button>

            <button
              className="ml-auto px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={onRegen}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border border-zinc-500 border-t-transparent animate-spin" />
                  Regenerating…
                </>
              ) : (
                "Regenerate this suggestion"
              )}
            </button>
          </>
        ) : (
          <span
            className={[
              "px-3 py-2 rounded-lg text-sm border",
              decision === "accepted"
                ? "bg-emerald-600/15 border-emerald-600/30 text-emerald-200"
                : "bg-rose-600/15 border-rose-600/30 text-rose-200",
            ].join(" ")}
          >
            {decision === "accepted" ? "Accepted" : "Rejected"}
          </span>
        )}
      </div>
    </div>
  );
}
