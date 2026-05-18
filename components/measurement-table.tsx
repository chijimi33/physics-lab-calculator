"use client";

import type { ClipboardEvent } from "react";
import type { InputColumnDefinition } from "@/src/experiments";

type MeasurementTableProps = {
  tableId: string;
  title: string;
  columns: string[];
  columnDefinitions?: InputColumnDefinition[];
  rows: Array<{
    label: string;
    values: string[];
    computed?: string;
    computedValues?: string[];
    warnings?: string[][];
  }>;
  computedHeader?: string;
  computedColumns?: string[];
  onChange: (rowIndex: number, columnIndex: number, value: string) => void;
  onPasteCells?: (
    startRowIndex: number,
    startColumnIndex: number,
    values: string[][],
  ) => void;
  onAddRow?: () => void;
  onDeleteRow?: (rowIndex: number) => void;
  rowCountOptions?: number[];
  onRowCountChange?: (rowCount: number) => void;
};

export function MeasurementTable({
  tableId,
  title,
  columns,
  columnDefinitions,
  rows,
  computedHeader,
  computedColumns,
  onChange,
  onPasteCells,
  onAddRow,
  onDeleteRow,
  rowCountOptions,
  onRowCountChange,
}: MeasurementTableProps) {
  const renderedComputedColumns =
    computedColumns ?? (computedHeader ? [computedHeader] : []);

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const selector = `[data-table-id="${tableId}"][data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`;
    const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    element?.focus();
    if (element instanceof HTMLInputElement) {
      element.select();
    }
  };

  const moveToNextCell = (rowIndex: number, columnIndex: number) => {
    const nextColumn = columnIndex + 1;
    if (nextColumn < columns.length) {
      focusCell(rowIndex, nextColumn);
      return;
    }
    focusCell(rowIndex + 1, 0);
  };

  const handlePaste = (
    event: ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    columnIndex: number,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) {
      return;
    }

    event.preventDefault();
    const values = text
      .trimEnd()
      .split(/\r?\n/)
      .map((line) => line.split("\t"));
    onPasteCells?.(rowIndex, columnIndex, values);
  };

  return (
    <section className="overflow-hidden rounded border border-rule bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-stone-100 px-4 py-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {rowCountOptions && onRowCountChange ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            行数
            <select
              value={rows.length}
              onChange={(event) => onRowCountChange(Number(event.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-blue-100"
            >
              {rowCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        ) : onAddRow ? (
          <button
            type="button"
            onClick={onAddRow}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            行を追加
          </button>
        ) : null}
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="bg-stone-50 text-left text-slate-700">
              <th className="sticky left-0 z-30 w-24 border-b border-rule bg-stone-50 px-3 py-2">
                No.
              </th>
              {columns.map((column) => (
                <th key={column} className="border-b border-rule bg-stone-50 px-3 py-2">
                  {column}
                </th>
              ))}
              {renderedComputedColumns.map((column) => (
                <th key={column} className="border-b border-rule bg-stone-50 px-3 py-2">
                  {column}
                </th>
              ))}
              {onDeleteRow ? (
                <th className="w-20 border-b border-rule bg-stone-50 px-3 py-2">
                  操作
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className="odd:bg-white even:bg-stone-50">
                <th className="sticky left-0 z-10 border-b border-rule bg-inherit px-3 py-2 text-left font-semibold">
                  {row.label}
                </th>
                {row.values.map((value, columnIndex) => (
                  <td key={columnIndex} className="border-b border-rule px-3 py-2">
                    {columnDefinitions?.[columnIndex]?.inputType === "select" ? (
                      <select
                        data-table-id={tableId}
                        data-row-index={rowIndex}
                        data-column-index={columnIndex}
                        value={value}
                        onChange={(event) =>
                          onChange(rowIndex, columnIndex, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            moveToNextCell(rowIndex, columnIndex);
                          }
                        }}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-blue-100"
                      >
                        {columnDefinitions[columnIndex].options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        data-table-id={tableId}
                        data-row-index={rowIndex}
                        data-column-index={columnIndex}
                        type="text"
                        inputMode={
                          columnDefinitions?.[columnIndex]?.inputType === "text"
                            ? "text"
                            : "decimal"
                        }
                        value={value}
                        onChange={(event) =>
                          onChange(rowIndex, columnIndex, event.target.value)
                        }
                        onPaste={(event) => handlePaste(event, rowIndex, columnIndex)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            moveToNextCell(rowIndex, columnIndex);
                          }
                        }}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                    {row.warnings?.[columnIndex]?.map((warning) => (
                      <p
                        key={warning}
                        className="mt-1 text-xs leading-5 text-amber-700"
                      >
                        {warning}
                      </p>
                    ))}
                  </td>
                ))}
                {renderedComputedColumns.map((column, computedIndex) => (
                  <td
                    key={column}
                    className="border-b border-rule px-3 py-2 font-mono text-slate-800"
                  >
                    {row.computedValues?.[computedIndex] ?? row.computed ?? "-"}
                  </td>
                ))}
                {onDeleteRow ? (
                  <td className="border-b border-rule px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(rowIndex)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-red-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
