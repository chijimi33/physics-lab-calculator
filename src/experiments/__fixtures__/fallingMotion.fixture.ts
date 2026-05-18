import type { FallingMotionRawInput } from "../fallingMotion";

export const fallingMotionFixture: {
  input: FallingMotionRawInput;
  expected: {
    gravityAverage: number;
  };
  tolerance: number;
} = {
  input: {
    freeFall: [
      ["0.1", "4.9", "cm"],
      ["0.2", "19.6", "cm"],
      ["0.3", "44.1", "cm"],
      ["0.4", "78.4", "cm"],
    ],
    resisted: [
      ["0.1", "3.0", "cm", "fixture"],
      ["0.2", "10.0", "cm", "fixture"],
      ["0.3", "19.0", "cm", "fixture"],
      ["0.4", "29.0", "cm", "fixture"],
    ],
  },
  expected: {
    gravityAverage: 9.8,
  },
  tolerance: 1e-9,
};
