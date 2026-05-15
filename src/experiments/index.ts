import { metalRodDensityExperiment } from "./metalRodDensity.definition";
import { fallingMotionExperiment } from "./fallingMotion.definition";
import { simplePendulumExperiment } from "./simplePendulum.definition";

export const experiments = [
  metalRodDensityExperiment,
  fallingMotionExperiment,
  simplePendulumExperiment,
];

export type {
  CalculationResult,
  ComputedValue,
  CsvExportContext,
  ExperimentDefinition,
  FormulaDefinition,
  InputColumnDefinition,
  InputDefinition,
  RawInputState,
  ResultDefinition,
} from "./types";
