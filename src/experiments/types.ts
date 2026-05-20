import type { ReactNode } from "react";

export type RawInputState = Record<string, string[][]>;

export type ComputedValue = number | string | null;

export type ComputedTableCells = Record<string, Array<Record<string, ComputedValue>>>;

export type GraphPoint = {
  x: number;
  y: number;
};

export type GraphSeriesData = Record<string, GraphPoint[]>;

export type CalculationResult = {
  values: Record<string, number | null>;
  computedTables?: ComputedTableCells;
  graphs?: Record<string, GraphSeriesData>;
  warnings?: string[];
};

export type InputColumnDefinition = {
  key: string;
  label: string;
  unit?: string;
  placeholder?: string;
  inputType?: "number" | "text" | "select";
  options?: Array<{ label: string; value: string }>;
  allowNegative?: boolean;
  warnOnZero?: boolean;
};

export type ComputedColumnDefinition = {
  key: string;
  label: string;
};

export type InputDefinition = {
  id: string;
  title: string;
  description?: string;
  rowCount: number;
  minRows?: number;
  maxRows?: number;
  dynamicRows?: boolean;
  rowCountMode?: "fixed" | "select" | "manual";
  rowLabel?: string;
  required?: boolean;
  columns: InputColumnDefinition[];
  computedColumns?: ComputedColumnDefinition[];
};

export type ResultDefinition = {
  key: string;
  label: string;
  priority?: "primary" | "normal";
  kind?: "number" | "percent" | "valueWithError";
  errorKey?: string;
  unit?: string;
  formula?: string;
  detail?: string;
};

export type FormulaDefinition = {
  label: string;
  expression: string;
  description?: string;
};

export type ExperimentStatus = "stable" | "beta" | "todo";

export type GraphDefinition = {
  id: string;
  title: string;
  description?: string;
  kind: "scatter" | "line" | "regression" | "residual";
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  series: Array<{
    key: string;
    label: string;
    kind?: "scatter" | "line" | "regression" | "residual";
  }>;
};

export type CsvExportDefinition = {
  filenamePrefix?: string;
  enabled: boolean;
};

export type CsvExportContext = {
  input: RawInputState;
  calculation: CalculationResult;
  formatValue: (key: string) => string;
  formatComputedValue: (value: ComputedValue | undefined) => string;
};

export type ExperimentDefinition = {
  id: string;
  number: number;
  seriesNumber: number;
  experimentIndex: number;
  experimentNumber: string;
  slug: string;
  legacySlugs?: string[];
  title: string;
  description: string;
  status?: ExperimentStatus;
  tags?: string[];
  lastUpdated?: string;
  inputs: InputDefinition[];
  inputSections?: InputDefinition[];
  results: ResultDefinition[];
  resultDefinitions?: ResultDefinition[];
  formulas: FormulaDefinition[];
  graphDefinitions?: GraphDefinition[];
  csvExportDefinition?: CsvExportDefinition;
  warnings?: string[];
  note?: string;
  calculate: (input: RawInputState) => CalculationResult;
  exportCsv?: (context: CsvExportContext) => string;
  renderExtra?: (calculation: CalculationResult) => ReactNode;
};
