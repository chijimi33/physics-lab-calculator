import { metalRodDensityExperiment } from "./metalRodDensity.definition";
import { fallingMotionExperiment } from "./fallingMotion.definition";
import { simplePendulumExperiment } from "./simplePendulum.definition";
import { formatExperimentNumber } from "./numbering";
import type { ExperimentDefinition } from "./types";

function normalizeExperimentDefinition(
  experiment: ExperimentDefinition,
): ExperimentDefinition {
  const experimentNumber =
    experiment.experimentNumber ||
    formatExperimentNumber(experiment.seriesNumber, experiment.experimentIndex);

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
