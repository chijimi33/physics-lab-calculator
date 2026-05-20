import type {
  CalculationResult,
  ComputedValue,
  CsvExportContext,
  ExperimentDefinition,
  RawInputState,
} from "./types";
import {
  METAL_ROD_REFERENCE_DENSITIES,
  calculateMetalRodDensity,
} from "./metalRodDensity";
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

function selectedReferenceDensity(input: RawInputState): string {
  return input.referenceDensity?.[0]?.[0] ?? "";
}

function exportMetalRodDensityCsv({
  input,
  calculation,
  formatValue,
  formatComputedValue,
}: CsvExportContext): string {
  const rows: string[] = [
    csvRow(["1-1", "金属棒の密度の測定"]),
    "",
    csvRow(["D measurements"]),
    csvRow(["No.", "D [cm]", "r_D_i", "r_D_i^2"]),
  ];

  (input.diameters ?? []).forEach((row, index) => {
    rows.push(
      csvRow([
        index + 1,
        row[0] ?? "",
        formatComputedValue(valueFromComputed(calculation, "diameters", index, "rD")),
        formatComputedValue(
          valueFromComputed(calculation, "diameters", index, "rDSquared"),
        ),
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
        formatComputedValue(valueFromComputed(calculation, "samples", index, "a")),
        formatComputedValue(valueFromComputed(calculation, "samples", index, "rA")),
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
    csvRow(["reference density", formatValue("referenceDensity")]),
    csvRow(["rho - reference", formatValue("referenceDifference")]),
    csvRow(["absolute percent difference", formatValue("referencePercentDifference")]),
  );

  return rows.join("\n");
}

export const metalRodDensityExperiment: ExperimentDefinition = {
  id: "density-metal-rod",
  number: 1,
  seriesNumber: 1,
  experimentIndex: 1,
  experimentNumber: "1-1",
  slug: "1-1-density-metal-rod",
  legacySlugs: ["density-metal-rod"],
  title: "金属棒の密度の測定",
  description:
    "直径、長さ、質量の測定値から金属棒の密度と誤差を求めます。",
  status: "stable",
  tags: ["密度", "誤差伝播", "有効数字"],
  lastUpdated: "2026-05-18",
  csvExportDefinition: { enabled: true, filenamePrefix: "physics-lab-1-1" },
  warnings: [
    "このツールは計算補助用です。提出前に、実験書・授業担当者の指示・自分の計算と照合してください。",
  ],
  inputs: [
    {
      id: "diameters",
      title: "1. 直径 D の測定",
      description: "直径 D を15回入力します。単位は cm です。残差と残差の二乗は右列に自動表示されます。",
      rowCount: 15,
      rowLabel: "測定",
      required: true,
      columns: [
        {
          key: "D",
          label: "D",
          unit: units.centimeter,
          placeholder: "例 1.234",
          allowNegative: false,
          warnOnZero: true,
        },
      ],
      computedColumns: [
        { key: "rD", label: "r_D_i" },
        { key: "rDSquared", label: "r_D_i^2" },
      ],
    },
    {
      id: "samples",
      title: "2. 長さ L と質量 M の測定",
      description: "5本の試料について長さ L と質量 M を入力します。a_i = M_i / L_i は自動計算されます。",
      rowCount: 5,
      rowLabel: "試料",
      required: true,
      columns: [
        {
          key: "L",
          label: "L_i",
          unit: units.centimeter,
          placeholder: "例 10.00",
          allowNegative: false,
          warnOnZero: true,
        },
        {
          key: "M",
          label: "M_i",
          unit: units.gram,
          placeholder: "例 78.5",
          allowNegative: false,
        },
      ],
      computedColumns: [
        { key: "a", label: "a_i = M_i / L_i" },
        { key: "rA", label: "r_a_i" },
      ],
    },
    {
      id: "referenceDensity",
      title: "3. 文献値の候補",
      description: "結果と比較する文献値を選びます。真鍮は合金のため文献値に幅があります。",
      rowCount: 1,
      columns: [
        {
          key: "material",
          label: "材質",
          inputType: "select",
          options: METAL_ROD_REFERENCE_DENSITIES.map((item) => ({
            label: `${item.material} ${item.displayDensity} ${units.density}`,
            value: item.id,
          })),
        },
      ],
      computedColumns: [{ key: "referenceDensity", label: "文献値 [g/cm^3]" }],
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
      label: "密度 rho ± m_rho",
      priority: "primary",
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
        "\\frac{m_\\rho}{\\rho} = \\sqrt{\\left(\\frac{m_a}{\\bar{a}}\\right)^2 + \\left(2\\frac{m_D}{\\bar{D}}\\right)^2}",
    },
    {
      key: "referenceDensity",
      label: "選択した文献値",
      unit: units.density,
      detail: "銅または真鍮の候補値。真鍮は合金のため文献値に幅があります。",
    },
    {
      key: "referenceDifference",
      label: "文献値との差",
      unit: units.density,
      formula: "\\rho - \\rho_{\\mathrm{ref}}",
      detail: "測定値 rho から選択した文献値を引いた値",
    },
    {
      key: "referencePercentDifference",
      label: "文献値との差の割合",
      kind: "percent",
      formula:
        "\\left|\\frac{\\rho - \\rho_{\\mathrm{ref}}}{\\rho_{\\mathrm{ref}}}\\right|",
      detail: "文献値に対するずれの割合",
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
    {
      label: "文献値との差",
      expression: "\\rho - \\rho_{\\mathrm{ref}}",
      description: "選択した銅または真鍮の文献値と測定結果を比較します。",
    },
  ],
  note:
    "計算内部では丸めず、表示時のみ有効数字と誤差桁に合わせて丸めています。レポートへ転記する前に、実験書の指定単位と丸め規則を確認してください。入力文字列を保持して、10.0 と 10.00 の桁情報を失わないようにしています。新しい実験は src/experiments に定義ファイルを追加し、src/experiments/index.ts に登録してください。",
  calculate(input) {
    const result = calculateMetalRodDensity({
      diameters: getRawColumn(input, "diameters", 0),
      lengths: getRawColumn(input, "samples", 0),
      masses: getRawColumn(input, "samples", 1),
      referenceDensity: selectedReferenceDensity(input),
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
        referenceDensity: result.referenceDensity,
        referenceDifference: result.referenceDifference,
        referencePercentDifference: result.referencePercentDifference,
      },
      computedTables: {
        diameters: result.dResiduals.map((value, index) => ({
          rD: value,
          rDSquared: result.dSquaredResiduals[index] ?? null,
        })),
        samples: result.aValues.map((value, index) => ({
          a: value,
          rA: result.aResiduals[index] ?? null,
        })),
        referenceDensity: [{ referenceDensity: result.referenceDensity }],
      },
      warnings: result.warnings,
    };
  },
  exportCsv: exportMetalRodDensityCsv,
};
