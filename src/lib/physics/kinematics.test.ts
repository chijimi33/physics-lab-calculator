import { describe, expect, it } from "vitest";
import {
  calculateAccelerationByFiniteDifference,
  calculateVelocityByFiniteDifference,
  convertPositionToMeters,
  estimateGravityByLinearRegression,
  estimateGravityFromPoints,
  finiteDifference,
  hasStrictlyIncreasingTimes,
  normalizeMotionPoints,
} from "./kinematics";

describe("kinematics", () => {
  it("converts cm to m", () => {
    expect(convertPositionToMeters(100, "cm")).toBe(1);
    expect(convertPositionToMeters(1, "m")).toBe(1);
  });

  it("calculates velocity by finite difference", () => {
    const points = normalizeMotionPoints([
      { t: 0, x: 0, unit: "m" },
      { t: 1, x: 1, unit: "m" },
      { t: 2, x: 4, unit: "m" },
    ]);

    expect(calculateVelocityByFiniteDifference(points)).toEqual([1, 2, 3]);
  });

  it("calculates acceleration by finite difference", () => {
    expect(calculateAccelerationByFiniteDifference([0, 1, 2], [1, 2, 3])).toEqual([
      1,
      1,
      1,
    ]);
  });

  it("excludes t = 0 from pointwise gravity estimates", () => {
    const points = normalizeMotionPoints([
      { t: 0, x: 0, unit: "m" },
      { t: 1, x: 4.9, unit: "m" },
    ]);
    const result = estimateGravityFromPoints(points);

    expect(result.values[0]).toBeNull();
    expect(result.values[1]).toBeCloseTo(9.8);
    expect(result.average).toBeCloseTo(9.8);
  });

  it("estimates gravity by regression through the origin", () => {
    const points = normalizeMotionPoints([
      { t: 1, x: 4.9, unit: "m" },
      { t: 2, x: 19.6, unit: "m" },
    ]);

    expect(estimateGravityByLinearRegression(points).gravity).toBeCloseTo(9.8);
  });

  it("returns null when delta t is zero", () => {
    const points = normalizeMotionPoints([
      { t: 1, x: 1, unit: "m" },
      { t: 1, x: 2, unit: "m" },
    ]);

    expect(calculateVelocityByFiniteDifference(points)).toEqual([null, null]);
  });

  it("keeps finite difference safe for missing or infinite values", () => {
    expect(finiteDifference([0, Number.POSITIVE_INFINITY, 2], [0, 1, 2])).toEqual([
      null,
      1,
      null,
    ]);
  });

  it("detects non-increasing times", () => {
    const points = normalizeMotionPoints([
      { t: 0, x: 0, unit: "m" },
      { t: 1, x: 1, unit: "m" },
      { t: 1, x: 2, unit: "m" },
    ]);

    expect(hasStrictlyIncreasingTimes(points)).toBe(false);
  });
});
