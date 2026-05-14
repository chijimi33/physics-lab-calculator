import { describe, expect, it } from "vitest";
import { linearLeastSquares } from "./leastSquares";

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
  });
});
