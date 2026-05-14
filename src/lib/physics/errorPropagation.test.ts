import { describe, expect, it } from "vitest";
import { relativeErrorPropagation } from "./errorPropagation";

describe("relativeErrorPropagation", () => {
  it("uses absolute powers and relative errors in linear mode", () => {
    expect(
      relativeErrorPropagation([
        { value: 10, error: 1, power: 1 },
        { value: 5, error: 0.5, power: -2 },
      ]),
    ).toBeCloseTo(0.3);
  });

  it("supports quadrature mode for independent errors", () => {
    expect(
      relativeErrorPropagation(
        [
          { value: 10, error: 1, power: 1 },
          { value: 5, error: 0.5, power: -2 },
        ],
        "quadrature",
      ),
    ).toBeCloseTo(Math.sqrt(0.1 ** 2 + 0.2 ** 2));
  });
});
