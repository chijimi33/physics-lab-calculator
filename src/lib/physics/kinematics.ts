import { average, standardErrorOfMean } from "./statistics";

export type PositionUnit = "m" | "cm";

export type MotionPointInput = {
  t: number;
  x: number;
  unit: PositionUnit;
  note?: string;
};

export type MotionPoint = {
  t: number;
  x: number;
  unit: PositionUnit;
  xMeters: number;
  note?: string;
};

export type GravityEstimate = {
  values: Array<number | null>;
  average: number | null;
  standardError: number | null;
};

export type RegressionGravityEstimate = {
  slope: number | null;
  gravity: number | null;
  predictedX: Array<number | null>;
};

export function convertPositionToMeters(value: number, unit: PositionUnit): number {
  return unit === "cm" ? value / 100 : value;
}

export function normalizeMotionPoints(points: MotionPointInput[]): MotionPoint[] {
  return points
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.x))
    .map((point) => ({
      ...point,
      xMeters: convertPositionToMeters(point.x, point.unit),
    }));
}

function differenceAt(values: number[], times: number[], index: number): number | null {
  if (values.length < 2 || times.length < 2) {
    return null;
  }

  const previousIndex = index === 0 ? 0 : index - 1;
  const nextIndex = index === values.length - 1 ? values.length - 1 : index + 1;
  const startIndex = index === 0 ? 0 : previousIndex;
  const endIndex = index === values.length - 1 ? values.length - 1 : nextIndex;
  const dt = times[endIndex] - times[startIndex];

  if (dt === 0 || !Number.isFinite(dt)) {
    return null;
  }

  if (!Number.isFinite(values[endIndex]) || !Number.isFinite(values[startIndex])) {
    return null;
  }

  return (values[endIndex] - values[startIndex]) / dt;
}

export function calculateVelocityByFiniteDifference(
  points: MotionPoint[],
): Array<number | null> {
  const times = points.map((point) => point.t);
  const positions = points.map((point) => point.xMeters);
  return points.map((_point, index) => differenceAt(positions, times, index));
}

export function calculateAccelerationByFiniteDifference(
  times: number[],
  velocities: Array<number | null>,
): Array<number | null> {
  const usableVelocity = velocities.map((value) =>
    value === null ? Number.NaN : value,
  );

  return velocities.map((_velocity, index) => {
    return differenceAt(usableVelocity, times, index);
  });
}

export function estimateGravityFromPoints(points: MotionPoint[]): GravityEstimate {
  const values = points.map((point) => {
    if (point.t === 0) {
      return null;
    }

    return (2 * point.xMeters) / point.t ** 2;
  });
  const usable = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

  return {
    values,
    average: average(usable),
    standardError: standardErrorOfMean(usable),
  };
}

export function estimateGravityByLinearRegression(
  points: MotionPoint[],
): RegressionGravityEstimate {
  const usable = points.filter(
    (point) => point.t !== 0 && Number.isFinite(point.t) && Number.isFinite(point.xMeters),
  );
  const sumT4 = usable.reduce((sum, point) => sum + point.t ** 4, 0);

  if (usable.length < 2 || sumT4 === 0) {
    return {
      slope: null,
      gravity: null,
      predictedX: points.map(() => null),
    };
  }

  const sumT2X = usable.reduce((sum, point) => sum + point.t ** 2 * point.xMeters, 0);
  const slope = sumT2X / sumT4;

  return {
    slope,
    gravity: 2 * slope,
    predictedX: points.map((point) => slope * point.t ** 2),
  };
}

export function validateStrictlyIncreasingTimes(points: MotionPoint[]): string[] {
  const warnings: string[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const dt = points[index].t - points[index - 1].t;
    if (dt < 0) {
      warnings.push("時刻 t が昇順ではありません。");
      break;
    }
    if (dt === 0) {
      warnings.push("同じ時刻の測定点があり、Δt = 0 になります。");
      break;
    }
  }

  return warnings;
}

export function hasStrictlyIncreasingTimes(points: MotionPoint[]): boolean {
  return validateStrictlyIncreasingTimes(points).length === 0;
}
