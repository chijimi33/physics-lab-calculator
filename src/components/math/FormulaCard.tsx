"use client";

import { MathFormula } from "./MathFormula";
import type { FormulaDefinition } from "@/src/experiments";

type FormulaCardProps = {
  formula: FormulaDefinition;
  index: number;
};

export function FormulaCard({ formula, index }: FormulaCardProps) {
  return (
    <article className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {index + 1}
        </span>
        <h3 className="text-sm font-bold text-ink dark:text-slate-50">
          {formula.label}
        </h3>
      </div>
      <MathFormula
        formula={formula.expression}
        ariaLabel={`${formula.label}: ${formula.expression}`}
        plainText={formula.expression}
      />
      {formula.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {formula.description}
        </p>
      ) : null}
    </article>
  );
}
