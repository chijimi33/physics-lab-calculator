import { describe, expect, it } from "vitest";
import {
  applyPrecisionMode,
  createCalculatedValue,
  createMeasurementTrackedValue,
  estimatePrecisionFromMeasurements,
  getHiddenDigits,
  roundToGuardDigits,
  shouldShowGlobalSignificantDigits,
  trackAdditionOrSubtraction,
  trackMultiplicationOrDivision,
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

  it("estimates significant figures from input strings and keeps trailing zeros", () => {
    const value = createMeasurementTrackedValue("1.230");

    expect(value).toMatchObject({
      rawValue: 1.23,
      significantDigits: 4,
      decimalPlaces: 3,
      precisionSource: "measurement",
    });
    expect(value?.warnings).toContain(
      "末尾の0を測定値の有効桁として保持しています。",
    );

    expect(createMeasurementTrackedValue("0.0120")?.significantDigits).toBe(3);
  });

  it("uses the minimum significant figures plus guardDigits for multiplication and division", () => {
    const left = createMeasurementTrackedValue("1.234");
    const right = createMeasurementTrackedValue("5.678");

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();

    const tracked = trackMultiplicationOrDivision({
      rawValue: 1.234 * 5.678,
      inputs: [left!, right!],
      guardDigits: 1,
    });

    expect(tracked.significantDigits).toBe(4);
    expect(tracked.workingValue).toBe(7.0067);
    expect(tracked.roundingReason).toContain("最小有効数字4桁");
  });

  it("uses decimal places for addition and subtraction", () => {
    const left = createMeasurementTrackedValue("23.45");
    const right = createMeasurementTrackedValue("23.3");

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();

    const tracked = trackAdditionOrSubtraction({
      rawValue: 0.15,
      inputs: [left!, right!],
    });

    expect(tracked.displayValue).toBe("0.2");
    expect(tracked.decimalPlaces).toBe(1);
  });

  it("detects cancellation in subtraction", () => {
    const left = createMeasurementTrackedValue("123.4");
    const right = createMeasurementTrackedValue("123.1");

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();

    const tracked = trackAdditionOrSubtraction({
      rawValue: 123.4 - 123.1,
      inputs: [left!, right!],
    });

    expect(tracked.precisionSource).toBe("cancellation-detected");
    expect(tracked.warnings[0]).toContain("桁落ち");
  });

  it("shows global significant digits only in full precision mode", () => {
    expect(shouldShowGlobalSignificantDigits("full")).toBe(true);
    expect(shouldShowGlobalSignificantDigits("guarded")).toBe(false);
  });

  it("estimates precision from a group of measurements", () => {
    expect(
      estimatePrecisionFromMeasurements(["1.230", "2.1", "0.0120"]),
    ).toMatchObject({
      significantDigits: 2,
      decimalPlaces: 1,
      warnings: ["末尾の0を含む測定値は、有効桁として扱っています。"],
    });
  });
});
