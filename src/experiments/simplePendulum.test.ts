import { describe, expect, it } from "vitest";
import { calculateSimplePendulum } from "./simplePendulum";
import { simplePendulumFixture } from "./__fixtures__/simplePendulum.fixture";

describe("calculateSimplePendulum", () => {
  it("matches the fixture length average", () => {
    const result = calculateSimplePendulum(simplePendulumFixture.input);

    expect(result.lengthAverage).toBeCloseTo(
      simplePendulumFixture.expected.lengthAverage,
      9,
    );
  });

  it("calculates pendulum length, amplitude regression, and gravity", () => {
    const result = calculateSimplePendulum({
      lengths: [
        ["100.0", "2.0"],
        ["100.2", "2.0"],
      ],
      amplitudes: [
        ["0", "20.00"],
        ["10", "20.04"],
      ],
      gravity: [
        ["10", "20.0"],
        ["20", "40.0"],
        ["30", "60.0"],
      ],
    });

    expect(result.lengthAverage).toBeCloseTo(0.991, 12);
    expect(result.amplitudeZeroPeriod).toBeCloseTo(2, 12);
    expect(result.amplitudeRadians[1]).toBeCloseTo(Math.PI / 18, 12);
    expect(result.amplitudeSquares[1]).toBeCloseTo((Math.PI / 18) ** 2, 12);
    expect(result.amplitudePeriods[1]).toBeCloseTo(2.004, 12);
    expect(result.amplitudeRegressionSlope).not.toBeNull();
    expect(result.amplitudeRegressionIntercept).toBeCloseTo(2, 12);
    expect(result.amplitudeRegressionRSquared).toBeCloseTo(1, 12);
    expect(result.amplitudeMeanPeriods[0]).toBeCloseTo(2, 12);
    expect(result.amplitudeIncreaseAtFiveDegrees).not.toBeNull();
    expect(result.gravityPeriod).toBeCloseTo(2, 12);
    expect(result.gravityIntercept).toBeCloseTo(0, 12);
    expect(result.gravityRSquared).toBeCloseTo(1, 12);
    expect(result.gravity).toBeCloseTo((4 * Math.PI ** 2 * 0.991) / 4, 12);
    expect(result.gravityDifference).toBeCloseTo(
      (4 * Math.PI ** 2 * 0.991) / 4 - 9.80665,
      12,
    );
    expect(result.reportExperiment1).toContain("T-phi_0^2 回帰式");
    expect(result.reportExperiment2).toContain("n-t 回帰式");
    expect(result.warnings).toHaveLength(0);
  });

  it("does not treat blank cells as zero measurements", () => {
    const result = calculateSimplePendulum({
      lengths: [["", ""]],
      amplitudes: [["", ""], ["10", "20.04"]],
      gravity: [["", ""], ["10", "20.0"]],
    });

    expect(result.lengthAverage).toBeNull();
    expect(result.amplitudeRadians[0]).toBeNull();
    expect(result.amplitudePeriods[0]).toBeNull();
    expect(result.gravityPredictedTimes[0]).toBeNull();
    expect(result.gravityPeriod).toBeNull();
  });

  it("averages repeated periods at the same amplitude before amplitude regression", () => {
    const result = calculateSimplePendulum({
      lengths: [["100.0", "2.0"]],
      amplitudes: [
        ["0", "20.00"],
        ["0", "20.20"],
        ["5", "20.30"],
      ],
      gravity: [
        ["10", "20.0"],
        ["20", "40.0"],
      ],
    });

    expect(result.amplitudeMeanPeriods[0]).toBeCloseTo(2.01, 12);
    expect(result.amplitudeMeanPeriods[1]).toBeCloseTo(2.01, 12);
    expect(result.amplitudeMeanPeriods[2]).toBeCloseTo(2.03, 12);
    expect(result.amplitudeRegressionIntercept).toBeCloseTo(2.01, 12);
  });
});
