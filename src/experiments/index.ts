import { metalRodDensityExperiment } from "./metalRodDensity.definition";
import { fallingMotionExperiment } from "./fallingMotion.definition";
import { simplePendulumExperiment } from "./simplePendulum.definition";
import type { ExperimentDefinition } from "./types";

function createExperimentNumber(experiment: ExperimentDefinition): string {
  return `${experiment.seriesNumber}-${experiment.experimentIndex}`;
}

function normalizeExperimentDefinition(
  experiment: ExperimentDefinition,
): ExperimentDefinition {
  const experimentNumber =
    experiment.experimentNumber || createExperimentNumber(experiment);

  return {
    status: "stable",
    tags: [],
    graphDefinitions: [],
    csvExportDefinition: { enabled: Boolean(experiment.exportCsv) },
    warnings: [],
    ...experiment,
    experimentNumber,
    inputSections: experiment.inputSections ?? experiment.inputs,
    resultDefinitions: experiment.resultDefinitions ?? experiment.results,
  };
}

export const experiments = [
  metalRodDensityExperiment,
  fallingMotionExperiment,
  simplePendulumExperiment,
].map(normalizeExperimentDefinition);

export type {
  CalculationResult,
  ComputedValue,
  CsvExportContext,
  ExperimentDefinition,
  FormulaDefinition,
  GraphDefinition,
  GraphPoint,
  GraphSeriesData,
  InputColumnDefinition,
  InputDefinition,
  RawInputState,
  ResultDefinition,
} from "./types";
