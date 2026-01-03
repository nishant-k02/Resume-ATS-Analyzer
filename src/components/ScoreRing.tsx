"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const getColor = (val: number) => {
    if (val >= 80) return "#10b981"; // emerald
    if (val >= 60) return "#3b82f6"; // blue
    if (val >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-28 h-28 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl" />
        <CircularProgressbar
          value={value}
          text={`${Math.round(value)}%`}
          styles={buildStyles({
            pathColor: getColor(value),
            textColor: "#ffffff",
            trailColor: "rgba(255, 255, 255, 0.1)",
            textSize: "16px",
            pathTransitionDuration: 0.8,
          })}
        />
      </div>
      <div className="text-sm font-medium text-zinc-200 tracking-wide">
        {label}
      </div>
    </div>
  );
}
