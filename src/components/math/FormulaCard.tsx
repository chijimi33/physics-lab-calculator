"use client";

import { MathFormula } from "./MathFormula";
import type { FormulaDefinition } from "@/src/experiments";

type FormulaCardProps = {
  formula: FormulaDefinition;
  index: number;
};

export function FormulaCard({ formula, index }: FormulaCardProps) {
  return (
    <article className="border border-rule bg-gray-50 p-3">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-xs font-semibold text-slate-500">
          {index + 1}.
        </span>
        <h3 className="text-sm font-bold text-ink">
          {formula.label}
        </h3>
      </div>
      <MathFormula
        formula={formula.expression}
        ariaLabel={`${formula.label}: ${formula.expression}`}
        plainText={formula.expression}
      />
      {formula.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {formula.description}
        </p>
      ) : null}
    </article>
  );
}
