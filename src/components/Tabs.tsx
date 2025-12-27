"use client";

import { ReactNode } from "react";

export function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (v: string) => void;
  tabs: { id: string; label: string; content: ReactNode }[];
}) {
  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-zinc-800 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={[
              "px-3 py-2 text-sm rounded-t-md transition",
              value === t.id
                ? "bg-zinc-900 text-white border border-zinc-800 border-b-transparent"
                : "text-zinc-400 hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {tabs.find((t) => t.id === value)?.content}
      </div>
    </div>
  );
}
