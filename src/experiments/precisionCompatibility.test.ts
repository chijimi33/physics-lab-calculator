import { describe, expect, it } from "vitest";
import { fallingMotionFixture } from "./__fixtures__/fallingMotion.fixture";
import { metalRodDensityFixture } from "./__fixtures__/metalRodDensity.fixture";
import { simplePendulumFixture } from "./__fixtures__/simplePendulum.fixture";
import { calculateFallingMotion } from "./fallingMotion";
import { calculateMetalRodDensity } from "./metalRodDensity";
import { calculateSimplePendulum } from "./simplePendulum";
import { formatExperimentNumber } from "./numbering";

describe("precision settings compatibility", () => {
  it("keeps 1-1, 1-2, and 1-3 experiment numbers", () => {
    expect([1, 2, 3].map((index) => formatExperimentNumber(1, index))).toEqual([
      "1-1",
      "1-2",
      "1-3",
    ]);
  });

  it("does not change the primary 1-1 calculation fixture", () => {
    const result = calculateMetalRodDensity(metalRodDensityFixture.input);

    expect(result.dAverage).toBeCloseTo(
      metalRodDensityFixture.expected.dAverage,
      metalRodDensityFixture.precision,
    );
    expect(result.referenceDensity).toBe(
      metalRodDensityFixture.expected.referenceDensity,
    );
  });

  it("does not change the primary 1-2 calculation fixture", () => {
    const result = calculateFallingMotion(fallingMotionFixture.input);

    expect(result.gravityAverage).toBeCloseTo(
      fallingMotionFixture.expected.gravityAverage,
      9,
    );
  });

  it("does not change the primary 1-3 calculation fixture", () => {
    const result = calculateSimplePendulum(simplePendulumFixture.input);

    expect(result.lengthAverage).toBeCloseTo(
      simplePendulumFixture.expected.lengthAverage,
      9,
    );
  });
});
