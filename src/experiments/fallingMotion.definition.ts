import type {
  CalculationResult,
  CsvExportContext,
  ExperimentDefinition,
  RawInputState,
} from "./types";
import { calculateFallingMotion } from "./fallingMotion";
import { units } from "@/src/lib/physics/units";

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map(csvEscape).join(",");
}

function valueFromComputed(
  calculation: CalculationResult,
  tableId: string,
  rowIndex: number,
  key: string,
) {
  return calculation.computedTables?.[tableId]?.[rowIndex]?.[key] ?? null;
}

function exportFallingMotionCsv({
  input,
  calculation,
  formatValue,
  formatComputedValue,
}: CsvExportContext): string {
  const rows: string[] = [
    csvRow(["1-2 実験", "落下の実験"]),
    "",
    csvRow(["Free fall"]),
    csvRow(["No.", "t [s]", "x", "unit", "v [m/s]", "a [m/s^2]", "g_n [m/s^2]"]),
  ];

  (input.freeFall ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        row[2] ?? "",
        formatComputedValue(valueFromComputed(calculation, "freeFall", index, "v")),
        formatComputedValue(valueFromComputed(calculation, "freeFall", index, "a")),
        formatComputedValue(valueFromComputed(calculation, "freeFall", index, "g")),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Resisted fall"]),
    csvRow(["No.", "t [s]", "x", "unit", "note", "v [m/s]", "a [m/s^2]"]),
  );

  (input.resisted ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        row[2] ?? "",
        row[3] ?? "",
        formatComputedValue(valueFromComputed(calculation, "resisted", index, "v")),
        formatComputedValue(valueFromComputed(calculation, "resisted", index, "a")),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Results"]),
    csvRow(["Label", "Value"]),
    csvRow(["g average", formatValue("gravityAverage")]),
    csvRow(["g standard error", formatValue("gravityStandardError")]),
    csvRow(["g by linear regression", formatValue("gravityRegression")]),
    csvRow(["max velocity with resistance", formatValue("maxResistanceVelocity")]),
    csvRow(["terminal velocity estimate", formatValue("terminalVelocityEstimate")]),
  );

  return rows.join("\n");
}

export const fallingMotionExperiment: ExperimentDefinition = {
  id: "falling-motion",
  number: 2,
  displayNumber: "1-2",
  slug: "falling-motion",
  title: "落下の実験",
  description:
    "位置 x と時刻 t の測定値から速度、加速度、重力加速度を求めます。",
  status: "beta",
  tags: ["力学", "有限差分", "回帰"],
  lastUpdated: "2026-05-18",
  csvExportDefinition: { enabled: true, filenamePrefix: "falling-motion" },
  warnings: [
    "このツールは計算補助用です。提出前に、実験書・授業担当者の指示・自分の計算と照合してください。",
  ],
  inputs: [
    {
      id: "freeFall",
      title: "1. 自由落下",
      description: "時刻 t と位置 x を入力します。位置は選択した単位から内部で m に変換して計算します。",
      rowCount: 8,
      minRows: 2,
      maxRows: 20,
      dynamicRows: true,
      rowCountMode: "select",
      rowLabel: "点",
      required: true,
      columns: [
        {
          key: "t",
          label: "t_n",
          unit: "s",
          placeholder: "例 0.20",
          allowNegative: false,
        },
        {
          key: "x",
          label: "x_n",
          placeholder: "例 19.6",
          allowNegative: false,
        },
        {
          key: "unit",
          label: "位置単位",
          inputType: "select",
          options: [
            { label: "m", value: "m" },
            { label: "cm", value: "cm" },
            { label: "mm", value: "mm" },
          ],
        },
      ],
      computedColumns: [
        { key: "v", label: "v_n [m/s]" },
        { key: "a", label: "a_n [m/s^2]" },
        { key: "g", label: "g_n [m/s^2]" },
      ],
    },
    {
      id: "resisted",
      title: "2. 抵抗がある場合の落下",
      description: "抵抗を受ける落下の時刻 t と位置 x を入力します。条件メモには物体や媒質の違いを書けます。",
      rowCount: 8,
      minRows: 2,
      maxRows: 20,
      dynamicRows: true,
      rowCountMode: "select",
      rowLabel: "点",
      columns: [
        {
          key: "t",
          label: "t_n",
          unit: "s",
          placeholder: "例 0.20",
          allowNegative: false,
        },
        {
          key: "x",
          label: "x_n",
          placeholder: "例 19.6",
          allowNegative: false,
        },
        {
          key: "unit",
          label: "位置単位",
          inputType: "select",
          options: [
            { label: "m", value: "m" },
            { label: "cm", value: "cm" },
            { label: "mm", value: "mm" },
          ],
        },
        {
          key: "note",
          label: "条件メモ",
          placeholder: "例 小球・空気中",
          inputType: "text",
          allowNegative: true,
        },
      ],
      computedColumns: [
        { key: "v", label: "v_n [m/s]" },
        { key: "a", label: "a_n [m/s^2]" },
      ],
    },
  ],
  results: [
    {
      key: "gravityAverage",
      label: "g の平均値",
      priority: "primary",
      unit: units.acceleration,
      formula: "g_n = \\frac{2x_n}{t_n^2}",
      detail: "t = 0 の点は除外",
    },
    {
      key: "gravityStandardError",
      label: "g の標準誤差",
      unit: units.acceleration,
    },
    {
      key: "gravityRegression",
      label: "線形回帰による g",
      priority: "primary",
      unit: units.acceleration,
      formula: "x = A t^2,\\quad g = 2A",
      detail: "自由落下 t^2-x グラフの回帰直線に対応",
    },
    {
      key: "maxResistanceVelocity",
      label: "抵抗ありの最大速度",
      unit: units.velocity,
    },
    {
      key: "terminalVelocityEstimate",
      label: "終端速度の推定値",
      unit: units.velocity,
      detail: "最後の最大3点の速度平均",
    },
  ],
  formulas: [
    {
      label: "自由落下の位置",
      expression: "x(t) = \\frac{1}{2}gt^2",
    },
    {
      label: "自由落下の速度",
      expression: "v(t) = \\frac{dx}{dt} = gt",
    },
    {
      label: "自由落下の加速度",
      expression: "a(t) = \\frac{dv}{dt} = g",
    },
    {
      label: "速度差分",
      expression: "v_n = \\frac{x_{n+1} - x_{n-1}}{t_{n+1} - t_{n-1}}",
      description: "端点では前進差分または後退差分を使います。",
    },
    {
      label: "加速度差分",
      expression: "a_n = \\frac{v_{n+1} - v_{n-1}}{t_{n+1} - t_{n-1}}",
      description: "速度の差分から加速度を求めます。",
    },
    {
      label: "各点での g 推定",
      expression: "g_n = \\frac{2x_n}{t_n^2}",
      description: "t = 0 の点は計算から除外します。",
    },
    {
      label: "線形回帰による g 推定",
      expression: "x = A t^2,\\quad g = 2A",
    },
    {
      label: "速度比例抵抗",
      expression: "R = kv",
    },
    {
      label: "速度比例抵抗の運動方程式",
      expression: "ma = mg - kv",
    },
    {
      label: "速度比例抵抗の終端速度",
      expression: "v_t = \\frac{mg}{k}",
    },
    {
      label: "速度比例抵抗の速度",
      expression: "v(t) = v_t \\left(1 - e^{-t/\\tau}\\right)",
    },
    {
      label: "二乗比例抵抗",
      expression: "R = Kv^2",
    },
    {
      label: "二乗比例抵抗の終端速度",
      expression: "v_t = \\sqrt{\\frac{mg}{K}}",
    },
  ],
  graphDefinitions: [
    {
      id: "freefall-t-x",
      title: "自由落下 t-x",
      description: "入力した時刻と位置の対応を確認します。外れ値や単位の取り違えを見つけるためのグラフです。",
      kind: "scatter",
      xLabel: "t",
      yLabel: "x",
      xUnit: units.second,
      yUnit: units.meter,
      series: [{ key: "points", label: "測定点" }],
    },
    {
      id: "freefall-t-v",
      title: "自由落下 t-v",
      description: "位置データから有限差分で求めた速度を表示します。",
      kind: "line",
      xLabel: "t",
      yLabel: "v",
      xUnit: units.second,
      yUnit: units.velocity,
      series: [{ key: "points", label: "速度" }],
    },
    {
      id: "freefall-t-a",
      title: "自由落下 t-a",
      description: "速度データから有限差分で求めた加速度を表示します。",
      kind: "line",
      xLabel: "t",
      yLabel: "a",
      xUnit: units.second,
      yUnit: units.acceleration,
      series: [{ key: "points", label: "加速度" }],
    },
    {
      id: "freefall-t2-x",
      title: "自由落下 t^2-x",
      description: "測定点と x = A t^2 の回帰直線を重ねています。傾き A から g = 2A を求めます。",
      kind: "scatter",
      xLabel: "t^2",
      yLabel: "x",
      xUnit: "s^2",
      yUnit: units.meter,
      series: [
        { key: "points", label: "測定点" },
        { key: "regression", label: "回帰直線", kind: "regression" },
      ],
    },
    {
      id: "resisted-t-x",
      title: "抵抗あり t-x",
      description: "抵抗ありの測定点について、時刻と位置の変化を確認します。",
      kind: "scatter",
      xLabel: "t",
      yLabel: "x",
      xUnit: units.second,
      yUnit: units.meter,
      series: [{ key: "points", label: "測定点" }],
    },
    {
      id: "resisted-t-v",
      title: "抵抗あり t-v",
      description: "速度が一定値へ近づく傾向を確認します。",
      kind: "line",
      xLabel: "t",
      yLabel: "v",
      xUnit: units.second,
      yUnit: units.velocity,
      series: [{ key: "points", label: "速度" }],
    },
    {
      id: "resisted-t-a",
      title: "抵抗あり t-a",
      description: "速度変化から求めた加速度を確認します。",
      kind: "line",
      xLabel: "t",
      yLabel: "a",
      xUnit: units.second,
      yUnit: units.acceleration,
      series: [{ key: "points", label: "加速度" }],
    },
  ],
  note:
    "計算内部では丸めず、表示時のみ有効数字に合わせて丸めています。位置は内部で m に変換して計算します。レポートへ転記する前に、実験書の指定単位、丸め規則、差分計算の扱いを確認してください。",
  calculate(input: RawInputState) {
    const result = calculateFallingMotion({
      freeFall: input.freeFall ?? [],
      resisted: input.resisted ?? [],
    });

    return {
      values: {
        gravityAverage: result.gravityAverage,
        gravityStandardError: result.gravityStandardError,
        gravityRegression: result.gravityRegression,
        maxResistanceVelocity: result.maxResistanceVelocity,
        terminalVelocityEstimate: result.terminalVelocityEstimate,
      },
      computedTables: {
        freeFall: (input.freeFall ?? []).map((_row, index) => ({
          v: result.freeFallVelocities[index] ?? null,
          a: result.freeFallAccelerations[index] ?? null,
          g: result.freeFallGravityValues[index] ?? null,
        })),
        resisted: (input.resisted ?? []).map((_row, index) => ({
          v: result.resistedVelocities[index] ?? null,
          a: result.resistedAccelerations[index] ?? null,
        })),
      },
      graphs: {
        "freefall-t-x": {
          points: result.freeFallPoints.flatMap((point) =>
            point === null ? [] : [{ x: point.t, y: point.xMeters }],
          ),
        },
        "freefall-t-v": {
          points: result.freeFallPoints.flatMap((point, index) =>
            point === null || result.freeFallVelocities[index] === null
              ? []
              : [{ x: point.t, y: result.freeFallVelocities[index] }],
          ),
        },
        "freefall-t-a": {
          points: result.freeFallPoints.flatMap((point, index) =>
            point === null || result.freeFallAccelerations[index] === null
              ? []
              : [{ x: point.t, y: result.freeFallAccelerations[index] }],
          ),
        },
        "freefall-t2-x": {
          points: result.freeFallPoints.flatMap((point) =>
            point === null ? [] : [{ x: point.t ** 2, y: point.xMeters }],
          ),
          regression: result.freeFallPoints.flatMap((point) =>
            point === null || result.gravityRegression === null
              ? []
              : [{ x: point.t ** 2, y: (result.gravityRegression / 2) * point.t ** 2 }],
          ),
        },
        "resisted-t-x": {
          points: result.resistedPoints.flatMap((point) =>
            point === null ? [] : [{ x: point.t, y: point.xMeters }],
          ),
        },
        "resisted-t-v": {
          points: result.resistedPoints.flatMap((point, index) =>
            point === null || result.resistedVelocities[index] === null
              ? []
              : [{ x: point.t, y: result.resistedVelocities[index] }],
          ),
        },
        "resisted-t-a": {
          points: result.resistedPoints.flatMap((point, index) =>
            point === null || result.resistedAccelerations[index] === null
              ? []
              : [{ x: point.t, y: result.resistedAccelerations[index] }],
          ),
        },
      },
      warnings: result.warnings,
    };
  },
  exportCsv: exportFallingMotionCsv,
};
