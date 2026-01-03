"use client";

export function KeywordBadge({
  text,
  variant,
}: {
  text: string;
  variant: "present" | "missing";
}) {
  const base = "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-200";
  const styles =
    variant === "present"
      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border-emerald-500/40 text-emerald-200 hover:from-emerald-500/30 hover:to-emerald-400/30 hover:shadow-md hover:shadow-emerald-500/20"
      : "bg-gradient-to-r from-rose-500/20 to-rose-400/20 border-rose-500/40 text-rose-200 hover:from-rose-500/30 hover:to-rose-400/30 hover:shadow-md hover:shadow-rose-500/20";

  return <span className={`${base} ${styles}`}>{text}</span>;
}
