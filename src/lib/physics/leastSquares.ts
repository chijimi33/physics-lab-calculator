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

  return {
    slope,
    intercept,
    predictedValues,
    residuals: residualValues,
    sumOfSquaredResiduals: squaredResiduals,
  };
}
