import { describe, expect, it } from "vitest";
import {
  average,
  residuals,
  sampleStandardDeviation,
  standardErrorOfMean,
} from "./statistics";

describe("statistics", () => {
  it("average ignores non-finite values", () => {
    expect(average([1, 2, 3, Number.NaN])).toBe(2);
  });

  it("residuals are measured from the mean", () => {
    expect(residuals([1, 2, 3])).toEqual([-1, 0, 1]);
  });

  it("sampleStandardDeviation uses n - 1", () => {
    expect(sampleStandardDeviation([1, 2, 3])).toBeCloseTo(1);
  });

  it("standardErrorOfMean is sigma divided by sqrt(n)", () => {
    expect(standardErrorOfMean([1, 2, 3])).toBeCloseTo(1 / Math.sqrt(3));
  });
});
