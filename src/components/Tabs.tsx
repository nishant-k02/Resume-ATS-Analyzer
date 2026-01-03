"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (v: string) => void;
  tabs: { id: string; label: string; content: ReactNode; icon?: LucideIcon }[];
}) {
  return (
    <div className="w-full">
      <div className="flex gap-1 border-b border-zinc-800/50 mb-6 pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={[
                "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200",
                value === t.id
                  ? "text-white bg-gradient-to-b from-indigo-500/20 to-indigo-500/10 border border-indigo-500/30 border-b-transparent shadow-lg shadow-indigo-500/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30",
              ].join(" ")}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {t.label}
              {value === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-30">
        {tabs.find((t) => t.id === value)?.content}
      </div>
    </div>
  );
}
