export type MeasurementValue = {
  raw: string;
  value: number;
  significantFigures: number | null;
  decimalPlaces: number | null;
};

function normalizeRaw(raw: string): string {
  return raw.trim();
}

export function parseMeasurementValue(raw: string): MeasurementValue | null {
  const normalized = normalizeRaw(raw);
  if (normalized === "") {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return {
    raw: normalized,
    value,
    significantFigures: countSignificantFigures(normalized),
    decimalPlaces: countDecimalPlaces(normalized),
  };
}

export function countDecimalPlaces(raw: string): number | null {
  const normalized = normalizeRaw(raw).toLowerCase();
  if (normalized === "") {
    return null;
  }

  const [mantissa, exponentPart] = normalized.split("e");
  const exponent = exponentPart === undefined ? 0 : Number(exponentPart);
  if (!Number.isFinite(exponent)) {
    return null;
  }

  const decimalDigits = mantissa.includes(".")
    ? mantissa.split(".")[1].length
    : 0;

  return Math.max(decimalDigits - exponent, 0);
}

export function countSignificantFigures(raw: string): number | null {
  const normalized = normalizeRaw(raw).toLowerCase();
  if (normalized === "") {
    return null;
  }

  const mantissa = normalized.split("e")[0].replace(/^[+-]/, "");
  const hasDecimal = mantissa.includes(".");
  const digits = mantissa.replace(".", "");

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  if (Number(digits) === 0) {
    return hasDecimal ? digits.length : 1;
  }

  if (hasDecimal) {
    return digits.replace(/^0+/, "").length;
  }

  return digits.replace(/^0+/, "").replace(/0+$/, "").length;
}

export function roundToSignificantFigures(value: number, digits: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return value;
  }

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const factor = 10 ** (digits - exponent - 1);
  return Math.round(value * factor) / factor;
}

function toFixedRounded(value: number, decimalPlaces: number): string {
  const factor = 10 ** decimalPlaces;
  const rounded = Math.round((value + Number.EPSILON * Math.sign(value)) * factor) / factor;
  return rounded.toFixed(decimalPlaces);
}

export function formatToSignificantFigures(value: number | null, digits = 3): string {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  if (value === 0) {
    return "0." + "0".repeat(Math.max(digits - 1, 0));
  }

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.max(digits - exponent - 1, 0);
  return roundToSignificantFigures(value, digits).toFixed(decimals);
}

export function roundForAddition(values: MeasurementValue[], result: number): string {
  const decimalPlaces = values
    .map((value) => value.decimalPlaces)
    .filter((value): value is number => value !== null);

  if (decimalPlaces.length === 0) {
    return formatToSignificantFigures(result, 3);
  }

  return toFixedRounded(result, Math.min(...decimalPlaces));
}

export function roundForMultiplication(
  values: MeasurementValue[],
  result: number,
): string {
  return roundForMultiplicationFinal(values, result);
}

export function getMinimumSignificantFigures(
  values: MeasurementValue[],
): number | null {
  const significantFigures = values
    .map((value) => value.significantFigures)
    .filter((value): value is number => value !== null);

  if (significantFigures.length === 0) {
    return null;
  }

  return Math.min(...significantFigures);
}

export function getIntermediateSignificantFigures(
  values: MeasurementValue[],
): number | null {
  const minimum = getMinimumSignificantFigures(values);
  return minimum === null ? null : minimum + 1;
}

export function roundForMultiplicationIntermediate(
  values: MeasurementValue[],
  result: number,
): string {
  const digits = getIntermediateSignificantFigures(values);

  if (digits === null) {
    return formatToSignificantFigures(result, 3);
  }

  return formatToSignificantFigures(result, digits);
}

export function roundForMultiplicationFinal(
  values: MeasurementValue[],
  result: number,
): string {
  const digits = getMinimumSignificantFigures(values);

  if (digits === null) {
    return formatToSignificantFigures(result, 3);
  }

  return formatToSignificantFigures(result, digits);
}

export function roundByError(
  value: number | null,
  error: number | null,
  errorSignificantFigures = 1,
  valueSignificantFigures = 3,
): { value: string; error: string; combined: string; decimalPlaces: number | null } {
  if (
    value === null ||
    error === null ||
    !Number.isFinite(value) ||
    !Number.isFinite(error)
  ) {
    return { value: "-", error: "-", combined: "-", decimalPlaces: null };
  }

  if (error === 0) {
    const formattedValue = formatToSignificantFigures(
      value,
      valueSignificantFigures,
    );
    return {
      value: formattedValue,
      error: "0",
      combined: `${formattedValue} +/- 0`,
      decimalPlaces: 0,
    };
  }

  const errorExponent = Math.floor(Math.log10(Math.abs(error)));
  const decimalPlaces = Math.max(
    errorSignificantFigures - errorExponent - 1,
    0,
  );
  const roundedError = toFixedRounded(error, decimalPlaces);
  const roundedValue = toFixedRounded(value, decimalPlaces);

  return {
    value: roundedValue,
    error: roundedError,
    combined: `${roundedValue} +/- ${roundedError}`,
    decimalPlaces,
  };
}
