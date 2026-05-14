import { metalRodDensityExperiment } from "./metalRodDensity.definition";
import { fallingMotionExperiment } from "./fallingMotion.definition";

export const experiments = [metalRodDensityExperiment, fallingMotionExperiment];

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
