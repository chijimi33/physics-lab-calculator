"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExperimentDefinition, RawInputState } from "@/src/experiments";

function createInitialState(experiment: ExperimentDefinition): RawInputState {
  return Object.fromEntries(
    experiment.inputs.map((table) => [
      table.id,
      Array.from({ length: table.rowCount }, () =>
        table.columns.map((column) => column.options?.[0]?.value ?? ""),
      ),
    ]),
  );
}

function isStringMatrix(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"),
    )
  );
}

function normalizeStoredState(
  experiment: ExperimentDefinition,
  value: unknown,
): RawInputState | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const initial = createInitialState(experiment);

  for (const table of experiment.inputs) {
    const storedRows = record[table.id];
    const hasStoredRows = isStringMatrix(storedRows);
    const usableStoredRows = hasStoredRows ? storedRows : [];

    const rowCount = table.dynamicRows
      ? hasStoredRows
        ? Math.min(
            Math.max(usableStoredRows.length, table.minRows ?? 1),
            table.maxRows ?? Number.POSITIVE_INFINITY,
          )
        : table.rowCount
      : table.rowCount;

    initial[table.id] = Array.from({ length: rowCount }, (_unused, rowIndex) =>
      (initial[table.id][0] ?? table.columns.map(() => "")).map(
        (_cell, columnIndex) =>
          usableStoredRows[rowIndex]?.[columnIndex] ??
          table.columns[columnIndex]?.options?.[0]?.value ??
          "",
      ),
    );
  }

  return initial;
}

export function createEmptyRow(experiment: ExperimentDefinition, tableId: string): string[] {
  const table = experiment.inputs.find((input) => input.id === tableId);
  return table?.columns.map((column) => column.options?.[0]?.value ?? "") ?? [];
}

export function getInitialExperimentInput(
  experiment: ExperimentDefinition,
): RawInputState {
  return createInitialState(experiment);
}

export function usePersistedExperimentInput(experiment: ExperimentDefinition) {
  const storageKey = useMemo(
    () => `physics-lab:${experiment.id}:input`,
    [experiment.id],
  );
  const [rawInput, setRawInput] = useState<RawInputState>(() =>
    createInitialState(experiment),
  );
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    setLoadedStorageKey(null);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) {
        const normalized = normalizeStoredState(experiment, JSON.parse(stored));
        setRawInput(normalized ?? createInitialState(experiment));
      } else {
        setRawInput(createInitialState(experiment));
      }
    } catch {
      setRawInput(createInitialState(experiment));
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [experiment, storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(rawInput));
  }, [loadedStorageKey, rawInput, storageKey]);

  function resetInput() {
    const initial = createInitialState(experiment);
    setRawInput(initial);
    window.localStorage.removeItem(storageKey);
  }

  return {
    rawInput,
    setRawInput,
    resetInput,
    storageKey,
  };
}
