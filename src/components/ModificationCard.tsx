"use client";

import { useState } from "react";

export function ModificationCard({
  originalText,
  suggestedText,
  reason,
  onAcceptChange,
  onRegen,
}: {
  originalText: string;
  suggestedText: string;
  reason: string;
  onAcceptChange: (accepted: boolean) => void;
  onRegen: () => void;
}) {
  const [accepted, setAccepted] = useState<boolean | null>(null);

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

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-200 text-sm hover:bg-emerald-600/30"
          onClick={() => {
            setAccepted(true);
            onAcceptChange(true);
          }}
        >
          Accept
        </button>
        <button
          className="px-3 py-2 rounded-lg bg-rose-600/20 border border-rose-600/30 text-rose-200 text-sm hover:bg-rose-600/30"
          onClick={() => {
            setAccepted(false);
            onAcceptChange(false);
          }}
        >
          Reject
        </button>
        <button
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm hover:bg-zinc-800"
          onClick={onRegen}
        >
          Regenerate this suggestion
        </button>

        {accepted !== null && (
          <span className="ml-auto text-xs text-zinc-400 self-center">
            Status:{" "}
            <span className={accepted ? "text-emerald-300" : "text-rose-300"}>
              {accepted ? "Accepted" : "Rejected"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
