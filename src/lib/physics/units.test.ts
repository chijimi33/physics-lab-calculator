import { describe, expect, it } from "vitest";
import {
  convertLength,
  convertUnit,
  fromMeters,
  getUnitLabel,
  isLengthUnit,
  isSupportedUnit,
  toMeters,
  toSI,
  units,
} from "./units";

describe("units", () => {
  it("converts length values through SI meters", () => {
    expect(toMeters(1, "m")).toBe(1);
    expect(toMeters(100, "cm")).toBe(1);
    expect(toMeters(1000, "mm")).toBe(1);
    expect(fromMeters(1, "cm")).toBe(100);
    expect(convertLength(25, "mm", "cm")).toBe(2.5);
  });

  it("keeps unit-aware SI values with unit metadata", () => {
    const result = toSI({ value: 12.3, unit: "cm" });

    expect(result.value).toBe(12.3);
    expect(result.unit).toBe("cm");
    expect(result.siValue).toBeCloseTo(0.123);
    expect(result.siUnit).toBe("m");
  });

  it("supports density display units without changing existing labels", () => {
    expect(units.density).toBe("g/cm^3");
    expect(getUnitLabel("g/cm^3")).toBe("g/cm^3");
    expect(isSupportedUnit("g/cm^3")).toBe(true);
  });

  it("guards supported length units", () => {
    expect(isLengthUnit("m")).toBe(true);
    expect(isLengthUnit("cm")).toBe(true);
    expect(isLengthUnit("mm")).toBe(true);
    expect(isLengthUnit("g/cm^3")).toBe(false);
  });

  it("rejects incompatible generic conversions", () => {
    expect(convertUnit(1, "m", "cm")).toBe(100);
    expect(() => convertUnit(1, "m", "g/cm^3")).toThrow(
      "Cannot convert m to g/cm^3.",
    );
  });
});
