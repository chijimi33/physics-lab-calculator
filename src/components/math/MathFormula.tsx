"use client";

import { BlockMath, InlineMath } from "react-katex";

type MathFormulaProps = {
  formula: string;
  inline?: boolean;
  className?: string;
};

export function MathFormula({
  formula,
  inline = false,
  className = "",
}: MathFormulaProps) {
  const fallback = (error: Error) => (
    <code className="rounded bg-red-50 px-1 py-0.5 text-red-700">
      {formula}
      {error.message ? ` (${error.message})` : ""}
    </code>
  );

  if (inline) {
    return (
      <span className={className}>
        <InlineMath math={formula} renderError={fallback} />
      </span>
    );
  }

  return (
    <div
      className={`math-formula-block rounded border border-slate-200 bg-white px-3 py-3 text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 ${className}`}
    >
      <BlockMath math={formula} renderError={fallback} />
    </div>
  );
}
