import { describe, expect, it } from "vitest";
import {
  applyPrecisionMode,
  createCalculatedValue,
  getHiddenDigits,
  roundToGuardDigits,
} from "./precision";

describe("precision mode utilities", () => {
  it("separates rawValue, workingValue, and displayValue", () => {
    const rawValue = 1.234 * 5.678;
    const calculated = createCalculatedValue({
      rawValue,
      significantDigits: 4,
      guardDigits: 1,
      precisionMode: "guarded",
    });

    expect(calculated.rawValue).toBe(7.006652);
    expect(calculated.workingValue).toBe(7.0067);
    expect(calculated.displayValue).toBe("7.007");
  });

  it("changes workingValue when guardDigits changes", () => {
    const rawValue = 1.234 * 5.678;

    expect(roundToGuardDigits(rawValue, 4, 0)).toBe(7.007);
    expect(roundToGuardDigits(rawValue, 4, 1)).toBe(7.0067);
    expect(roundToGuardDigits(rawValue, 4, 2)).toBe(7.00665);
  });

  it("passes rawValue to the next general calculation in full mode", () => {
    const calculated = createCalculatedValue({
      rawValue: 7.006652,
      significantDigits: 4,
      guardDigits: 1,
      precisionMode: "full",
    });

    expect(applyPrecisionMode(calculated, { precisionMode: "full" })).toBe(
      calculated.rawValue,
    );
  });

  it("passes workingValue to the next general calculation in guarded mode", () => {
    const calculated = createCalculatedValue({
      rawValue: 7.006652,
      significantDigits: 4,
      guardDigits: 1,
      precisionMode: "guarded",
    });

    expect(applyPrecisionMode(calculated, { precisionMode: "guarded" })).toBe(
      calculated.workingValue,
    );
  });

  it("keeps full precision for statistics, regression, and error propagation", () => {
    const calculated = createCalculatedValue({
      rawValue: 7.006652,
      significantDigits: 4,
      guardDigits: 1,
      precisionMode: "guarded",
    });

    expect(
      applyPrecisionMode(calculated, { precisionMode: "guarded" }, "statistics"),
    ).toBe(calculated.rawValue);
    expect(
      applyPrecisionMode(calculated, { precisionMode: "guarded" }, "regression"),
    ).toBe(calculated.rawValue);
    expect(
      applyPrecisionMode(
        calculated,
        { precisionMode: "guarded" },
        "errorPropagation",
      ),
    ).toBe(calculated.rawValue);
  });

  it("extracts hidden digits from the displayed value", () => {
    expect(getHiddenDigits(7.006652, "7.007")).toBe(652);
  });
});

