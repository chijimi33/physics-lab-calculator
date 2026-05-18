import type { MetalRodDensityRawInput } from "../metalRodDensity";

export const metalRodDensityFixture: {
  input: MetalRodDensityRawInput;
  expected: {
    dAverage: number;
    referenceDensity: number;
  };
  precision: number;
} = {
  input: {
    diameters: [
      "1.000",
      "1.010",
      "0.990",
      "1.000",
      "1.005",
      "0.995",
      "1.002",
      "0.998",
      "1.001",
      "0.999",
      "1.004",
      "0.996",
      "1.003",
      "0.997",
      "1.000",
    ],
    lengths: ["10.00", "10.10", "9.90", "10.05", "9.95"],
    masses: ["78.5", "79.3", "77.7", "78.9", "78.1"],
    referenceDensity: "copper",
  },
  expected: {
    dAverage: 1,
    referenceDensity: 8.93,
  },
  precision: 6,
};
