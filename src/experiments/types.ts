import type { ReactNode } from "react";

export type RawInputState = Record<string, string[][]>;

export type ComputedValue = number | string | null;

export type ComputedTableCells = Record<string, Array<Record<string, ComputedValue>>>;

export type CalculationResult = {
  values: Record<string, number | null>;
  computedTables?: ComputedTableCells;
  warnings?: string[];
};

export type InputColumnDefinition = {
  key: string;
  label: string;
  unit?: string;
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

export type CsvExportContext = {
  input: RawInputState;
  calculation: CalculationResult;
  formatValue: (key: string) => string;
  formatComputedValue: (value: ComputedValue | undefined) => string;
};

export type ExperimentDefinition = {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
  inputs: InputDefinition[];
  results: ResultDefinition[];
  formulas: FormulaDefinition[];
  note?: string;
  calculate: (input: RawInputState) => CalculationResult;
  exportCsv?: (context: CsvExportContext) => string;
  renderExtra?: (calculation: CalculationResult) => ReactNode;
};
