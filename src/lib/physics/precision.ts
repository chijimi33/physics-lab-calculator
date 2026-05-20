import {
  formatToSignificantFigures,
  parseMeasurementValue,
  roundToSignificantFigures,
  type MeasurementValue,
} from "./significantFigures";
import { withUnit } from "./units";

export type PrecisionMode = "guarded" | "full";

export type PrecisionCalculationKind =
  | "general"
  | "statistics"
  | "regression"
  | "errorPropagation";

export type PrecisionSource =
  | "measurement"
  | "calculated"
  | "error-based"
  | "cancellation-detected"
  | "manual";

export type PrecisionSettings = {
  precisionMode: PrecisionMode;
  guardDigits: number;
  showRawValue: boolean;
  showWorkingValue: boolean;
  showHiddenDigits: boolean;
  showPrecisionWarnings: boolean;
};

export type CalculatedValue = {
  rawValue: number;
  workingValue: number;
  displayValue: string;
  unit?: string;
  significantDigits?: number;
  decimalPlaces?: number;
  guardDigits?: number;
  hiddenDigits?: number;
  precisionSource?: PrecisionSource;
  warnings?: string[];
  roundingReason?: string;
};

export type PrecisionTrackedValue = CalculatedValue & {
  guardDigits: number;
  precisionSource: PrecisionSource;
  warnings: string[];
};

export const DEFAULT_PRECISION_SETTINGS: PrecisionSettings = {
  precisionMode: "guarded",
  guardDigits: 1,
  showRawValue: false,
  showWorkingValue: true,
  showHiddenDigits: true,
  showPrecisionWarnings: true,
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

function hasTrailingZero(raw: string): boolean {
  const mantissa = raw.trim().toLowerCase().split("e")[0] ?? "";
  return mantissa.includes(".") && /0+$/.test(mantissa);
}

function measurementPrecision(raw: string): {
  measurement: MeasurementValue;
  trailingZero: boolean;
} | null {
  const measurement = parseMeasurementValue(raw);

  if (measurement === null) {
    return null;
  }

  return {
    measurement,
    trailingZero: hasTrailingZero(raw),
  };
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

function formatToDecimalPlaces(value: number, decimalPlaces: number): string {
  const factor = 10 ** decimalPlaces;
  const rounded =
    Math.round((value + Number.EPSILON * Math.sign(value)) * factor) / factor;

  return rounded.toFixed(decimalPlaces);
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
  decimalPlaces,
  precisionSource = "calculated",
  warnings = [],
}: {
  rawValue: number;
  significantDigits: number;
  guardDigits?: number;
  precisionMode?: PrecisionMode;
  unit?: string;
  displayValue?: string;
  decimalPlaces?: number;
  precisionSource?: PrecisionSource;
  warnings?: string[];
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
    decimalPlaces,
    guardDigits: safeGuardDigits,
    hiddenDigits: getHiddenDigits(rawValue, formattedDisplayValue),
    precisionSource,
    warnings,
    roundingReason:
      precisionMode === "full"
        ? `完全精度を保持し、表示時のみ有効数字${safeSignificantDigits}桁で丸め`
        : `有効数字${safeSignificantDigits}桁 + guard digit ${safeGuardDigits}桁`,
  };
}

export function createMeasurementTrackedValue(
  raw: string,
  options: {
    guardDigits?: number;
    unit?: string;
  } = {},
): PrecisionTrackedValue | null {
  const parsed = measurementPrecision(raw);

  if (parsed === null) {
    return null;
  }

  const significantDigits = parsed.measurement.significantFigures ?? 3;
  const decimalPlaces = parsed.measurement.decimalPlaces ?? undefined;
  const calculated = createCalculatedValue({
    rawValue: parsed.measurement.value,
    significantDigits,
    guardDigits: options.guardDigits,
    unit: options.unit,
    decimalPlaces,
    precisionSource: "measurement",
    warnings: parsed.trailingZero
      ? ["末尾の0を測定値の有効桁として保持しています。"]
      : [],
  });

  return {
    ...calculated,
    guardDigits: calculated.guardDigits ?? DEFAULT_PRECISION_SETTINGS.guardDigits,
    precisionSource: "measurement",
    warnings: calculated.warnings ?? [],
  };
}

export function estimatePrecisionFromMeasurements(
  rawValues: string[],
): {
  significantDigits: number;
  decimalPlaces?: number;
  warnings: string[];
} {
  const measurements = rawValues
    .map((raw) => measurementPrecision(raw))
    .filter((value): value is NonNullable<typeof value> => value !== null);
  const significantDigits = measurements
    .map(({ measurement }) => measurement.significantFigures)
    .filter((digits): digits is number => digits !== null);
  const decimalPlaces = measurements
    .map(({ measurement }) => measurement.decimalPlaces)
    .filter((places): places is number => places !== null);
  const trailingZeroCount = measurements.filter(
    ({ trailingZero }) => trailingZero,
  ).length;

  return {
    significantDigits:
      significantDigits.length > 0 ? Math.min(...significantDigits) : 3,
    decimalPlaces:
      decimalPlaces.length > 0 ? Math.min(...decimalPlaces) : undefined,
    warnings:
      trailingZeroCount > 0
        ? ["末尾の0を含む測定値は、有効桁として扱っています。"]
        : [],
  };
}

export function trackMultiplicationOrDivision({
  rawValue,
  inputs,
  guardDigits = DEFAULT_PRECISION_SETTINGS.guardDigits,
  unit,
}: {
  rawValue: number;
  inputs: PrecisionTrackedValue[];
  guardDigits?: number;
  unit?: string;
}): PrecisionTrackedValue {
  const significantDigits = Math.min(
    ...inputs
      .map((input) => input.significantDigits)
      .filter((digits): digits is number => digits !== undefined),
  );
  const safeSignificantDigits = Number.isFinite(significantDigits)
    ? significantDigits
    : 3;
  const calculated = createCalculatedValue({
    rawValue,
    significantDigits: safeSignificantDigits,
    guardDigits,
    unit,
    precisionSource: "calculated",
  });

  return {
    ...calculated,
    guardDigits: calculated.guardDigits ?? normalizeGuardDigits(guardDigits),
    precisionSource: "calculated",
    warnings: calculated.warnings ?? [],
    roundingReason: `乗除算: 最小有効数字${safeSignificantDigits}桁 + guard digit ${normalizeGuardDigits(guardDigits)}桁`,
  };
}

export function trackAdditionOrSubtraction({
  rawValue,
  inputs,
  guardDigits = DEFAULT_PRECISION_SETTINGS.guardDigits,
  unit,
}: {
  rawValue: number;
  inputs: PrecisionTrackedValue[];
  guardDigits?: number;
  unit?: string;
}): PrecisionTrackedValue {
  const decimalPlaces = Math.min(
    ...inputs
      .map((input) => input.decimalPlaces)
      .filter((places): places is number => places !== undefined),
  );
  const safeDecimalPlaces = Number.isFinite(decimalPlaces) ? decimalPlaces : 0;
  const displayValue = formatToDecimalPlaces(rawValue, safeDecimalPlaces);
  const largestInputMagnitude = Math.max(
    ...inputs.map((input) => Math.abs(input.rawValue)),
  );
  const cancellationDetected =
    largestInputMagnitude > 0 &&
    Math.abs(rawValue) / largestInputMagnitude < 0.01 &&
    inputs.length >= 2;
  const warnings = cancellationDetected
    ? [
        "近い値どうしの減算により桁落ちが発生した可能性があります。丸めは実験書の指示と照合してください。",
      ]
    : [];
  const significantDigits = cancellationDetected
    ? 1
    : Math.max(displayValue.replace(/[-.]/g, "").replace(/^0+/, "").length, 1);
  const calculated = createCalculatedValue({
    rawValue,
    significantDigits,
    guardDigits,
    unit,
    displayValue,
    decimalPlaces: safeDecimalPlaces,
    precisionSource: cancellationDetected
      ? "cancellation-detected"
      : "calculated",
    warnings,
  });

  return {
    ...calculated,
    guardDigits: calculated.guardDigits ?? normalizeGuardDigits(guardDigits),
    precisionSource: cancellationDetected
      ? "cancellation-detected"
      : "calculated",
    warnings,
    roundingReason: cancellationDetected
      ? `加減算: 小数${safeDecimalPlaces}桁基準。桁落ちの可能性を検出`
      : `加減算: 入力値の最も粗い小数${safeDecimalPlaces}桁に合わせて丸め`,
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

export function shouldShowGlobalSignificantDigits(
  precisionMode: PrecisionMode,
): boolean {
  return precisionMode === "full";
}

export function formatCalculatedValue(
  calculatedValue: CalculatedValue,
): string {
  return calculatedValue.displayValue;
}
