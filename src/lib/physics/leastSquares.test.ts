import { describe, expect, it } from "vitest";
import {
  linearLeastSquares,
  linearRegressionThroughOrigin,
  rSquared,
  standardError,
} from "./leastSquares";

describe("linearLeastSquares", () => {
  it("returns slope, intercept, predictions, residuals, and squared residuals", () => {
    const result = linearLeastSquares([
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ]);

    expect(result?.slope).toBeCloseTo(2);
    expect(result?.intercept).toBeCloseTo(1);
    expect(result?.predictedValues).toEqual([3, 5, 7]);
    expect(result?.residuals).toEqual([0, 0, 0]);
    expect(result?.sumOfSquaredResiduals).toBeCloseTo(0);
    expect(result?.rSquared).toBeCloseTo(1);
    expect(result?.standardError).toBeCloseTo(0);
  });

  it("calculates regression through the origin", () => {
    const result = linearRegressionThroughOrigin([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ]);

    expect(result?.slope).toBeCloseTo(2);
    expect(result?.intercept).toBe(0);
    expect(result?.sumOfSquaredResiduals).toBeCloseTo(0);
  });

  it("calculates r squared and standard error from residuals", () => {
    expect(rSquared([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    expect(standardError([1, -1, 1, -1], 2)).toBeCloseTo(Math.sqrt(2));
  });
});
