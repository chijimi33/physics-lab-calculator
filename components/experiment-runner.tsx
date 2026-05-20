"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { experiments } from "@/experiments";
import { GraphCard } from "@/components/graph-card";
import { MeasurementTable } from "@/components/measurement-table";
import { ResultCard } from "@/components/result-card";
import { MathFormula } from "@/src/components/math/MathFormula";
import { FormulaCard } from "@/src/components/math/FormulaCard";
import type {
  ComputedValue,
  ExperimentDefinition,
  InputDefinition,
  RawInputState,
} from "@/src/experiments";
import {
  createEmptyRow,
  usePersistedExperimentInput,
} from "@/src/hooks/usePersistedExperimentInput";
import {
  formatToSignificantFigures,
  roundByError,
} from "@/src/lib/physics/significantFigures";
import {
  createCalculatedValue,
  DEFAULT_PRECISION_SETTINGS,
  estimatePrecisionFromMeasurements,
  shouldShowGlobalSignificantDigits,
  type CalculatedValue,
  type PrecisionMode,
  type PrecisionSettings,
} from "@/src/lib/physics/precision";
import { withUnit } from "@/src/lib/physics/units";

type ExperimentRunnerProps = {
  slug: string;
};

type CellWarnings = Record<string, string[][][]>;

const DEFAULT_OUTPUT_SIGNIFICANT_DIGITS = 3;
const MIN_OUTPUT_SIGNIFICANT_DIGITS = 2;
const MAX_OUTPUT_SIGNIFICANT_DIGITS = 6;
const MIN_GUARD_DIGITS = 0;
const MAX_GUARD_DIGITS = 3;
const DEFAULT_USAGE_CAUTION =
  "このツールは計算補助用です。提出前に、実験書・授業担当者の指示・自分の計算と照合してください。";

function clampOutputSignificantDigits(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric)) {
    return DEFAULT_OUTPUT_SIGNIFICANT_DIGITS;
  }

  return Math.min(
    Math.max(numeric, MIN_OUTPUT_SIGNIFICANT_DIGITS),
    MAX_OUTPUT_SIGNIFICANT_DIGITS,
  );
}

function clampGuardDigits(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric)) {
    return DEFAULT_PRECISION_SETTINGS.guardDigits;
  }

  return Math.min(Math.max(numeric, MIN_GUARD_DIGITS), MAX_GUARD_DIGITS);
}

function parsePrecisionSettings(value: string | null): PrecisionSettings {
  if (value === null) {
    return DEFAULT_PRECISION_SETTINGS;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PrecisionSettings>;
    const precisionMode: PrecisionMode =
      parsed.precisionMode === "full" ? "full" : "guarded";

    return {
      precisionMode,
      guardDigits: clampGuardDigits(parsed.guardDigits),
      showRawValue:
        typeof parsed.showRawValue === "boolean"
          ? parsed.showRawValue
          : DEFAULT_PRECISION_SETTINGS.showRawValue,
      showWorkingValue:
        typeof parsed.showWorkingValue === "boolean"
          ? parsed.showWorkingValue
          : DEFAULT_PRECISION_SETTINGS.showWorkingValue,
      showHiddenDigits:
        typeof parsed.showHiddenDigits === "boolean"
          ? parsed.showHiddenDigits
          : DEFAULT_PRECISION_SETTINGS.showHiddenDigits,
      showPrecisionWarnings:
        typeof parsed.showPrecisionWarnings === "boolean"
          ? parsed.showPrecisionWarnings
          : DEFAULT_PRECISION_SETTINGS.showPrecisionWarnings,
    };
  } catch {
    return DEFAULT_PRECISION_SETTINGS;
  }
}

function updateCell(
  state: RawInputState,
  tableId: string,
  rowIndex: number,
  columnIndex: number,
  value: string,
): RawInputState {
  return {
    ...state,
    [tableId]: state[tableId].map((row, currentRowIndex) =>
      currentRowIndex === rowIndex
        ? row.map((cell, currentColumnIndex) =>
            currentColumnIndex === columnIndex ? value : cell,
          )
        : row,
    ),
  };
}

function addRow(
  experiment: ExperimentDefinition,
  state: RawInputState,
  tableId: string,
): RawInputState {
  return {
    ...state,
    [tableId]: [...(state[tableId] ?? []), createEmptyRow(experiment, tableId)],
  };
}

function deleteRow(
  experiment: ExperimentDefinition,
  state: RawInputState,
  tableId: string,
  rowIndex: number,
): RawInputState {
  const table = experiment.inputs.find((input) => input.id === tableId);
  const minRows = table?.minRows ?? 1;
  const rows = state[tableId] ?? [];

  if (rows.length <= minRows) {
    return state;
  }

  return {
    ...state,
    [tableId]: rows.filter((_row, currentIndex) => currentIndex !== rowIndex),
  };
}

function resizeRows(
  experiment: ExperimentDefinition,
  state: RawInputState,
  tableId: string,
  rowCount: number,
): RawInputState {
  const table = experiment.inputs.find((input) => input.id === tableId);
  const minRows = table?.minRows ?? 1;
  const maxRows = table?.maxRows ?? table?.rowCount ?? minRows;

  if (!Number.isInteger(rowCount)) {
    return state;
  }

  const safeRowCount = Math.min(Math.max(rowCount, minRows), maxRows);
  const currentRows = state[tableId] ?? [];
  const nextRows = Array.from({ length: safeRowCount }, (_unused, index) =>
    currentRows[index] ?? createEmptyRow(experiment, tableId),
  );

  return {
    ...state,
    [tableId]: nextRows,
  };
}

function formatResultValue(
  experiment: ExperimentDefinition,
  key: string,
  values: Record<string, ComputedValue>,
  significantDigits: number,
): string {
  const resultDefinition = experiment.results.find((result) => result.key === key);
  const value = values[key] ?? null;

  if (typeof value === "string") {
    return value;
  }

  if (resultDefinition?.kind === "percent") {
    return value === null
      ? "-"
      : `${formatToSignificantFigures(value * 100, significantDigits)} %`;
  }

  if (resultDefinition?.kind === "valueWithError") {
    const errorValue = resultDefinition.errorKey
      ? values[resultDefinition.errorKey] ?? null
      : null;
    const formatted = roundByError(
      value,
      typeof errorValue === "number" ? errorValue : null,
      significantDigits,
      significantDigits,
    ).combined;
    return withUnit(formatted, resultDefinition.unit);
  }

  return withUnit(
    formatToSignificantFigures(value, significantDigits),
    resultDefinition?.unit,
  );
}

function updateCells(
  experiment: ExperimentDefinition,
  state: RawInputState,
  tableId: string,
  startRowIndex: number,
  startColumnIndex: number,
  values: string[][],
): RawInputState {
  const table = experiment.inputs.find((input) => input.id === tableId);
  const columnCount = table?.columns.length ?? 0;
  const currentRows = state[tableId] ?? [];
  const neededRows = startRowIndex + values.length;
  const rows =
    table?.dynamicRows && neededRows > currentRows.length
      ? [
          ...currentRows,
          ...Array.from({ length: neededRows - currentRows.length }, () =>
            createEmptyRow(experiment, tableId),
          ),
        ].slice(0, table.maxRows ?? neededRows)
      : currentRows;

  return {
    ...state,
    [tableId]: rows.map((row, rowIndex) => {
      const pastedRow = values[rowIndex - startRowIndex];
      if (!pastedRow) {
        return row;
      }

      return row.map((cell, columnIndex) => {
        const pastedValue = pastedRow[columnIndex - startColumnIndex];
        return columnIndex >= startColumnIndex &&
          columnIndex < columnCount &&
          pastedValue !== undefined
          ? pastedValue
          : cell;
      });
    }),
  };
}

function formatComputedValue(
  value: ComputedValue | undefined,
  significantDigits: number,
): string {
  if (typeof value === "string") {
    return value;
  }

  return formatToSignificantFigures(value ?? null, significantDigits);
}

function createComputedValueFormatter(significantDigits: number) {
  return (value: ComputedValue | undefined) =>
    formatComputedValue(value, significantDigits);
}

function validateInputTable(
  table: InputDefinition,
  rows: string[][],
): { globalWarnings: string[]; cellWarnings: string[][][] } {
  const globalWarnings: string[] = [];
  const cellWarnings = rows.map((row) => row.map(() => ""));
  let filledRows = 0;

  rows.forEach((row, rowIndex) => {
    const rowHasValue = row.some(
      (cell, columnIndex) =>
        table.columns[columnIndex]?.inputType !== "select" && cell.trim() !== "",
    );
    if (rowHasValue) {
      filledRows += 1;
    }

    row.forEach((cell, columnIndex) => {
      const column = table.columns[columnIndex];
      const trimmed = cell.trim();

      if (trimmed === "" || column.inputType === "text" || column.inputType === "select") {
        return;
      }

      const value = Number(trimmed);
      if (!Number.isFinite(value)) {
        cellWarnings[rowIndex][columnIndex] =
          "数値として読み取れません。半角数字で入力してください。";
        return;
      }

      if (value < 0 && column.allowNegative !== true) {
        cellWarnings[rowIndex][columnIndex] =
          "負の値です。実験値として正しい場合を除き、単位や符号を確認してください。";
      }

      if (value === 0 && column.warnOnZero) {
        cellWarnings[rowIndex][columnIndex] =
          "0 が入力されています。割り算・差分・周期計算に使う値なら確認してください。";
      }
    });
  });

  const requiredRows = table.dynamicRows ? table.minRows ?? 1 : table.rowCount;

  if (table.required && filledRows < requiredRows) {
    globalWarnings.push(
      `${table.title}: ${requiredRows}行以上の入力が必要です。現在は${filledRows}行です。`,
    );
  }

  return {
    globalWarnings,
    cellWarnings: cellWarnings.map((row) =>
      row.map((warning) => (warning ? [warning] : [])),
    ),
  };
}

function buildInputWarnings(
  experiment: ExperimentDefinition,
  rawInput: RawInputState,
): { globalWarnings: string[]; cellWarnings: CellWarnings } {
  const globalWarnings: string[] = [];
  const cellWarnings: CellWarnings = {};

  experiment.inputs.forEach((table) => {
    const validation = validateInputTable(table, rawInput[table.id] ?? []);
    globalWarnings.push(...validation.globalWarnings);
    cellWarnings[table.id] = validation.cellWarnings;
  });

  return { globalWarnings, cellWarnings };
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createResultCalculatedValue(
  experiment: ExperimentDefinition,
  key: string,
  values: Record<string, ComputedValue>,
  displayValue: string,
  significantDigits: number,
  precisionSettings: PrecisionSettings,
  precisionSource: "manual" | "measurement",
): CalculatedValue | null {
  const resultDefinition = experiment.results.find((result) => result.key === key);
  const rawValue = values[key] ?? null;

  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    return null;
  }

  const valueForPrecision =
    resultDefinition?.kind === "percent" ? rawValue * 100 : rawValue;

  return createCalculatedValue({
    rawValue: valueForPrecision,
    significantDigits,
    guardDigits: precisionSettings.guardDigits,
    precisionMode: precisionSettings.precisionMode,
    displayValue,
    precisionSource,
  });
}

function collectMeasurementInputValues(
  experiment: ExperimentDefinition,
  rawInput: RawInputState,
): string[] {
  return experiment.inputs.flatMap((table) =>
    (rawInput[table.id] ?? []).flatMap((row) =>
      row.filter((cell, columnIndex) => {
        const column = table.columns[columnIndex];

        return (
          column?.inputType !== "select" &&
          column?.inputType !== "text" &&
          cell.trim() !== ""
        );
      }),
    ),
  );
}

function experimentFileStem(experiment: ExperimentDefinition): string {
  return `physics-lab-${experiment.experimentNumber}`;
}

function parseImportedInput(
  experiment: ExperimentDefinition,
  value: unknown,
): RawInputState | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const source = typeof record.input === "object" && record.input !== null
    ? (record.input as Record<string, unknown>)
    : record;
  const nextInput: RawInputState = {};

  for (const table of experiment.inputs) {
    const rows = source[table.id];
    if (
      !Array.isArray(rows) ||
      !rows.every(
        (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"),
      )
    ) {
      return null;
    }

    const minRows = table.dynamicRows ? table.minRows ?? 1 : table.rowCount;
    const maxRows = table.dynamicRows ? table.maxRows ?? table.rowCount : table.rowCount;
    const rowCount = Math.min(Math.max(rows.length, minRows), maxRows);
    nextInput[table.id] = Array.from({ length: rowCount }, (_unused, rowIndex) => {
      const importedRow = rows[rowIndex] ?? [];
      const fallbackRow = createEmptyRow(experiment, table.id);
      return table.columns.map(
        (_column, columnIndex) => importedRow[columnIndex] ?? fallbackRow[columnIndex] ?? "",
      );
    });
  }

  return nextInput;
}

export function ExperimentRunner({ slug }: ExperimentRunnerProps) {
  const experiment = experiments.find(
    (item) => item.slug === slug || item.legacySlugs?.includes(slug),
  );

  if (!experiment) {
    return (
      <main className="min-h-screen px-3 py-4 sm:px-5 lg:px-8">
        <div className="mx-auto max-w-3xl border border-rule bg-white p-4">
          <Link href="/" className="text-sm font-semibold text-accent">
            実験一覧へ戻る
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-ink">
            実験が見つかりません
          </h1>
        </div>
      </main>
    );
  }

  return <ExperimentWorkspace experiment={experiment} />;
}

function ExperimentWorkspace({
  experiment,
}: {
  experiment: ExperimentDefinition;
}) {
  const { rawInput, setRawInput, resetInput } =
    usePersistedExperimentInput(experiment);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const outputDigitsStorageKey = useMemo(
    () => `physics-lab:${experiment.id}:output-significant-digits`,
    [experiment.id],
  );
  const precisionSettingsStorageKey = useMemo(
    () => `physics-lab:${experiment.id}:precision-settings`,
    [experiment.id],
  );
  const [outputSignificantDigits, setOutputSignificantDigits] = useState(
    DEFAULT_OUTPUT_SIGNIFICANT_DIGITS,
  );
  const [precisionSettings, setPrecisionSettings] = useState<PrecisionSettings>(
    DEFAULT_PRECISION_SETTINGS,
  );
  const [loadedOutputDigitsKey, setLoadedOutputDigitsKey] = useState<
    string | null
  >(null);
  const [loadedPrecisionSettingsKey, setLoadedPrecisionSettingsKey] = useState<
    string | null
  >(null);

  const calculation = useMemo(
    () => experiment.calculate(rawInput),
    [experiment, rawInput],
  );
  const inputWarnings = useMemo(
    () => buildInputWarnings(experiment, rawInput),
    [experiment, rawInput],
  );
  const reviewWarnings = [
    ...inputWarnings.globalWarnings,
    ...(calculation.warnings ?? []),
  ];
  const cautionMessages =
    experiment.warnings && experiment.warnings.length > 0
      ? Array.from(new Set(experiment.warnings))
      : [DEFAULT_USAGE_CAUTION];
  const estimatedPrecision = useMemo(
    () =>
      estimatePrecisionFromMeasurements(
        collectMeasurementInputValues(experiment, rawInput),
      ),
    [experiment, rawInput],
  );
  const effectiveOutputSignificantDigits =
    precisionSettings.precisionMode === "full"
      ? outputSignificantDigits
      : estimatedPrecision.significantDigits;
  const intermediateSignificantDigits =
    precisionSettings.precisionMode === "full"
      ? outputSignificantDigits + 1
      : estimatedPrecision.significantDigits + precisionSettings.guardDigits;
  const formatIntermediateValue = createComputedValueFormatter(
    intermediateSignificantDigits,
  );
  const formatCsvComputedValue = (value: ComputedValue | undefined) =>
    value === null || value === undefined ? "" : formatIntermediateValue(value);

  const formatValue = (key: string) =>
    formatResultValue(
      experiment,
      key,
      calculation.values,
      effectiveOutputSignificantDigits,
    );

  const exportJson = () => {
    downloadText(
      `${experimentFileStem(experiment)}.json`,
      JSON.stringify(
        {
          experimentId: experiment.id,
          experimentNumber: experiment.experimentNumber,
          seriesNumber: experiment.seriesNumber,
          experimentIndex: experiment.experimentIndex,
          exportedAt: new Date().toISOString(),
          input: rawInput,
          values: calculation.values,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  };

  const importJson = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = parseImportedInput(experiment, parsed);
      if (imported !== null) {
        setRawInput(imported);
      }
    } catch {
      // 壊れたJSONは読み込まず、現在の入力を保持する。
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    setLoadedOutputDigitsKey(null);
    try {
      const stored = window.localStorage.getItem(outputDigitsStorageKey);
      setOutputSignificantDigits(clampOutputSignificantDigits(stored));
    } catch {
      setOutputSignificantDigits(DEFAULT_OUTPUT_SIGNIFICANT_DIGITS);
    } finally {
      setLoadedOutputDigitsKey(outputDigitsStorageKey);
    }
  }, [outputDigitsStorageKey]);

  useEffect(() => {
    if (loadedOutputDigitsKey !== outputDigitsStorageKey) {
      return;
    }

    try {
      window.localStorage.setItem(
        outputDigitsStorageKey,
        String(outputSignificantDigits),
      );
    } catch {
      // 保存に失敗しても、計算と表示は続ける。
    }
  }, [
    loadedOutputDigitsKey,
    outputDigitsStorageKey,
    outputSignificantDigits,
  ]);

  useEffect(() => {
    setLoadedPrecisionSettingsKey(null);
    try {
      const stored = window.localStorage.getItem(precisionSettingsStorageKey);
      setPrecisionSettings(parsePrecisionSettings(stored));
    } catch {
      setPrecisionSettings(DEFAULT_PRECISION_SETTINGS);
    } finally {
      setLoadedPrecisionSettingsKey(precisionSettingsStorageKey);
    }
  }, [precisionSettingsStorageKey]);

  useEffect(() => {
    if (loadedPrecisionSettingsKey !== precisionSettingsStorageKey) {
      return;
    }

    try {
      window.localStorage.setItem(
        precisionSettingsStorageKey,
        JSON.stringify(precisionSettings),
      );
    } catch {
      // 保存に失敗しても、計算と表示は続ける。
    }
  }, [
    loadedPrecisionSettingsKey,
    precisionSettings,
    precisionSettingsStorageKey,
  ]);

  return (
    <main className="min-h-screen px-3 py-5 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="border border-rule bg-white px-4 py-3">
          <Link
            href="/"
            className="text-sm font-semibold text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            実験一覧へ戻る
          </Link>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                {experiment.experimentNumber}
              </p>
              <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                {experiment.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                {experiment.description}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                左側の表に測定値を入力すると、右側に入力確認・計算結果・グラフが更新されます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {experiment.exportCsv ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `${experimentFileStem(experiment)}.csv`,
                      experiment.exportCsv?.({
                        input: rawInput,
                        calculation,
                        formatValue,
                        formatComputedValue: formatCsvComputedValue,
                      }) ?? "",
                    )
                  }
                  className="border border-accent bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  CSV出力
                </button>
              ) : null}
              <button
                type="button"
                onClick={exportJson}
                className="border border-rule bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              >
                JSON出力
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="border border-rule bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              >
                JSON読込
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void importJson(event.target.files?.[0]);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={resetInput}
                className="border border-rule bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              >
                入力をリセット
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0 space-y-4">
            {experiment.inputs.map((table) => (
              <MeasurementTable
                key={table.id}
                tableId={table.id}
                title={table.title}
                description={table.description}
                columnDefinitions={table.columns}
                columns={table.columns.map((column) =>
                  column.unit ? `${column.label} [${column.unit}]` : column.label,
                )}
                computedColumns={table.computedColumns?.map((column) => column.label)}
                rows={(rawInput[table.id] ?? []).map((row, rowIndex) => ({
                  label: table.rowLabel
                    ? `${table.rowLabel} ${rowIndex + 1}`
                    : `${rowIndex + 1}`,
                  values: row,
                  warnings: inputWarnings.cellWarnings[table.id]?.[rowIndex],
                  computedValues: table.computedColumns?.map((column) =>
                    formatIntermediateValue(
                      calculation.computedTables?.[table.id]?.[rowIndex]?.[
                        column.key
                      ],
                    ),
                  ),
                }))}
                onChange={(rowIndex, columnIndex, value) =>
                  setRawInput((current) =>
                    updateCell(current, table.id, rowIndex, columnIndex, value),
                  )
                }
                onPasteCells={(rowIndex, columnIndex, values) =>
                  setRawInput((current) =>
                    updateCells(
                      experiment,
                      current,
                      table.id,
                      rowIndex,
                      columnIndex,
                      values,
                    ),
                  )
                }
                onAddRow={
                  table.dynamicRows && table.rowCountMode !== "select"
                    ? () =>
                        setRawInput((current) =>
                          addRow(experiment, current, table.id),
                        )
                    : undefined
                }
                onDeleteRow={
                  table.dynamicRows && table.rowCountMode !== "select"
                    ? (rowIndex) =>
                        setRawInput((current) =>
                          deleteRow(experiment, current, table.id, rowIndex),
                        )
                    : undefined
                }
                rowCountOptions={
                  table.dynamicRows && table.rowCountMode === "select"
                    ? Array.from(
                        {
                          length:
                            (table.maxRows ?? table.rowCount) -
                            (table.minRows ?? 1) +
                            1,
                        },
                        (_unused, index) => (table.minRows ?? 1) + index,
                      )
                    : undefined
                }
                onRowCountChange={
                  table.dynamicRows && table.rowCountMode === "select"
                    ? (rowCount) =>
                        setRawInput((current) =>
                          resizeRows(experiment, current, table.id, rowCount),
                        )
                    : undefined
                }
              />
            ))}
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <section
              aria-label="利用上の注意"
              className="border border-rule bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {cautionMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </section>

            {reviewWarnings.length > 0 ? (
              <section
                aria-live="polite"
                className="border border-rule bg-white p-3"
              >
                <h2 className="border-b border-rule pb-2 text-base font-semibold text-ink">
                  入力確認
                </h2>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                  {Array.from(new Set(reviewWarnings)).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border border-rule bg-white p-3">
              <h2 className="border-b border-rule pb-2 text-base font-semibold text-ink">
                計算精度設定
              </h2>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <fieldset className="space-y-2">
                  <legend className="font-semibold text-slate-700">
                    計算精度モード
                  </legend>
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="precision-mode"
                      value="guarded"
                      checked={precisionSettings.precisionMode === "guarded"}
                      onChange={() =>
                        setPrecisionSettings((current) => ({
                          ...current,
                          precisionMode: "guarded",
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      標準モード
                      <span className="block text-xs leading-5 text-slate-600">
                        測定値の桁数から表示桁を推定し、中間保持値はguard digit込みで表示します。
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="precision-mode"
                      value="full"
                      checked={precisionSettings.precisionMode === "full"}
                      onChange={() =>
                        setPrecisionSettings((current) => ({
                          ...current,
                          precisionMode: "full",
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      完全精度モード
                      <span className="block text-xs leading-5 text-slate-600">
                        最終表示時のみ、ユーザー指定の全体有効数字で丸めます。
                      </span>
                    </span>
                  </label>
                </fieldset>

                {shouldShowGlobalSignificantDigits(
                  precisionSettings.precisionMode,
                ) ? (
                  <label className="flex items-center justify-between gap-3 border-t border-rule pt-3">
                    <span className="font-semibold">全体の表示有効数字</span>
                    <select
                      value={outputSignificantDigits}
                      onChange={(event) =>
                        setOutputSignificantDigits(
                          clampOutputSignificantDigits(event.target.value),
                        )
                      }
                      className="border border-rule bg-white px-2 py-1 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      {Array.from(
                        {
                          length:
                            MAX_OUTPUT_SIGNIFICANT_DIGITS -
                            MIN_OUTPUT_SIGNIFICANT_DIGITS +
                            1,
                        },
                        (_unused, index) =>
                          MIN_OUTPUT_SIGNIFICANT_DIGITS + index,
                      ).map((digits) => (
                        <option key={digits} value={digits}>
                          {digits}桁
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="space-y-2 border-t border-rule pt-3">
                    <label className="flex items-center justify-between gap-3">
                      <span className="font-semibold">guard digit</span>
                      <select
                        value={precisionSettings.guardDigits}
                        onChange={(event) =>
                          setPrecisionSettings((current) => ({
                            ...current,
                            guardDigits: clampGuardDigits(event.target.value),
                          }))
                        }
                        className="border border-rule bg-white px-2 py-1 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        {Array.from(
                          { length: MAX_GUARD_DIGITS - MIN_GUARD_DIGITS + 1 },
                          (_unused, index) => MIN_GUARD_DIGITS + index,
                        ).map((digits) => (
                          <option key={digits} value={digits}>
                            {digits}桁
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs leading-5 text-slate-600">
                      推定有効桁数: {estimatedPrecision.significantDigits}桁
                    </p>
                  </div>
                )}

                <div className="grid gap-2 border-t border-rule pt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={precisionSettings.showRawValue}
                      onChange={(event) =>
                        setPrecisionSettings((current) => ({
                          ...current,
                          showRawValue: event.target.checked,
                        }))
                      }
                    />
                    rawValueを表示
                  </label>
                  {precisionSettings.precisionMode === "guarded" ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={precisionSettings.showWorkingValue}
                        onChange={(event) =>
                          setPrecisionSettings((current) => ({
                            ...current,
                            showWorkingValue: event.target.checked,
                          }))
                        }
                      />
                      中間保持値を表示
                    </label>
                  ) : null}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={precisionSettings.showHiddenDigits}
                      onChange={(event) =>
                        setPrecisionSettings((current) => ({
                          ...current,
                          showHiddenDigits: event.target.checked,
                        }))
                      }
                    />
                    非表示桁を表示
                  </label>
                  {precisionSettings.precisionMode === "guarded" ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={precisionSettings.showPrecisionWarnings}
                        onChange={(event) =>
                          setPrecisionSettings((current) => ({
                            ...current,
                            showPrecisionWarnings: event.target.checked,
                          }))
                        }
                      />
                      桁落ち警告を表示
                    </label>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="border border-rule bg-white p-3">
              <h2 className="border-b border-rule pb-2 text-base font-semibold text-ink">
                計算結果
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {precisionSettings.precisionMode === "full"
                  ? "完全精度モードではrawValueを保持し、最終表示時のみ指定した有効数字と誤差桁に合わせて丸めています。"
                  : "標準モードでは測定値の桁数から表示桁を推定し、表の中間値は推定有効桁数にguard digitを加えて表示します。"}
                レポートへ転記する前に、実験書の指定単位と丸め規則を確認してください。
              </p>
              <div className="mt-3 grid gap-0 border-t border-rule">
                {experiment.results.map((result) => {
                  const value = formatValue(result.key);
                  const calculatedValue = createResultCalculatedValue(
                    experiment,
                    result.key,
                    calculation.values,
                    value,
                    effectiveOutputSignificantDigits,
                    precisionSettings,
                    precisionSettings.precisionMode === "full"
                      ? "manual"
                      : "measurement",
                  );
                  const workingDigits =
                    effectiveOutputSignificantDigits + precisionSettings.guardDigits;
                  const precisionUnit =
                    result.kind === "percent" ? "%" : result.unit;
                  const precisionWarnings =
                    precisionSettings.precisionMode === "guarded" &&
                    precisionSettings.showPrecisionWarnings
                      ? [
                          ...(estimatedPrecision.warnings ?? []),
                          ...(calculatedValue?.warnings ?? []),
                        ]
                      : [];
                  return (
                    <ResultCard
                      key={result.key}
                      label={result.label}
                      value={value}
                      priority={result.priority}
                      copyText={`${result.label},${value}`}
                      rawValue={
                        precisionSettings.showRawValue && calculatedValue
                          ? withUnit(String(calculatedValue.rawValue), precisionUnit)
                          : undefined
                      }
                      workingValue={
                        precisionSettings.precisionMode === "guarded" &&
                        precisionSettings.showWorkingValue &&
                        calculatedValue
                          ? withUnit(
                              formatToSignificantFigures(
                                calculatedValue.workingValue,
                                workingDigits,
                              ),
                              precisionUnit,
                            )
                          : undefined
                      }
                      hiddenDigits={
                        precisionSettings.showHiddenDigits &&
                        calculatedValue?.hiddenDigits !== undefined
                          ? String(calculatedValue.hiddenDigits)
                          : undefined
                      }
                      significantDigits={
                        precisionSettings.precisionMode === "guarded" &&
                        calculatedValue?.significantDigits !== undefined
                          ? `${calculatedValue.significantDigits}桁`
                          : undefined
                      }
                      roundingReason={calculatedValue?.roundingReason}
                      precisionWarnings={precisionWarnings}
                      formula={
                        result.formula ? (
                          <MathFormula inline formula={result.formula} />
                        ) : null
                      }
                      detail={result.detail}
                    />
                  );
                })}
              </div>
            </section>

            {experiment.graphDefinitions && experiment.graphDefinitions.length > 0 ? (
              <section className="border border-rule bg-white p-3">
                <h2 className="border-b border-rule pb-2 text-base font-semibold text-ink">
                  グラフ
                </h2>
                <div className="mt-3 space-y-3">
                  {experiment.graphDefinitions.map((graph) => (
                    <GraphCard
                      key={graph.id}
                      definition={graph}
                      data={calculation.graphs?.[graph.id]}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border border-rule bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="border-b border-rule pb-2 text-base font-semibold text-ink dark:text-slate-50">
                使用した式
              </h2>
              <div className="mt-3 space-y-2">
                {experiment.formulas.map((formula, index) => (
                  <FormulaCard
                    key={`${formula.label}-${formula.expression}`}
                    formula={formula}
                    index={index}
                  />
                ))}
              </div>
            </section>

            {experiment.note ? (
              <section className="border border-rule bg-white p-3">
                <h2 className="text-base font-semibold text-ink">拡張メモ</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {experiment.note}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
