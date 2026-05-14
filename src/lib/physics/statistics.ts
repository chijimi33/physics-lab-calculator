export function finiteValues(values: number[]): number[] {
  return values.filter(Number.isFinite);
}

export function average(values: number[]): number | null {
  const usable = finiteValues(values);
  if (usable.length === 0) {
    return null;
  }

  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

export function residuals(values: number[], mean = average(values)): number[] {
  if (mean === null) {
    return [];
  }

  return finiteValues(values).map((value) => value - mean);
}

export function sumOfSquaredResiduals(values: number[]): number | null {
  const mean = average(values);
  if (mean === null) {
    return null;
  }

  return residuals(values, mean).reduce((sum, residual) => sum + residual ** 2, 0);
}

export function sampleStandardDeviation(values: number[]): number | null {
  const usable = finiteValues(values);
  if (usable.length < 2) {
    return null;
  }

  const squaredResiduals = sumOfSquaredResiduals(usable);
  if (squaredResiduals === null) {
    return null;
  }

  return Math.sqrt(squaredResiduals / (usable.length - 1));
}

export function standardErrorOfMean(values: number[]): number | null {
  const usable = finiteValues(values);
  const deviation = sampleStandardDeviation(usable);
  if (deviation === null) {
    return null;
  }

  return deviation / Math.sqrt(usable.length);
}
