"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { experiments } from "@/experiments";
import { MeasurementTable } from "@/components/measurement-table";
import { ResultCard } from "@/components/result-card";
import { MathFormula } from "@/src/components/math/MathFormula";
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
import { withUnit } from "@/src/lib/physics/units";

type ExperimentRunnerProps = {
  slug: string;
};

type CellWarnings = Record<string, string[][][]>;

const DEFAULT_OUTPUT_SIGNIFICANT_DIGITS = 3;
const MIN_OUTPUT_SIGNIFICANT_DIGITS = 2;
const MAX_OUTPUT_SIGNIFICANT_DIGITS = 6;

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
  values: Record<string, number | null>,
  significantDigits: number,
): string {
  const resultDefinition = experiment.results.find((result) => result.key === key);
  const value = values[key] ?? null;

  if (resultDefinition?.kind === "percent") {
    return value === null
      ? "-"
      : `${formatToSignificantFigures(value * 100, significantDigits)} %`;
  }

  if (resultDefinition?.kind === "valueWithError") {
    const formatted = roundByError(
      value,
      resultDefinition.errorKey ? values[resultDefinition.errorKey] ?? null : null,
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
        cellWarnings[rowIndex][columnIndex] = "数値として読み取れません。";
        return;
      }

      if (value < 0 && column.allowNegative !== true) {
        cellWarnings[rowIndex][columnIndex] =
          "負の値です。単位や符号を確認してください。";
      }

      if (value === 0 && column.warnOnZero) {
        cellWarnings[rowIndex][columnIndex] =
          "0 です。割り算や差分に使う値なら確認してください。";
      }
    });
  });

  const requiredRows = table.dynamicRows ? table.minRows ?? 1 : table.rowCount;

  if (table.required && filledRows < requiredRows) {
    globalWarnings.push(
      `${table.title} は少なくとも ${requiredRows} 行の入力が必要です。現在 ${filledRows} 行だけ入力されています。`,
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

export function ExperimentRunner({ slug }: ExperimentRunnerProps) {
  const experiment = experiments.find((item) => item.slug === slug);

  if (!experiment) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded border border-rule bg-paper p-6 shadow-report">
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
  const outputDigitsStorageKey = useMemo(
    () => `physics-lab:${experiment.id}:output-significant-digits`,
    [experiment.id],
  );
  const [outputSignificantDigits, setOutputSignificantDigits] = useState(
    DEFAULT_OUTPUT_SIGNIFICANT_DIGITS,
  );
  const [loadedOutputDigitsKey, setLoadedOutputDigitsKey] = useState<
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
  const allWarnings = [
    ...inputWarnings.globalWarnings,
    ...(calculation.warnings ?? []),
  ];
  const intermediateSignificantDigits = outputSignificantDigits + 1;
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
      outputSignificantDigits,
    );

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

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-5 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded border border-rule bg-paper p-4 shadow-report sm:p-6">
          <Link href="/" className="text-sm font-semibold text-accent">
            実験一覧へ戻る
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-600">
                第{experiment.number}回実験
              </p>
              <h1 className="mt-2 break-words text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {experiment.title}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                表示有効数字
                <select
                  value={outputSignificantDigits}
                  onChange={(event) =>
                    setOutputSignificantDigits(
                      clampOutputSignificantDigits(event.target.value),
                    )
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from(
                    {
                      length:
                        MAX_OUTPUT_SIGNIFICANT_DIGITS -
                        MIN_OUTPUT_SIGNIFICANT_DIGITS +
                        1,
                    },
                    (_unused, index) => MIN_OUTPUT_SIGNIFICANT_DIGITS + index,
                  ).map((digits) => (
                    <option key={digits} value={digits}>
                      {digits}桁
                    </option>
                  ))}
                </select>
              </label>
              {experiment.exportCsv ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `${experiment.slug}.csv`,
                      experiment.exportCsv?.({
                        input: rawInput,
                        calculation,
                        formatValue,
                        formatComputedValue: formatCsvComputedValue,
                      }) ?? "",
                    )
                  }
                  className="rounded border border-accent bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  CSV出力
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetInput}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-600"
              >
                入力をリセット
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            {experiment.inputs.map((table) => (
              <MeasurementTable
                key={table.id}
                title={table.title}
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

          <aside className="space-y-5">
            {allWarnings.length > 0 ? (
              <section className="rounded border border-amber-300 bg-amber-50 p-4">
                <h2 className="text-lg font-bold text-amber-900">入力確認</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                  {Array.from(new Set(allWarnings)).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded border border-rule bg-stone-50 p-4">
              <h2 className="text-lg font-bold text-ink">計算結果</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                計算内部では丸めず、表示時のみ有効数字と誤差桁に合わせて丸めています。
                表の中間値は表示有効数字より1桁多く表示します。レポートへ転記する前に、実験書の指定単位と丸め規則を確認してください。
              </p>
              <div className="mt-4 grid gap-3">
                {experiment.results.map((result) => {
                  const value = formatValue(result.key);
                  return (
                    <ResultCard
                      key={result.key}
                      label={result.label}
                      value={value}
                      copyText={`${result.label},${value}`}
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

            <section className="rounded border border-rule bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-ink dark:text-slate-50">
                使用した式
              </h2>
              <div className="mt-4 space-y-3">
                {experiment.formulas.map((formula, index) => (
                  <article
                    key={`${formula.label}-${formula.expression}`}
                    className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-ink dark:text-slate-50">
                        {formula.label}
                      </h3>
                    </div>
                    <MathFormula formula={formula.expression} />
                    {formula.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {formula.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            {experiment.note ? (
              <section className="rounded border border-rule bg-white p-4">
                <h2 className="text-lg font-bold text-ink">拡張メモ</h2>
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
