import type {
  CalculationResult,
  ComputedValue,
  CsvExportContext,
  ExperimentDefinition,
  RawInputState,
} from "./types";
import { calculateMetalRodDensity } from "./metalRodDensity";
import { units } from "@/src/lib/physics/units";

function getRawColumn(
  input: RawInputState,
  tableId: string,
  columnIndex: number,
): string[] {
  return (input[tableId] ?? []).map((row) => row[columnIndex] ?? "");
}

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
): ComputedValue {
  return calculation.computedTables?.[tableId]?.[rowIndex]?.[key] ?? null;
}

function exportMetalRodDensityCsv({
  input,
  calculation,
  formatValue,
}: CsvExportContext): string {
  const rows: string[] = [
    csvRow(["第1回実験", "金属棒の密度の測定"]),
    "",
    csvRow(["D measurements"]),
    csvRow(["No.", "D [cm]", "r_D_i"]),
  ];

  (input.diameters ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        valueFromComputed(calculation, "diameters", index, "rD"),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["L, M, a table"]),
    csvRow(["No.", "L_i [cm]", "M_i [g]", "a_i [g/cm]", "r_a_i"]),
  );

  (input.samples ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        row[1] ?? "",
        valueFromComputed(calculation, "samples", index, "a"),
        valueFromComputed(calculation, "samples", index, "rA"),
      ]),
    );
  });

  rows.push(
    "",
    csvRow(["Results"]),
    csvRow(["Label", "Value"]),
    csvRow(["D_bar", formatValue("dAverage")]),
    csvRow(["sigma_D", formatValue("sigmaD")]),
    csvRow(["m_D", formatValue("mD")]),
    csvRow(["a_bar", formatValue("aAverage")]),
    csvRow(["sigma_a", formatValue("sigmaA")]),
    csvRow(["m_a", formatValue("mA")]),
    csvRow(["rho +/- m_rho", formatValue("rho")]),
    csvRow(["relative error", formatValue("relativeError")]),
  );

  return rows.join("\n");
}

export const metalRodDensityExperiment: ExperimentDefinition = {
  id: "density-metal-rod",
  number: 1,
  slug: "density-metal-rod",
  title: "金属棒の密度の測定",
  description:
    "直径、長さ、質量の測定値から金属棒の密度と誤差を求めます。",
  inputs: [
    {
      id: "diameters",
      title: "1. 直径 D の測定",
      rowCount: 15,
      rowLabel: "測定",
      required: true,
      columns: [
        {
          key: "D",
          label: "D",
          unit: units.centimeter,
          allowNegative: false,
          warnOnZero: true,
        },
      ],
      computedColumns: [{ key: "rD", label: "r_D_i" }],
    },
    {
      id: "samples",
      title: "2. 長さ L と質量 M の測定",
      rowCount: 5,
      rowLabel: "試料",
      required: true,
      columns: [
        {
          key: "L",
          label: "L_i",
          unit: units.centimeter,
          allowNegative: false,
          warnOnZero: true,
        },
        {
          key: "M",
          label: "M_i",
          unit: units.gram,
          allowNegative: false,
        },
      ],
      computedColumns: [
        { key: "a", label: "a_i = M_i / L_i" },
        { key: "rA", label: "r_a_i" },
      ],
    },
  ],
  results: [
    {
      key: "dAverage",
      label: "D_bar",
      unit: units.centimeter,
      formula: "\\bar{D} = \\frac{1}{n}\\sum_{i=1}^{n} D_i",
      detail: "D の平均値",
    },
    {
      key: "sigmaD",
      label: "sigma_D",
      unit: units.centimeter,
      formula: "\\sigma = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n} r_i^2}",
      detail: "D の測定値の平均二乗誤差",
    },
    {
      key: "mD",
      label: "m_D",
      unit: units.centimeter,
      formula:
        "\\sigma_m = \\sqrt{\\frac{1}{n(n-1)}\\sum_{i=1}^{n} r_i^2}",
      detail: "D の平均値の平均二乗誤差",
    },
    {
      key: "aAverage",
      label: "a_bar",
      unit: units.linearDensity,
      formula: "\\bar{a} = \\frac{1}{n}\\sum_{i=1}^{n} a_i",
      detail: "a_i の平均値",
    },
    {
      key: "sigmaA",
      label: "sigma_a",
      unit: units.linearDensity,
      formula: "\\sigma = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n} r_i^2}",
      detail: "a の測定値の平均二乗誤差",
    },
    {
      key: "mA",
      label: "m_a",
      unit: units.linearDensity,
      formula:
        "\\sigma_m = \\sqrt{\\frac{1}{n(n-1)}\\sum_{i=1}^{n} r_i^2}",
      detail: "a の平均値の平均二乗誤差",
    },
    {
      key: "rho",
      label: "rho",
      kind: "valueWithError",
      errorKey: "mRho",
      unit: units.density,
      formula: "\\rho \\pm m_\\rho",
      detail: "rho +/- m_rho",
    },
    {
      key: "relativeError",
      label: "密度の相対誤差",
      kind: "percent",
      formula:
        "m_\\rho = \\rho \\sqrt{\\left(\\frac{m_a}{\\bar{a}}\\right)^2 + \\left(2\\frac{m_D}{\\bar{D}}\\right)^2}",
    },
  ],
  formulas: [
    {
      label: "各試料の線密度",
      expression: "a_i = \\frac{M_i}{L_i}",
      description: "各試料の質量を長さで割ります。",
    },
    {
      label: "a の平均",
      expression: "\\bar{a} = \\frac{1}{n}\\sum_{i=1}^{n} a_i",
      description: "空欄を除いた a_i から平均を求めます。",
    },
    {
      label: "密度",
      expression: "\\rho = \\frac{4\\bar{a}}{\\pi \\bar{D}^{2}}",
      description: "円柱の断面積を使って金属棒の密度を求めます。",
    },
    {
      label: "直径の平均",
      expression: "\\bar{D} = \\frac{1}{n}\\sum_{i=1}^{n} D_i",
      description: "15回の直径測定から平均値を求めます。",
    },
    {
      label: "残差",
      expression: "r_i = x_i - \\bar{x}",
      description: "各測定値が平均値からどれだけずれているかを表します。",
    },
    {
      label: "測定値の平均二乗誤差",
      expression: "\\sigma = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n} r_i^2}",
      description: "測定値そのもののばらつきを表します。",
    },
    {
      label: "平均値の平均二乗誤差",
      expression:
        "\\sigma_m = \\sqrt{\\frac{1}{n(n-1)}\\sum_{i=1}^{n} r_i^2}",
      description: "平均値に対する不確かさとして使います。",
    },
    {
      label: "密度の誤差",
      expression:
        "m_\\rho = \\rho \\sqrt{\\left(\\frac{m_a}{\\bar{a}}\\right)^2 + \\left(2\\frac{m_D}{\\bar{D}}\\right)^2}",
      description: "D は二乗で効くため、相対誤差に係数 2 が付きます。",
    },
    {
      label: "最終結果",
      expression: "\\rho \\pm m_\\rho",
      description: "誤差 m_rho の桁に合わせて rho を丸めます。",
    },
  ],
  note:
    "入力文字列を保持して、10.0 と 10.00 の桁情報を失わないようにしています。新しい実験は src/experiments に定義ファイルを追加し、src/experiments/index.ts に登録してください。",
  calculate(input) {
    const result = calculateMetalRodDensity({
      diameters: getRawColumn(input, "diameters", 0),
      lengths: getRawColumn(input, "samples", 0),
      masses: getRawColumn(input, "samples", 1),
    });

    return {
      values: {
        dAverage: result.dAverage,
        sigmaD: result.sigmaD,
        mD: result.mD,
        aAverage: result.aAverage,
        sigmaA: result.sigmaA,
        mA: result.mA,
        rho: result.rho,
        mRho: result.mRho,
        relativeError: result.relativeError,
      },
      computedTables: {
        diameters: result.dResiduals.map((value) => ({ rD: value })),
        samples: result.aValues.map((value, index) => ({
          a: value,
          rA: result.aResiduals[index] ?? null,
        })),
      },
      warnings: result.warnings,
    };
  },
  exportCsv: exportMetalRodDensityCsv,
};
