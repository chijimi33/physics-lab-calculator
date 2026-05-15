import { describe, expect, it } from "vitest";
import {
  calculateAmplitudeCorrectedPeriod,
  calculateGravityFromPeriod,
  calculatePendulumLengthMeters,
  calculatePeriodFromElapsedTime,
  calculateSmallAnglePeriod,
  degreesToRadians,
  STANDARD_GRAVITY,
} from "./pendulum";

describe("pendulum utilities", () => {
  it("converts degrees to radians", () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 12);
  });

  it("calculates pendulum length from total length and bob diameter", () => {
    expect(calculatePendulumLengthMeters(100, 2)).toBeCloseTo(0.99, 12);
  });

  it("calculates period from elapsed time and oscillation count", () => {
    expect(calculatePeriodFromElapsedTime(20, 10)).toBe(2);
  });

  it("calculates gravity from length and period", () => {
    const period = calculateSmallAnglePeriod(1, STANDARD_GRAVITY);
    expect(calculateGravityFromPeriod(1, period)).toBeCloseTo(STANDARD_GRAVITY, 10);
  });

  it("applies small amplitude correction", () => {
    const corrected = calculateAmplitudeCorrectedPeriod(2, degreesToRadians(10));
    expect(corrected).toBeCloseTo(2 * (1 + degreesToRadians(10) ** 2 / 16), 12);
  });
});
