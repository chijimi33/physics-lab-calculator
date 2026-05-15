import type {
  CalculationResult,
  CsvExportContext,
  ExperimentDefinition,
  RawInputState,
} from "./types";
import { calculateSimplePendulum } from "./simplePendulum";
import { STANDARD_GRAVITY } from "@/src/lib/physics/pendulum";
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

function exportSimplePendulumCsv({
  input,
  calculation,
  formatValue,
  formatComputedValue,
}: CsvExportContext): string {
  const rows: string[] = [
    csvRow(["第3回実験", "単振り子"]),
    "",
    csvRow(["Length measurements"]),
    csvRow(["No.", "L [cm]", "D [cm]", "l [m]"]),
  ];

  (input.lengths ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        formatComputedValue(valueFromComputed(calculation, "lengths", index, "l")),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Amplitude dependence"]),
    csvRow(["No.", "phi_0 [deg]", "time for 10 oscillations [s]", "phi_0 [rad]", "phi_0^2 [rad^2]", "T [s]"]),
  );

  (input.amplitudes ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        formatComputedValue(valueFromComputed(calculation, "amplitudes", index, "phiRad")),
        formatComputedValue(valueFromComputed(calculation, "amplitudes", index, "phiSquared")),
        formatComputedValue(valueFromComputed(calculation, "amplitudes", index, "period")),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Gravity measurement"]),
    csvRow(["No.", "n", "t [s]", "predicted t [s]", "residual [s]"]),
  );

  (input.gravity ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        formatComputedValue(valueFromComputed(calculation, "gravity", index, "predictedTime")),
        formatComputedValue(valueFromComputed(calculation, "gravity", index, "residual")),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Results"]),
    csvRow(["Label", "Value"]),
    csvRow(["l average", formatValue("lengthAverage")]),
    csvRow(["l standard error", formatValue("lengthStandardError")]),
    csvRow(["T at phi_0 = 0", formatValue("amplitudeZeroPeriod")]),
    csvRow(["T at phi_0 = 5 deg", formatValue("amplitudePeriodAtFiveDegrees")]),
    csvRow(["increase at 5 deg", formatValue("amplitudeIncreaseAtFiveDegrees")]),
    csvRow(["T from t-n regression", formatValue("gravityPeriod")]),
    csvRow(["g", formatValue("gravity")]),
    csvRow(["relative error vs standard gravity", formatValue("gravityRelativeError")]),
  );

  return rows.join("\n");
}

export const simplePendulumExperiment: ExperimentDefinition = {
  id: "simple-pendulum",
  number: 3,
  slug: "simple-pendulum",
  title: "単振り子",
  description:
    "振り子の長さ、周期、振幅依存性を測定し、重力加速度を求めます。",
  inputs: [
    {
      id: "lengths",
      title: "1. 振り子の長さ",
      rowCount: 5,
      rowLabel: "測定",
      required: true,
      columns: [
        { key: "L", label: "L", unit: units.centimeter, allowNegative: false, warnOnZero: true },
        { key: "D", label: "D", unit: units.centimeter, allowNegative: false },
      ],
      computedColumns: [{ key: "l", label: "l = L - D/2 [m]" }],
    },
    {
      id: "amplitudes",
      title: "2. 実験1: 周期の振幅依存性",
      rowCount: 12,
      minRows: 2,
      maxRows: 13,
      dynamicRows: true,
      rowCountMode: "select",
      rowLabel: "振幅",
      columns: [
        { key: "phi", label: "phi_0", unit: "deg", allowNegative: false },
        { key: "time10", label: "10回の時間", unit: units.second, allowNegative: false, warnOnZero: true },
      ],
      computedColumns: [
        { key: "phiRad", label: "phi_0 [rad]" },
        { key: "phiSquared", label: "phi_0^2 [rad^2]" },
        { key: "period", label: "T [s]" },
      ],
    },
    {
      id: "gravity",
      title: "3. 実験2: 重力加速度の測定",
      rowCount: 20,
      minRows: 2,
      maxRows: 20,
      dynamicRows: true,
      rowCountMode: "select",
      rowLabel: "点",
      required: true,
      columns: [
        { key: "n", label: "振動回数 n", allowNegative: false, warnOnZero: true },
        { key: "t", label: "経過時間 t", unit: units.second, allowNegative: false, warnOnZero: true },
      ],
      computedColumns: [
        { key: "predictedTime", label: "回帰 t [s]" },
        { key: "residual", label: "残差 [s]" },
      ],
    },
  ],
  results: [
    {
      key: "lengthAverage",
      label: "l の平均値",
      unit: units.meter,
      formula: "l = L - \\frac{1}{2}D",
      detail: "内部計算では cm から m に変換",
    },
    {
      key: "lengthStandardError",
      label: "l の標準誤差",
      unit: units.meter,
    },
    {
      key: "amplitudeZeroPeriod",
      label: "phi_0 = 0 の周期",
      unit: units.second,
      formula: "T = a\\phi_0^2 + b",
      detail: "T-phi_0^2 回帰の切片",
    },
    {
      key: "amplitudePeriodAtFiveDegrees",
      label: "phi_0 = 5 deg の周期",
      unit: units.second,
    },
    {
      key: "amplitudeIncreaseAtFiveDegrees",
      label: "5 deg での周期増加率",
      kind: "percent",
    },
    {
      key: "gravityPeriod",
      label: "t-n 回帰による周期 T",
      unit: units.second,
      formula: "t = Tn + b",
    },
    {
      key: "gravity",
      label: "重力加速度 g",
      unit: units.acceleration,
      formula: "g = \\frac{4\\pi^2 l}{T^2}",
    },
    {
      key: "gravityRelativeError",
      label: "標準重力との差",
      kind: "percent",
      detail: `標準重力 ${STANDARD_GRAVITY} m/s^2 との相対差`,
    },
  ],
  formulas: [
    {
      label: "振り子の長さ",
      expression: "l = L - \\frac{1}{2}D",
      description: "つり環の内面上端から球の最下端までの長さ L から、球の半径を引きます。",
    },
    {
      label: "小角近似",
      expression: "\\sin\\varphi \\simeq \\varphi,\\quad \\cos\\varphi \\simeq 1",
    },
    {
      label: "単振動の方程式",
      expression: "\\frac{d^2\\varphi}{dt^2} + \\omega_0^2\\varphi = 0",
    },
    {
      label: "角振動数",
      expression: "\\omega_0 = \\sqrt{\\frac{g}{l}}",
    },
    {
      label: "周期",
      expression: "T = 2\\pi\\sqrt{\\frac{l}{g}}",
    },
    {
      label: "振幅補正",
      expression: "T = 2\\pi\\sqrt{\\frac{l}{g}}\\left(1 + \\frac{1}{16}\\varphi_0^2\\right)",
      description: "振幅が大きくない範囲での近似式です。",
    },
    {
      label: "重力加速度",
      expression: "g = \\frac{4\\pi^2l}{T^2}",
    },
    {
      label: "t-n グラフ",
      expression: "t = Tn + b",
      description: "傾き T を1振動に要する時間として扱います。",
    },
  ],
  note:
    "グラフ表示は未実装です。TODO: T-phi_0, T-phi_0^2, t-n の散布図と回帰直線を追加します。振幅は度で入力し、内部ではラジアンに変換します。計算内部では丸めず、表示時のみ有効数字に合わせます。",
  calculate(input: RawInputState) {
    const result = calculateSimplePendulum({
      lengths: input.lengths ?? [],
      amplitudes: input.amplitudes ?? [],
      gravity: input.gravity ?? [],
    });

    return {
      values: {
        lengthAverage: result.lengthAverage,
        lengthStandardError: result.lengthStandardError,
        amplitudeZeroPeriod: result.amplitudeZeroPeriod,
        amplitudePeriodAtFiveDegrees: result.amplitudePeriodAtFiveDegrees,
        amplitudeIncreaseAtFiveDegrees: result.amplitudeIncreaseAtFiveDegrees,
        gravityPeriod: result.gravityPeriod,
        gravity: result.gravity,
        gravityRelativeError: result.gravityRelativeError,
      },
      computedTables: {
        lengths: result.lengthValues.map((value) => ({ l: value })),
        amplitudes: result.amplitudePeriods.map((value, index) => ({
          phiRad: result.amplitudeRadians[index] ?? null,
          phiSquared: result.amplitudeSquares[index] ?? null,
          period: value,
        })),
        gravity: result.gravityPredictedTimes.map((value, index) => ({
          predictedTime: value,
          residual: result.gravityResiduals[index] ?? null,
        })),
      },
      warnings: result.warnings,
    };
  },
  exportCsv: exportSimplePendulumCsv,
};
