"use client";

export function KeywordBadge({
  text,
  variant,
}: {
  text: string;
  variant: "present" | "missing";
}) {
  const base = "px-2 py-1 rounded-full text-xs border whitespace-nowrap";
  const styles =
    variant === "present"
      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
      : "bg-rose-500/15 border-rose-500/30 text-rose-200";

  return <span className={`${base} ${styles}`}>{text}</span>;
}
