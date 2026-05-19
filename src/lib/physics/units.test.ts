import { describe, expect, it } from "vitest";
import {
  convertAcceleration,
  convertDensity,
  convertLength,
  convertMass,
  convertTime,
  convertUnit,
  convertVelocity,
  degToRad,
  formatWithUnit,
  fromMeters,
  getUnitDimension,
  getUnitLabel,
  isAccelerationUnit,
  isAngleUnit,
  isDensityUnit,
  isLengthUnit,
  isMassUnit,
  isSupportedUnit,
  isTimeUnit,
  isVelocityUnit,
  radToDeg,
  toMeters,
  toSI,
  units,
  type Unit,
  type UnitValue,
} from "./units";

describe("units", () => {
  it("converts length values through SI meters", () => {
    expect(toMeters(1, "m")).toBe(1);
    expect(toMeters(100, "cm")).toBe(1);
    expect(toMeters(1000, "mm")).toBe(1);
    expect(fromMeters(1, "cm")).toBe(100);
    expect(convertLength(25, "mm", "cm")).toBe(2.5);
  });

  it("converts mass and time values through SI units", () => {
    expect(convertMass(1000, "mg", "g")).toBe(1);
    expect(convertMass(1000, "g", "kg")).toBe(1);
    expect(convertTime(1000, "ms", "s")).toBe(1);
  });

  it("converts density between g/cm^3 and kg/m^3", () => {
    expect(convertDensity(1, "g/cm^3", "kg/m^3")).toBe(1000);
    expect(convertDensity(8930, "kg/m^3", "g/cm^3")).toBeCloseTo(8.93);
  });

  it("converts velocity and acceleration display units", () => {
    expect(convertVelocity(100, "cm/s", "m/s")).toBe(1);
    expect(convertAcceleration(980, "cm/s^2", "m/s^2")).toBeCloseTo(9.8);
  });

  it("converts angles in both directions", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it("keeps unit-aware SI values with unit metadata", () => {
    const length = toSI({ value: 12.3, unit: "cm" });
    const density = toSI({ value: 8.93, unit: "g/cm^3" });
    const mass: UnitValue<"g"> = { value: 250, unit: "g" };

    expect(length.value).toBe(12.3);
    expect(length.unit).toBe("cm");
    expect(length.siValue).toBeCloseTo(0.123);
    expect(length.siUnit).toBe("m");
    expect(density.siValue).toBeCloseTo(8930);
    expect(density.siUnit).toBe("kg/m^3");
    expect(toSI(mass).siValue).toBeCloseTo(0.25);
  });

  it("supports display labels without changing existing labels", () => {
    expect(units.density).toBe("g/cm^3");
    expect(units.densitySI).toBe("kg/m^3");
    expect(getUnitLabel("g/cm^3")).toBe("g/cm^3");
    expect(formatWithUnit("8.93", "g/cm^3")).toBe("8.93 [g/cm^3]");
    expect(isSupportedUnit("kg/m^3")).toBe(true);
  });

  it("guards supported unit dimensions", () => {
    expect(isLengthUnit("m")).toBe(true);
    expect(isMassUnit("kg")).toBe(true);
    expect(isTimeUnit("ms")).toBe(true);
    expect(isDensityUnit("g/cm^3")).toBe(true);
    expect(isVelocityUnit("cm/s")).toBe(true);
    expect(isAccelerationUnit("cm/s^2")).toBe(true);
    expect(isAngleUnit("deg")).toBe(true);
    expect(isLengthUnit("g/cm^3")).toBe(false);
    expect(getUnitDimension("rad")).toBe("angle");
  });

  it("rejects incompatible generic conversions at runtime", () => {
    expect(convertUnit(1, "m", "cm")).toBe(100);

    const fromUnit: Unit = "m";
    const toUnit: Unit = "g";
    expect(() => convertUnit(1, fromUnit, toUnit)).toThrow(
      "Cannot convert m to g.",
    );
  });

  it("round-trips conversions without losing scale", () => {
    const density = 7.86;
    const siDensity = convertDensity(density, "g/cm^3", "kg/m^3");

    expect(convertDensity(siDensity, "kg/m^3", "g/cm^3")).toBeCloseTo(density);
    expect(convertLength(convertLength(42, "cm", "m"), "m", "cm")).toBeCloseTo(
      42,
    );
    expect(radToDeg(degToRad(12.5))).toBeCloseTo(12.5);
  });
});
