import {
  formatToSignificantFigures,
  roundToSignificantFigures,
} from "./significantFigures";
import { withUnit } from "./units";

export type PrecisionMode = "guarded" | "full";

export type PrecisionCalculationKind =
  | "general"
  | "statistics"
  | "regression"
  | "errorPropagation";

export type PrecisionSettings = {
  precisionMode: PrecisionMode;
  guardDigits: number;
  showRawValue: boolean;
  showWorkingValue: boolean;
  showHiddenDigits: boolean;
};

export type CalculatedValue = {
  rawValue: number;
  workingValue: number;
  displayValue: string;
  unit?: string;
  significantDigits?: number;
  guardDigits?: number;
  hiddenDigits?: number;
  roundingReason?: string;
};

export const DEFAULT_PRECISION_SETTINGS: PrecisionSettings = {
  precisionMode: "guarded",
  guardDigits: 1,
  showRawValue: false,
  showWorkingValue: true,
  showHiddenDigits: true,
};

function normalizeGuardDigits(guardDigits: number): number {
  if (!Number.isFinite(guardDigits)) {
    return DEFAULT_PRECISION_SETTINGS.guardDigits;
  }

  return Math.max(Math.trunc(guardDigits), 0);
}

function normalizeSignificantDigits(significantDigits: number): number {
  if (!Number.isFinite(significantDigits)) {
    return 3;
  }

  return Math.max(Math.trunc(significantDigits), 1);
}

function countDisplayedDecimalPlaces(value: string): number {
  const numericPart = value.split(/\s+/)[0]?.toLowerCase() ?? "";
  const [mantissa, exponentPart] = numericPart.split("e");
  const exponent = exponentPart === undefined ? 0 : Number(exponentPart);

  if (!Number.isFinite(exponent) || !mantissa.includes(".")) {
    return Math.max(-exponent, 0);
  }

  return Math.max(mantissa.split(".")[1].length - exponent, 0);
}

export function roundToGuardDigits(
  rawValue: number,
  significantDigits: number,
  guardDigits: number,
): number {
  const safeSignificantDigits = normalizeSignificantDigits(significantDigits);
  const safeGuardDigits = normalizeGuardDigits(guardDigits);

  return roundToSignificantFigures(
    rawValue,
    safeSignificantDigits + safeGuardDigits,
  );
}

export function getHiddenDigits(
  rawValue: number,
  visibleValue: string,
): number | undefined {
  if (!Number.isFinite(rawValue)) {
    return undefined;
  }

  const decimalPlaces = countDisplayedDecimalPlaces(visibleValue);
  const extraPlaces = decimalPlaces + 12;
  const fixedRaw = Math.abs(rawValue).toFixed(extraPlaces);
  const fractional = fixedRaw.split(".")[1] ?? "";
  const hidden = fractional.slice(decimalPlaces).replace(/0+$/, "");

  if (hidden === "") {
    return undefined;
  }

  return Number(hidden);
}

export function createCalculatedValue({
  rawValue,
  significantDigits,
  guardDigits = DEFAULT_PRECISION_SETTINGS.guardDigits,
  precisionMode = DEFAULT_PRECISION_SETTINGS.precisionMode,
  unit,
  displayValue,
}: {
  rawValue: number;
  significantDigits: number;
  guardDigits?: number;
  precisionMode?: PrecisionMode;
  unit?: string;
  displayValue?: string;
}): CalculatedValue {
  const safeSignificantDigits = normalizeSignificantDigits(significantDigits);
  const safeGuardDigits = normalizeGuardDigits(guardDigits);
  const workingValue =
    precisionMode === "full"
      ? rawValue
      : roundToGuardDigits(rawValue, safeSignificantDigits, safeGuardDigits);
  const formattedDisplayValue =
    displayValue ?? formatToSignificantFigures(rawValue, safeSignificantDigits);

  return {
    rawValue,
    workingValue,
    displayValue: withUnit(formattedDisplayValue, unit),
    unit,
    significantDigits: safeSignificantDigits,
    guardDigits: safeGuardDigits,
    hiddenDigits: getHiddenDigits(rawValue, formattedDisplayValue),
    roundingReason:
      precisionMode === "full"
        ? `完全精度を保持し、表示時のみ有効数字${safeSignificantDigits}桁で丸め`
        : `有効数字${safeSignificantDigits}桁 + guard digit ${safeGuardDigits}桁`,
  };
}

export function applyPrecisionMode(
  calculatedValue: CalculatedValue,
  settings: Pick<PrecisionSettings, "precisionMode">,
  calculationKind: PrecisionCalculationKind = "general",
): number {
  if (
    calculationKind === "statistics" ||
    calculationKind === "regression" ||
    calculationKind === "errorPropagation"
  ) {
    return calculatedValue.rawValue;
  }

  return settings.precisionMode === "full"
    ? calculatedValue.rawValue
    : calculatedValue.workingValue;
}

export function formatCalculatedValue(
  calculatedValue: CalculatedValue,
): string {
  return calculatedValue.displayValue;
}

