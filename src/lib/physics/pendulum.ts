import { degToRad } from "./units";

export const STANDARD_GRAVITY = 9.80665;

export function degreesToRadians(degrees: number): number {
  return degToRad(degrees);
}

export function calculatePendulumLengthMeters(
  totalLengthCentimeters: number,
  bobDiameterCentimeters: number,
): number | null {
  if (
    !Number.isFinite(totalLengthCentimeters) ||
    !Number.isFinite(bobDiameterCentimeters) ||
    totalLengthCentimeters <= 0 ||
    bobDiameterCentimeters < 0
  ) {
    return null;
  }

  const lengthCentimeters = totalLengthCentimeters - bobDiameterCentimeters / 2;
  return lengthCentimeters > 0 ? lengthCentimeters / 100 : null;
}

export function calculatePeriodFromElapsedTime(
  elapsedSeconds: number,
  oscillationCount: number,
): number | null {
  if (
    !Number.isFinite(elapsedSeconds) ||
    !Number.isFinite(oscillationCount) ||
    elapsedSeconds <= 0 ||
    oscillationCount <= 0
  ) {
    return null;
  }

  return elapsedSeconds / oscillationCount;
}

export function calculateGravityFromPeriod(
  lengthMeters: number | null,
  periodSeconds: number | null,
): number | null {
  if (
    lengthMeters === null ||
    periodSeconds === null ||
    !Number.isFinite(lengthMeters) ||
    !Number.isFinite(periodSeconds) ||
    lengthMeters <= 0 ||
    periodSeconds <= 0
  ) {
    return null;
  }

  return (4 * Math.PI ** 2 * lengthMeters) / periodSeconds ** 2;
}

export function calculateSmallAnglePeriod(
  lengthMeters: number | null,
  gravity = STANDARD_GRAVITY,
): number | null {
  if (
    lengthMeters === null ||
    !Number.isFinite(lengthMeters) ||
    !Number.isFinite(gravity) ||
    lengthMeters <= 0 ||
    gravity <= 0
  ) {
    return null;
  }

  return 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
}

export function calculateAmplitudeCorrectedPeriod(
  smallAnglePeriodSeconds: number | null,
  amplitudeRadians: number,
): number | null {
  if (
    smallAnglePeriodSeconds === null ||
    !Number.isFinite(smallAnglePeriodSeconds) ||
    !Number.isFinite(amplitudeRadians) ||
    smallAnglePeriodSeconds <= 0
  ) {
    return null;
  }

  return smallAnglePeriodSeconds * (1 + amplitudeRadians ** 2 / 16);
}
