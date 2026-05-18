import type { ReactNode } from "react";

type ResultCardProps = {
  label: string;
  value: string;
  priority?: "primary" | "normal";
  detail?: string;
  formula?: ReactNode;
  copyText?: string;
};

export function ResultCard({
  label,
  value,
  priority = "normal",
  detail,
  formula,
  copyText,
}: ResultCardProps) {
  const textToCopy = copyText ?? `${label}: ${value}`;
  const isPrimary = priority === "primary";

  return (
    <div
      className={`border-b border-rule px-3 py-3 last:border-b-0 ${
        isPrimary
          ? "border-l-2 border-l-accent bg-slate-50"
          : "border-l-2 border-l-transparent bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-semibold ${isPrimary ? "text-ink" : "text-slate-600"}`}>
          {label}
        </p>
        <button
          type="button"
          aria-label={`${label}をコピー`}
          onClick={() => navigator.clipboard?.writeText(textToCopy)}
          className="border border-rule bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        >
          コピー
        </button>
      </div>
      <p
        className={`mt-1 break-words font-mono font-semibold text-ink ${
          isPrimary ? "text-xl" : "text-lg"
        }`}
      >
        {value}
      </p>
      {formula ? <div className="mt-2">{formula}</div> : null}
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}
