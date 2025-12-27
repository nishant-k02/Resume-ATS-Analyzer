"use client";

import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24">
        <CircularProgressbar value={value} text={`${value}%`} />
      </div>
      <div className="text-sm text-zinc-300">{label}</div>
    </div>
  );
}
