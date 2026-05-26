"use client";

import type { ClipboardEvent, KeyboardEvent } from "react";
import type { InputColumnDefinition } from "@/src/experiments";

type MeasurementTableProps = {
  tableId: string;
  title: string;
  description?: string;
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
  description,
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
  const editableColumnCount = columnDefinitions?.length ?? columns.length;
  const tableColumnCount =
    columns.length + renderedComputedColumns.length + (onDeleteRow ? 2 : 1);
  const tableMinWidth = Math.max(560, tableColumnCount * 132);

  const focusCell = (rowIndex: number, columnIndex: number): boolean => {
    const selector = `[data-table-id="${tableId}"][data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`;
    const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
    if (!element) {
      return false;
    }

    element.focus();
    if (element instanceof HTMLInputElement) {
      element.select();
    }

    return true;
  };

  const focusCellOrCreateRow = (rowIndex: number, columnIndex: number) => {
    if (focusCell(rowIndex, columnIndex)) {
      return;
    }

    if (rowIndex === rows.length && onAddRow) {
      onAddRow();
      window.requestAnimationFrame(() => focusCell(rowIndex, columnIndex));
    }
  };

  const moveByOffset = (
    rowIndex: number,
    columnIndex: number,
    rowOffset: number,
    columnOffset: number,
  ) => {
    const nextColumnIndex = columnIndex + columnOffset;
    if (nextColumnIndex < 0 || nextColumnIndex >= editableColumnCount) {
      return;
    }

    const nextRowIndex = rowIndex + rowOffset;
    if (nextRowIndex < 0) {
      return;
    }

    focusCellOrCreateRow(nextRowIndex, nextColumnIndex);
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    columnIndex: number,
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      moveByOffset(rowIndex, columnIndex, event.shiftKey ? -1 : 1, 0);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      moveByOffset(rowIndex, columnIndex, event.key === "ArrowUp" ? -1 : 1, 0);
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    if (event.currentTarget instanceof HTMLInputElement) {
      const selectionStart = event.currentTarget.selectionStart ?? 0;
      const selectionEnd = event.currentTarget.selectionEnd ?? 0;
      const hasSelection = selectionStart !== selectionEnd;
      const isAtStart = selectionStart === 0 && selectionEnd === 0;
      const isAtEnd =
        selectionStart === event.currentTarget.value.length &&
        selectionEnd === event.currentTarget.value.length;

      if (
        hasSelection ||
        (event.key === "ArrowLeft" && !isAtStart) ||
        (event.key === "ArrowRight" && !isAtEnd)
      ) {
        return;
      }
    }

    event.preventDefault();
    moveByOffset(rowIndex, columnIndex, 0, event.key === "ArrowLeft" ? -1 : 1);
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
    <section className="min-w-0 overflow-hidden border border-rule bg-white">
      <div className="flex flex-col gap-2 border-b border-rule bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {rowCountOptions && onRowCountChange ? (
          <label className="flex w-fit items-center gap-2 text-sm font-semibold text-slate-700">
            行数
            <select
              value={rows.length}
              onChange={(event) => onRowCountChange(Number(event.target.value))}
              className="border border-rule bg-white px-2 py-1 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
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
            className="w-fit border border-rule bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          >
            行を追加
          </button>
        ) : null}
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: tableMinWidth }}
        >
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 text-left text-slate-700">
              <th className="sticky left-0 z-30 w-24 border-b border-rule bg-slate-50 px-3 py-2">
                No.
              </th>
              {columns.map((column) => (
                <th key={column} className="border-b border-rule bg-slate-50 px-3 py-2">
                  {column}
                </th>
              ))}
              {renderedComputedColumns.map((column) => (
                <th key={column} className="border-b border-rule bg-slate-50 px-3 py-2">
                  {column}
                </th>
              ))}
              {onDeleteRow ? (
                <th className="w-20 border-b border-rule bg-slate-50 px-3 py-2">
                  操作
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className="odd:bg-white even:bg-gray-50">
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
                        aria-label={`${title} ${row.label} ${columns[columnIndex]}`}
                        value={value}
                        onChange={(event) =>
                          onChange(rowIndex, columnIndex, event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, rowIndex, columnIndex)
                        }
                        className="w-full min-w-28 border border-rule bg-white px-2 py-1.5 text-[15px] outline-none transition focus:border-accent focus:ring-1 focus:ring-accent focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
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
                        aria-label={`${title} ${row.label} ${columns[columnIndex]}`}
                        type="text"
                        placeholder={columnDefinitions?.[columnIndex]?.placeholder}
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
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, rowIndex, columnIndex)
                        }
                        className="w-full min-w-28 border border-rule bg-white px-2 py-1.5 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-1 focus:ring-accent focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                      />
                    )}
                    {row.warnings?.[columnIndex]?.map((warning) => (
                      <p
                        key={warning}
                        aria-live="polite"
                        className="mt-1 text-xs leading-5 text-slate-600"
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
                      className="border border-rule px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
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
