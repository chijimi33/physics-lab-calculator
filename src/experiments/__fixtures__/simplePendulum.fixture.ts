import type { SimplePendulumRawInput } from "../simplePendulum";

export const simplePendulumFixture: {
  input: SimplePendulumRawInput;
  expected: {
    lengthAverage: number;
  };
  tolerance: number;
} = {
  input: {
    lengths: [
      ["100.0", "2.0"],
      ["100.1", "2.0"],
      ["99.9", "2.0"],
      ["100.0", "2.0"],
      ["100.0", "2.0"],
    ],
    amplitudes: [
      ["1", "20.0"],
      ["3", "20.0"],
      ["5", "20.1"],
    ],
    gravity: [
      ["10", "20.0"],
      ["20", "40.0"],
      ["30", "60.0"],
    ],
  },
  expected: {
    lengthAverage: 0.99,
  },
  tolerance: 1e-9,
};
