export type LeastSquaresPoint = {
  x: number;
  y: number;
};

export type LinearLeastSquaresResult = {
  slope: number;
  intercept: number;
  predictedValues: number[];
  residuals: number[];
  sumOfSquaredResiduals: number;
  rSquared: number | null;
  standardError: number | null;
};

export function linearLeastSquares(
  points: LeastSquaresPoint[],
): LinearLeastSquaresResult | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  const n = usable.length;

  if (n < 2) {
    return null;
  }

  const sumX = usable.reduce((sum, point) => sum + point.x, 0);
  const sumY = usable.reduce((sum, point) => sum + point.y, 0);
  const sumXY = usable.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = usable.reduce((sum, point) => sum + point.x ** 2, 0);
  const denominator = n * sumX2 - sumX ** 2;

  if (denominator === 0) {
    return null;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumX2 * sumY - sumX * sumXY) / denominator;
  const predictedValues = usable.map((point) => slope * point.x + intercept);
  const residualValues = usable.map((point, index) => point.y - predictedValues[index]);
  const squaredResiduals = residualValues.reduce(
    (sum, residual) => sum + residual ** 2,
    0,
  );
  const meanY = sumY / n;
  const totalSquares = usable.reduce(
    (sum, point) => sum + (point.y - meanY) ** 2,
    0,
  );

  return {
    slope,
    intercept,
    predictedValues,
    residuals: residualValues,
    sumOfSquaredResiduals: squaredResiduals,
    rSquared: totalSquares === 0 ? null : 1 - squaredResiduals / totalSquares,
    standardError: n > 2 ? Math.sqrt(squaredResiduals / (n - 2)) : null,
  };
}

export const linearRegression = linearLeastSquares;

export function linearRegressionThroughOrigin(
  points: LeastSquaresPoint[],
): LinearLeastSquaresResult | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  );

  if (usable.length < 2) {
    return null;
  }

  const sumXY = usable.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = usable.reduce((sum, point) => sum + point.x ** 2, 0);
  if (sumX2 === 0) {
    return null;
  }

  const slope = sumXY / sumX2;
  const predictedValues = usable.map((point) => slope * point.x);
  const residualValues = usable.map((point, index) => point.y - predictedValues[index]);
  const sumOfSquaredResiduals = residualValues.reduce(
    (sum, residual) => sum + residual ** 2,
    0,
  );
  const meanY = usable.reduce((sum, point) => sum + point.y, 0) / usable.length;
  const totalSquares = usable.reduce(
    (sum, point) => sum + (point.y - meanY) ** 2,
    0,
  );

  return {
    slope,
    intercept: 0,
    predictedValues,
    residuals: residualValues,
    sumOfSquaredResiduals,
    rSquared: totalSquares === 0 ? null : 1 - sumOfSquaredResiduals / totalSquares,
    standardError:
      usable.length > 1
        ? Math.sqrt(sumOfSquaredResiduals / (usable.length - 1))
        : null,
  };
}

export function rSquared(values: number[], predictedValues: number[]): number | null {
  const pairs = values.flatMap((value, index) =>
    Number.isFinite(value) && Number.isFinite(predictedValues[index])
      ? [{ value, predicted: predictedValues[index] }]
      : [],
  );

  if (pairs.length === 0) {
    return null;
  }

  const mean = pairs.reduce((sum, pair) => sum + pair.value, 0) / pairs.length;
  const totalSquares = pairs.reduce((sum, pair) => sum + (pair.value - mean) ** 2, 0);
  if (totalSquares === 0) {
    return null;
  }

  const residualSquares = pairs.reduce(
    (sum, pair) => sum + (pair.value - pair.predicted) ** 2,
    0,
  );
  return 1 - residualSquares / totalSquares;
}

export function standardError(residualValues: number[], parameterCount = 2): number | null {
  const usable = residualValues.filter(Number.isFinite);
  const degreesOfFreedom = usable.length - parameterCount;
  if (degreesOfFreedom <= 0) {
    return null;
  }

  return Math.sqrt(
    usable.reduce((sum, residual) => sum + residual ** 2, 0) / degreesOfFreedom,
  );
}
