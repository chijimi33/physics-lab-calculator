import { describe, expect, it } from "vitest";
import { calculateFallingMotion } from "./fallingMotion";
import { fallingMotionFixture } from "./__fixtures__/fallingMotion.fixture";

describe("calculateFallingMotion", () => {
  it("matches the fixture gravity estimate", () => {
    const result = calculateFallingMotion(fallingMotionFixture.input);

    expect(result.gravityAverage).toBeCloseTo(
      fallingMotionFixture.expected.gravityAverage,
      9,
    );
  });

  it("keeps calculated rows aligned when a blank row exists", () => {
    const result = calculateFallingMotion({
      freeFall: [
        ["0", "0", "m"],
        ["", "", "m"],
        ["1", "4.9", "m"],
        ["2", "19.6", "m"],
      ],
      resisted: [],
    });

    expect(result.freeFallVelocities[1]).toBeNull();
    expect(result.freeFallGravityValues[1]).toBeNull();
    expect(result.freeFallGravityValues[2]).toBeCloseTo(9.8);
    expect(result.warnings.some((warning) => warning.includes("途中に空欄"))).toBe(
      true,
    );
  });

  it("does not silently treat an invalid unit as meters", () => {
    const result = calculateFallingMotion({
      freeFall: [
        ["0", "0", "m"],
        ["1", "490", "bad-unit"],
      ],
      resisted: [],
    });

    expect(result.freeFallPoints[1]).toBeNull();
    expect(result.freeFallGravityValues[1]).toBeNull();
    expect(result.warnings.some((warning) => warning.includes("位置単位"))).toBe(
      true,
    );
  });

  it("accepts millimeter position input as SI-aware length data", () => {
    const result = calculateFallingMotion({
      freeFall: [
        ["0", "0", "mm"],
        ["1", "4900", "mm"],
      ],
      resisted: [],
    });

    expect(result.freeFallPoints[1]?.xMeters).toBeCloseTo(4.9);
    expect(result.freeFallGravityValues[1]).toBeCloseTo(9.8);
  });

  it("does not calculate finite differences or regression when times are duplicated", () => {
    const result = calculateFallingMotion({
      freeFall: [
        ["0", "0", "m"],
        ["1", "4.9", "m"],
        ["1", "5.0", "m"],
      ],
      resisted: [],
    });

    expect(result.freeFallVelocities).toEqual([null, null, null]);
    expect(result.freeFallAccelerations).toEqual([null, null, null]);
    expect(result.gravityRegression).toBeNull();
    expect(result.warnings.some((warning) => warning.includes("Δt = 0"))).toBe(
      true,
    );
  });
});
