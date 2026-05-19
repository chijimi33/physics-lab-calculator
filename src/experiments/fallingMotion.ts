import {
  calculateAccelerationByFiniteDifference,
  calculateVelocityByFiniteDifference,
  estimateGravityByLinearRegression,
  estimateGravityFromPoints,
  hasStrictlyIncreasingTimes,
  normalizeMotionPoints,
  validateStrictlyIncreasingTimes,
  type MotionPoint,
  type PositionUnit,
} from "../lib/physics/kinematics";
import { isLengthUnit } from "../lib/physics/units";

export type FallingMotionRawInput = {
  freeFall: string[][];
  resisted: string[][];
};

export type FallingMotionResult = {
  freeFallPoints: Array<MotionPoint | null>;
  freeFallVelocities: Array<number | null>;
  freeFallAccelerations: Array<number | null>;
  freeFallGravityValues: Array<number | null>;
  gravityAverage: number | null;
  gravityStandardError: number | null;
  gravityRegression: number | null;
  resistedPoints: Array<MotionPoint | null>;
  resistedVelocities: Array<number | null>;
  resistedAccelerations: Array<number | null>;
  maxResistanceVelocity: number | null;
  terminalVelocityEstimate: number | null;
  warnings: string[];
};

type ParsedRows = {
  rowPoints: Array<MotionPoint | null>;
  compactPoints: MotionPoint[];
  compactIndexes: number[];
  warnings: string[];
};

function parseUnit(value: string): PositionUnit | null {
  if (isLengthUnit(value)) {
    return value;
  }

  return null;
}

function parsePointRows(rows: string[][], hasNote: boolean): ParsedRows {
  const warnings: string[] = [];
  const rowPoints = rows.map((row) => {
    if ((row[0] ?? "").trim() === "" || (row[1] ?? "").trim() === "") {
      return null;
    }

    const t = Number(row[0]);
    const x = Number(row[1]);
    const unit = parseUnit(row[2] ?? "m");
    const note = hasNote ? row[3] ?? "" : undefined;

    if (!Number.isFinite(t) || !Number.isFinite(x) || unit === null) {
      return null;
    }

    return normalizeMotionPoints([{ t, x, unit, note }])[0] ?? null;
  });

  const compactIndexes: number[] = [];
  const compactPoints = rowPoints.filter((point, index): point is MotionPoint => {
    if (point !== null) {
      compactIndexes.push(index);
      return true;
    }

    return false;
  });

  for (let index = 1; index < compactIndexes.length; index += 1) {
    if (compactIndexes[index] - compactIndexes[index - 1] > 1) {
      warnings.push(
        "途中に空欄または無効な測定点があります。差分計算は有効な測定点だけを使っています。",
      );
      break;
    }
  }

  if (rows.some((row) => row[2] !== "" && parseUnit(row[2] ?? "m") === null)) {
    warnings.push("位置単位が m, cm, mm のいずれでもない行があります。");
  }

  return { rowPoints, compactPoints, compactIndexes, warnings };
}

function alignToRows<T>(
  rowCount: number,
  compactIndexes: number[],
  compactValues: T[],
): Array<T | null> {
  const aligned = Array<T | null>(rowCount).fill(null);
  compactIndexes.forEach((rowIndex, compactIndex) => {
    aligned[rowIndex] = compactValues[compactIndex] ?? null;
  });
  return aligned;
}

function terminalVelocityFromTail(velocities: Array<number | null>): number | null {
  const usable = velocities.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

  if (usable.length === 0) {
    return null;
  }

  const tail = usable.slice(-Math.min(3, usable.length));
  return tail.reduce((sum, value) => sum + value, 0) / tail.length;
}

function maxFinite(values: Array<number | null>): number | null {
  const usable = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  return usable.length === 0 ? null : Math.max(...usable);
}

function missingDataWarning(label: string, points: MotionPoint[]): string | null {
  return points.length < 2
    ? `${label} は2点以上の有効な t, x が必要です。`
    : null;
}

export function calculateFallingMotion(
  input: FallingMotionRawInput,
): FallingMotionResult {
  const freeFall = parsePointRows(input.freeFall, false);
  const resisted = parsePointRows(input.resisted, true);
  const freeFallTimesValid = hasStrictlyIncreasingTimes(freeFall.compactPoints);
  const resistedTimesValid = hasStrictlyIncreasingTimes(resisted.compactPoints);

  const compactFreeFallVelocities = freeFallTimesValid
    ? calculateVelocityByFiniteDifference(freeFall.compactPoints)
    : freeFall.compactPoints.map(() => null);
  const compactFreeFallAccelerations = freeFallTimesValid
    ? calculateAccelerationByFiniteDifference(
        freeFall.compactPoints.map((point) => point.t),
        compactFreeFallVelocities,
      )
    : freeFall.compactPoints.map(() => null);
  const gravity = estimateGravityFromPoints(freeFall.compactPoints);
  const regression = freeFallTimesValid
    ? estimateGravityByLinearRegression(freeFall.compactPoints)
    : { gravity: null };

  const compactResistedVelocities = resistedTimesValid
    ? calculateVelocityByFiniteDifference(resisted.compactPoints)
    : resisted.compactPoints.map(() => null);
  const compactResistedAccelerations = resistedTimesValid
    ? calculateAccelerationByFiniteDifference(
        resisted.compactPoints.map((point) => point.t),
        compactResistedVelocities,
      )
    : resisted.compactPoints.map(() => null);

  const freeFallVelocities = alignToRows(
    input.freeFall.length,
    freeFall.compactIndexes,
    compactFreeFallVelocities,
  );
  const freeFallAccelerations = alignToRows(
    input.freeFall.length,
    freeFall.compactIndexes,
    compactFreeFallAccelerations,
  );
  const freeFallGravityValues = alignToRows(
    input.freeFall.length,
    freeFall.compactIndexes,
    gravity.values,
  );
  const resistedVelocities = alignToRows(
    input.resisted.length,
    resisted.compactIndexes,
    compactResistedVelocities,
  );
  const resistedAccelerations = alignToRows(
    input.resisted.length,
    resisted.compactIndexes,
    compactResistedAccelerations,
  );

  const warnings = [
    missingDataWarning("自由落下データ", freeFall.compactPoints),
    missingDataWarning("抵抗あり落下データ", resisted.compactPoints),
    ...freeFall.warnings.map((warning) => `自由落下: ${warning}`),
    ...resisted.warnings.map((warning) => `抵抗あり: ${warning}`),
    ...validateStrictlyIncreasingTimes(freeFall.compactPoints).map(
      (warning) => `自由落下: ${warning}`,
    ),
    ...validateStrictlyIncreasingTimes(resisted.compactPoints).map(
      (warning) => `抵抗あり: ${warning}`,
    ),
  ].filter((warning): warning is string => warning !== null);

  return {
    freeFallPoints: freeFall.rowPoints,
    freeFallVelocities,
    freeFallAccelerations,
    freeFallGravityValues,
    gravityAverage: gravity.average,
    gravityStandardError: gravity.standardError,
    gravityRegression: regression.gravity,
    resistedPoints: resisted.rowPoints,
    resistedVelocities,
    resistedAccelerations,
    maxResistanceVelocity: maxFinite(resistedVelocities),
    terminalVelocityEstimate: terminalVelocityFromTail(resistedVelocities),
    warnings,
  };
}
