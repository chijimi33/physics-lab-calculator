import { describe, expect, it } from "vitest";
import {
  countDecimalPlaces,
  countSignificantFigures,
  type MeasurementValue,
  parseMeasurementValue,
  formatToSignificantFigures,
  roundByError,
  roundForAddition,
  roundForMultiplicationFinal,
  roundForMultiplicationIntermediate,
  roundToSignificantFigures,
} from "./significantFigures";

describe("significant figures", () => {
  it("keeps trailing zero information in parsed measurements", () => {
    expect(parseMeasurementValue("10.0")).toMatchObject({
      value: 10,
      significantFigures: 3,
      decimalPlaces: 1,
    });
    expect(parseMeasurementValue("10.00")).toMatchObject({
      value: 10,
      significantFigures: 4,
      decimalPlaces: 2,
    });
  });

  it("counts scientific notation decimal places", () => {
    expect(countDecimalPlaces("1.20e-2")).toBe(4);
    expect(countSignificantFigures("1.20e-2")).toBe(3);
  });

  it("roundToSignificantFigures rounds by significant digits", () => {
    expect(roundToSignificantFigures(1234, 3)).toBe(1230);
    expect(roundToSignificantFigures(0.01234, 2)).toBe(0.012);
  });

  it("formats significant figures without scientific notation", () => {
    expect(formatToSignificantFigures(0.0001234, 3)).toBe("0.000123");
    expect(formatToSignificantFigures(123456, 3)).toBe("123000");
  });

  it("roundForAddition uses the coarsest decimal place", () => {
    const values = [parseMeasurementValue("23.45"), parseMeasurementValue("23.3")];
    expect(
      roundForAddition(
        values.filter((value): value is MeasurementValue => value !== null),
        0.15,
      ),
    ).toBe("0.2");
  });

  it("roundByError aligns value decimals to the error", () => {
    expect(roundByError(7.856, 0.123)).toMatchObject({
      value: "7.9",
      error: "0.1",
      combined: "7.9 +/- 0.1",
    });
  });

  it("roundByError respects value significant figures when error is zero", () => {
    expect(roundByError(7.856, 0, 1, 5)).toMatchObject({
      value: "7.8560",
      error: "0",
      combined: "7.8560 +/- 0",
    });
  });

  it("separates intermediate and final multiplication rounding", () => {
    const values = [parseMeasurementValue("2.0"), parseMeasurementValue("3.141")];
    const measurements = values.filter(
      (value): value is MeasurementValue => value !== null,
    );

    expect(roundForMultiplicationIntermediate(measurements, 6.282)).toBe("6.28");
    expect(roundForMultiplicationFinal(measurements, 6.282)).toBe("6.3");
  });
});
