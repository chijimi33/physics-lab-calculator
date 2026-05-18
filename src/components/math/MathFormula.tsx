"use client";

import { BlockMath, InlineMath } from "react-katex";

type MathFormulaProps = {
  formula: string;
  inline?: boolean;
  className?: string;
  ariaLabel?: string;
  plainText?: string;
  showCopy?: boolean;
};

export function MathFormula({
  formula,
  inline = false,
  className = "",
  ariaLabel,
  plainText,
  showCopy = true,
}: MathFormulaProps) {
  const fallback = (error: Error) => (
    <code
      aria-label={ariaLabel ?? plainText ?? formula}
      className="rounded bg-red-50 px-1 py-0.5 text-red-700"
    >
      {plainText ?? formula}
      {error.message ? ` (${error.message})` : ""}
    </code>
  );
  const copyFormula = async () => {
    try {
      await navigator.clipboard.writeText(formula);
    } catch {
      // クリップボードが使えない環境では表示だけ継続する。
    }
  };

  if (inline) {
    return (
      <span aria-label={ariaLabel ?? plainText ?? formula} className={className}>
        <InlineMath math={formula} renderError={fallback} />
      </span>
    );
  }

  return (
    <div
      aria-label={ariaLabel ?? plainText ?? formula}
      className={`math-formula-block rounded border border-slate-200 bg-white px-3 py-3 text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <BlockMath math={formula} renderError={fallback} />
        </div>
        {showCopy ? (
          <button
            type="button"
            onClick={copyFormula}
            className="shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            式をコピー
          </button>
        ) : null}
      </div>
    </div>
  );
}
