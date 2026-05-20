import type { ReactNode } from "react";

type ResultCardProps = {
  label: string;
  value: string;
  priority?: "primary" | "normal";
  detail?: string;
  formula?: ReactNode;
  copyText?: string;
  rawValue?: string;
  workingValue?: string;
  hiddenDigits?: string;
  significantDigits?: string;
  roundingReason?: string;
  precisionWarnings?: string[];
};

export function ResultCard({
  label,
  value,
  priority = "normal",
  detail,
  formula,
  copyText,
  rawValue,
  workingValue,
  hiddenDigits,
  significantDigits,
  roundingReason,
  precisionWarnings = [],
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
        className={`mt-1 whitespace-pre-wrap break-words font-mono font-semibold text-ink ${
          isPrimary ? "text-xl" : "text-lg"
        }`}
      >
        {value}
      </p>
      {rawValue || workingValue || hiddenDigits || significantDigits || roundingReason ? (
        <dl className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
          {workingValue ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">中間保持値:</dt>
              <dd className="font-mono">{workingValue}</dd>
            </div>
          ) : null}
          {rawValue ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">rawValue:</dt>
              <dd className="font-mono">{rawValue}</dd>
            </div>
          ) : null}
          {hiddenDigits ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">非表示桁:</dt>
              <dd className="font-mono">{hiddenDigits}</dd>
            </div>
          ) : null}
          {significantDigits ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">推定有効桁数:</dt>
              <dd className="font-mono">{significantDigits}</dd>
            </div>
          ) : null}
          {roundingReason ? (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">丸め理由:</dt>
              <dd>{roundingReason}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {precisionWarnings.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
          {precisionWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      {formula ? <div className="mt-2">{formula}</div> : null}
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}
