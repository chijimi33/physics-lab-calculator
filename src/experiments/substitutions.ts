export type SubstitutionEntries = Record<string, string | null | undefined>;

export function latexNumber(
  value: number | null | undefined,
  digits = 8,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return Number(value.toPrecision(digits)).toString();
}

export function isFiniteNumber(
  value: number | null | undefined,
): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function countFinite(values: Array<number | null>): number {
  return values.filter(isFiniteNumber).length;
}

export function sumFinite(values: Array<number | null>): number | null {
  const usable = values.filter(isFiniteNumber);

  return usable.length === 0
    ? null
    : usable.reduce((sum, value) => sum + value, 0);
}

export function allFinite(
  values: Array<number | null | undefined>,
): boolean {
  return values.every(isFiniteNumber);
}

export function compactSubstitutions(
  entries: SubstitutionEntries,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

