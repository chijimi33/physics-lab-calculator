import type { ReactNode } from "react";

type ResultCardProps = {
  label: string;
  value: string;
  detail?: string;
  formula?: ReactNode;
  copyText?: string;
};

export function ResultCard({
  label,
  value,
  detail,
  formula,
  copyText,
}: ResultCardProps) {
  const textToCopy = copyText ?? `${label}: ${value}`;

  return (
    <div className="rounded border border-rule bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(textToCopy)}
          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          コピー
        </button>
      </div>
      <p className="mt-2 break-words font-mono text-xl font-bold text-ink">
        {value}
      </p>
      {formula ? <div className="mt-3">{formula}</div> : null}
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}
