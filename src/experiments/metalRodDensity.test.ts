import { describe, expect, it } from "vitest";
import { calculateMetalRodDensity } from "./metalRodDensity";

describe("calculateMetalRodDensity", () => {
  it("calculates averages, errors, density, and warnings", () => {
    const result = calculateMetalRodDensity({
      diameters: [
        "1.000",
        "1.010",
        "0.990",
        "1.000",
        "1.005",
        "0.995",
        "1.002",
        "0.998",
        "1.001",
        "0.999",
        "1.004",
        "0.996",
        "1.003",
        "0.997",
        "1.000",
      ],
      lengths: ["10.00", "10.10", "9.90", "10.05", "9.95"],
      masses: ["78.5", "79.3", "77.7", "78.9", "78.1"],
      referenceDensity: "copper",
    });

    expect(result.dAverage).toBeCloseTo(1);
    expect(result.aValues).toHaveLength(5);
    expect(result.aAverage).toBeCloseTo(7.85, 2);
    expect(result.rho).toBeCloseTo((4 * result.aAverage!) / Math.PI, 6);
    expect(result.mRho).toBeGreaterThan(0);
    expect(result.referenceDensity).toBe(8.6);
    expect(result.referenceDifference).toBeCloseTo(result.rho! - 8.6);
    expect(result.referencePercentDifference).toBeCloseTo(
      Math.abs((result.rho! - 8.6) / 8.6),
    );
    expect(result.warnings).toEqual([]);
  });

  it("warns when required measurement counts are incomplete", () => {
    const result = calculateMetalRodDensity({
      diameters: ["1.0"],
      lengths: ["10.0"],
      masses: ["78.0"],
    });

    expect(result.warnings.length).toBe(3);
  });

  it("keeps a residuals aligned with original sample rows when a row is blank", () => {
    const result = calculateMetalRodDensity({
      diameters: Array(15).fill("1.000"),
      lengths: ["10.0", "", "20.0", "10.0", "10.0"],
      masses: ["10.0", "", "40.0", "30.0", "40.0"],
    });

    expect(result.aValues).toEqual([1, null, 2, 3, 4]);
    expect(result.aAverage).toBe(2.5);
    expect(result.aResiduals).toEqual([-1.5, null, -0.5, 0.5, 1.5]);
  });

  it("selects brass as a literature density candidate", () => {
    const result = calculateMetalRodDensity({
      diameters: Array(15).fill("1.000"),
      lengths: Array(5).fill("10.0"),
      masses: Array(5).fill("66.523"),
      referenceDensity: "brass",
    });

    expect(result.referenceDensity).toBe(8.47);
    expect(result.referencePercentDifference).toBeCloseTo(
      Math.abs((result.rho! - 8.47) / 8.47),
    );
  });
});
