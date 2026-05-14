export type RelativeErrorTerm = {
  value: number | null;
  error: number | null;
  power: number;
};

export function relativeErrorPropagation(
  terms: RelativeErrorTerm[],
  mode: "linear" | "quadrature" = "linear",
): number | null {
  const contributions = terms.map((term) => {
    if (
      term.value === null ||
      term.error === null ||
      !Number.isFinite(term.value) ||
      !Number.isFinite(term.error) ||
      term.value === 0
    ) {
      return null;
    }

    return Math.abs(term.power) * Math.abs(term.error / term.value);
  });

  if (contributions.some((value) => value === null)) {
    return null;
  }

  const usable = contributions as number[];

  if (mode === "quadrature") {
    return Math.sqrt(usable.reduce((sum, value) => sum + value ** 2, 0));
  }

  return usable.reduce((sum, value) => sum + value, 0);
}
