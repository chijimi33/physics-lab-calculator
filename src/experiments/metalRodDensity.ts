import {
  parseMeasurementValue,
  type MeasurementValue,
} from "../lib/physics/significantFigures";
import {
  average,
  sampleStandardDeviation,
  standardErrorOfMean,
} from "../lib/physics/statistics";
import { relativeErrorPropagation } from "../lib/physics/errorPropagation";

export type MetalRodDensityRawInput = {
  diameters: string[];
  lengths: string[];
  masses: string[];
};

export type MetalRodDensityResult = {
  dValues: MeasurementValue[];
  lValues: MeasurementValue[];
  mValues: MeasurementValue[];
  aValues: Array<number | null>;
  dAverage: number | null;
  dResiduals: Array<number | null>;
  sigmaD: number | null;
  mD: number | null;
  aAverage: number | null;
  aResiduals: Array<number | null>;
  sigmaA: number | null;
  mA: number | null;
  rho: number | null;
  relativeError: number | null;
  mRho: number | null;
  warnings: string[];
};

function compactMeasurements(values: string[]): MeasurementValue[] {
  return values
    .map(parseMeasurementValue)
    .filter((value): value is MeasurementValue => value !== null);
}

function warnIfIncomplete(
  label: string,
  expected: number,
  actual: number,
): string | null {
  return actual < expected
    ? `${label} は ${expected} 個中 ${actual} 個だけ入力されています。`
    : null;
}

function finiteNumbers(values: Array<number | null>): number[] {
  return values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
}

function alignedResiduals(
  values: Array<number | null>,
  mean: number | null,
): Array<number | null> {
  if (mean === null) {
    return values.map(() => null);
  }

  return values.map((value) =>
    value !== null && Number.isFinite(value) ? value - mean : null,
  );
}

export function calculateMetalRodDensity(
  input: MetalRodDensityRawInput,
): MetalRodDensityResult {
  const dValues = compactMeasurements(input.diameters);
  const lValues = compactMeasurements(input.lengths);
  const mValues = compactMeasurements(input.masses);

  const dRowValues = input.diameters.map(
    (raw) => parseMeasurementValue(raw)?.value ?? null,
  );
  const dNumbers = finiteNumbers(dRowValues);

  const aValues = input.lengths.map((lengthRaw, index) => {
    const length = parseMeasurementValue(lengthRaw);
    const mass = parseMeasurementValue(input.masses[index] ?? "");

    if (length === null || mass === null || length.value === 0) {
      return null;
    }

    return mass.value / length.value;
  });
  const aNumbers = finiteNumbers(aValues);

  const dAverage = average(dNumbers);
  const dResiduals = alignedResiduals(dRowValues, dAverage);
  const sigmaD = sampleStandardDeviation(dNumbers);
  const mD = standardErrorOfMean(dNumbers);

  const aAverage = average(aNumbers);
  const aResiduals = alignedResiduals(aValues, aAverage);
  const sigmaA = sampleStandardDeviation(aNumbers);
  const mA = standardErrorOfMean(aNumbers);

  const rho =
    dAverage !== null && dAverage !== 0 && aAverage !== null
      ? (4 * aAverage) / (Math.PI * dAverage ** 2)
      : null;

  const relativeError = relativeErrorPropagation(
    [
      { value: aAverage, error: mA, power: 1 },
      { value: dAverage, error: mD, power: -2 },
    ],
    "quadrature",
  );
  const mRho =
    rho !== null && relativeError !== null ? Math.abs(rho) * relativeError : null;

  const warnings = [
    warnIfIncomplete("直径 D", 15, dValues.length),
    warnIfIncomplete("長さ L", 5, lValues.length),
    warnIfIncomplete("質量 M", 5, mValues.length),
  ].filter((warning): warning is string => warning !== null);

  return {
    dValues,
    lValues,
    mValues,
    aValues,
    dAverage,
    dResiduals,
    sigmaD,
    mD,
    aAverage,
    aResiduals,
    sigmaA,
    mA,
    rho,
    relativeError,
    mRho,
    warnings,
  };
}
