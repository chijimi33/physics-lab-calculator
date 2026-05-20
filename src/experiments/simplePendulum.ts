import { linearLeastSquares } from "../lib/physics/leastSquares";
import {
  calculateGravityFromPeriod,
  calculatePendulumLengthMeters,
  calculatePeriodFromElapsedTime,
  degreesToRadians,
  STANDARD_GRAVITY,
} from "../lib/physics/pendulum";
import { average, standardErrorOfMean } from "../lib/physics/statistics";

export type SimplePendulumRawInput = {
  lengths: string[][];
  amplitudes: string[][];
  gravity: string[][];
};

export type SimplePendulumResult = {
  lengthValues: Array<number | null>;
  lengthAverage: number | null;
  lengthStandardError: number | null;
  amplitudeRadians: Array<number | null>;
  amplitudeSquares: Array<number | null>;
  amplitudePeriods: Array<number | null>;
  amplitudeMeanPeriods: Array<number | null>;
  amplitudeRegressionSlope: number | null;
  amplitudeRegressionIntercept: number | null;
  amplitudeRegressionRSquared: number | null;
  amplitudeZeroPeriod: number | null;
  amplitudePeriodAtFiveDegrees: number | null;
  amplitudeIncreaseAtFiveDegrees: number | null;
  gravityPredictedTimes: Array<number | null>;
  gravityResiduals: Array<number | null>;
  gravityPeriod: number | null;
  gravityIntercept: number | null;
  gravityRSquared: number | null;
  gravity: number | null;
  gravityDifference: number | null;
  gravityRelativeError: number | null;
  reportExperiment1: string;
  reportExperiment2: string;
  warnings: string[];
};

function parseNumber(value: string | undefined): number | null {
  const trimmed = (value ?? "").trim();

  if (trimmed === "") {
    return null;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function finiteNumbers(values: Array<number | null>): number[] {
  return values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
}

function calculateLengthRows(rows: string[][]): Array<number | null> {
  return rows.map((row) => {
    const totalLength = parseNumber(row[0]);
    const diameter = parseNumber(row[1]);

    if (totalLength === null || diameter === null) {
      return null;
    }

    return calculatePendulumLengthMeters(totalLength, diameter);
  });
}

function calculateAmplitudeRows(rows: string[][]) {
  const radians = rows.map((row) => {
    const degrees = parseNumber(row[0]);
    return degrees === null ? null : degreesToRadians(degrees);
  });
  const squares = radians.map((value) => (value === null ? null : value ** 2));
  const periods = rows.map((row) => {
    const elapsedSeconds = parseNumber(row[1]);
    return elapsedSeconds === null
      ? null
      : calculatePeriodFromElapsedTime(elapsedSeconds, 10);
  });
  const grouped = new Map<string, { square: number; periods: number[] }>();
  squares.forEach((square, index) => {
    const period = periods[index];
    if (square === null || period === null) {
      return;
    }

    const key = square.toPrecision(15);
    const existing = grouped.get(key);
    if (existing) {
      existing.periods.push(period);
    } else {
      grouped.set(key, { square, periods: [period] });
    }
  });
  const groupedMeans = Array.from(grouped.values()).map((group) => ({
    x: group.square,
    y: average(group.periods) ?? group.periods[0],
  }));
  const periodMeanBySquare = new Map(
    groupedMeans.map((point) => [point.x.toPrecision(15), point.y]),
  );
  const meanPeriods = squares.map((square) =>
    square === null ? null : periodMeanBySquare.get(square.toPrecision(15)) ?? null,
  );
  const points = groupedMeans;
  const regression = linearLeastSquares(points);
  const fiveDegreesSquared = degreesToRadians(5) ** 2;
  const zeroPeriod = regression?.intercept ?? null;
  const periodAtFiveDegrees =
    regression === null ? null : regression.slope * fiveDegreesSquared + regression.intercept;
  const increaseAtFiveDegrees =
    zeroPeriod !== null && zeroPeriod !== 0 && periodAtFiveDegrees !== null
      ? periodAtFiveDegrees / zeroPeriod - 1
      : null;

  return {
    radians,
    squares,
    periods,
    meanPeriods,
    slope: regression?.slope ?? null,
    intercept: regression?.intercept ?? null,
    rSquared: regression?.rSquared ?? null,
    zeroPeriod,
    periodAtFiveDegrees,
    increaseAtFiveDegrees,
    hasRegression: regression !== null,
  };
}

function calculateGravityRows(rows: string[][]) {
  const points = rows.flatMap((row) => {
    const oscillationCount = parseNumber(row[0]);
    const elapsedSeconds = parseNumber(row[1]);

    return oscillationCount !== null && elapsedSeconds !== null
      ? [{ x: oscillationCount, y: elapsedSeconds }]
      : [];
  });
  const regression = linearLeastSquares(points);

  const predictedTimes = rows.map((row) => {
    const oscillationCount = parseNumber(row[0]);
    return regression !== null && oscillationCount !== null
      ? regression.slope * oscillationCount + regression.intercept
      : null;
  });
  const residuals = rows.map((row, index) => {
    const elapsedSeconds = parseNumber(row[1]);
    const predicted = predictedTimes[index];
    return elapsedSeconds !== null && predicted !== null ? elapsedSeconds - predicted : null;
  });

  return {
    predictedTimes,
    residuals,
    period: regression?.slope ?? null,
    intercept: regression?.intercept ?? null,
    rSquared: regression?.rSquared ?? null,
    hasRegression: regression !== null,
  };
}

function formatReportNumber(value: number | null, unit = "", digits = 5): string {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  const formatted = Number(value.toPrecision(digits)).toString();
  return unit ? `${formatted} ${unit}` : formatted;
}

function buildReportExperiment1({
  lengthAverage,
  slope,
  intercept,
  periodAtFiveDegrees,
  increaseAtFiveDegrees,
}: {
  lengthAverage: number | null;
  slope: number | null;
  intercept: number | null;
  periodAtFiveDegrees: number | null;
  increaseAtFiveDegrees: number | null;
}): string {
  const increasePercent =
    increaseAtFiveDegrees === null ? null : increaseAtFiveDegrees * 100;

  return [
    `使用した振り子の長さ l = ${formatReportNumber(lengthAverage, "m")}`,
    `T-phi_0^2 回帰式: T = ${formatReportNumber(slope, "s/rad^2")} phi_0^2 + ${formatReportNumber(intercept, "s")}`,
    `phi_0 = 0 の外挿周期 T0 = ${formatReportNumber(intercept, "s")}`,
    `phi_0 = 5 deg での周期 T(5 deg) = ${formatReportNumber(periodAtFiveDegrees, "s")}`,
    `周期増加率 = ${formatReportNumber(increasePercent, "%")}`,
    "考察下書き: phi_0 = 5 deg での増加率が十分小さければ、小角近似の範囲で等時性はよい近似で成り立つと考えられる。",
  ].join("\n");
}

function buildReportExperiment2({
  gravityPeriod,
  gravityIntercept,
  gravity,
  gravityRelativeError,
}: {
  gravityPeriod: number | null;
  gravityIntercept: number | null;
  gravity: number | null;
  gravityRelativeError: number | null;
}): string {
  const relativePercent =
    gravityRelativeError === null ? null : gravityRelativeError * 100;

  return [
    `n-t 回帰式: t = ${formatReportNumber(gravityPeriod, "s")} n + ${formatReportNumber(gravityIntercept, "s")}`,
    `回帰直線の傾きから求めた周期 T = ${formatReportNumber(gravityPeriod, "s")}`,
    `重力加速度 g = ${formatReportNumber(gravity, "m/s^2")}`,
    `標準重力加速度との相対誤差 = ${formatReportNumber(relativePercent, "%")}`,
    "誤差要因候補: 振幅が5度を超えたこと、支点位置の読み取り、球の直径測定、周期測定時の反応時間、空気抵抗、振動面のずれ。",
  ].join("\n");
}

export function calculateSimplePendulum(
  input: SimplePendulumRawInput,
): SimplePendulumResult {
  const lengthValues = calculateLengthRows(input.lengths);
  const lengthNumbers = finiteNumbers(lengthValues);
  const lengthAverage = average(lengthNumbers);
  const lengthStandardError = standardErrorOfMean(lengthNumbers);
  const amplitude = calculateAmplitudeRows(input.amplitudes);
  const gravityRegression = calculateGravityRows(input.gravity);
  const gravity = calculateGravityFromPeriod(lengthAverage, gravityRegression.period);
  const gravityDifference = gravity === null ? null : gravity - STANDARD_GRAVITY;
  const gravityRelativeError =
    gravity === null ? null : Math.abs(gravity - STANDARD_GRAVITY) / STANDARD_GRAVITY;
  const reportExperiment1 = buildReportExperiment1({
    lengthAverage,
    slope: amplitude.slope,
    intercept: amplitude.intercept,
    periodAtFiveDegrees: amplitude.periodAtFiveDegrees,
    increaseAtFiveDegrees: amplitude.increaseAtFiveDegrees,
  });
  const reportExperiment2 = buildReportExperiment2({
    gravityPeriod: gravityRegression.period,
    gravityIntercept: gravityRegression.intercept,
    gravity,
    gravityRelativeError,
  });

  const warnings = [
    lengthNumbers.length < 1 ? "振り子の長さ l を求めるには L と D の入力が必要です。" : null,
    !amplitude.hasRegression
      ? "振幅依存性の確認には、振幅と10回振動時間の有効な組が2点以上必要です。"
      : null,
    !gravityRegression.hasRegression
      ? "重力加速度の計算には、振動回数 n と経過時間 t の有効な組が2点以上必要です。"
      : null,
    gravityRegression.period !== null && gravityRegression.period <= 0
      ? "t-n グラフの傾きが正ではありません。測定値を確認してください。"
      : null,
  ].filter((warning): warning is string => warning !== null);

  return {
    lengthValues,
    lengthAverage,
    lengthStandardError,
    amplitudeRadians: amplitude.radians,
    amplitudeSquares: amplitude.squares,
    amplitudePeriods: amplitude.periods,
    amplitudeMeanPeriods: amplitude.meanPeriods,
    amplitudeRegressionSlope: amplitude.slope,
    amplitudeRegressionIntercept: amplitude.intercept,
    amplitudeRegressionRSquared: amplitude.rSquared,
    amplitudeZeroPeriod: amplitude.zeroPeriod,
    amplitudePeriodAtFiveDegrees: amplitude.periodAtFiveDegrees,
    amplitudeIncreaseAtFiveDegrees: amplitude.increaseAtFiveDegrees,
    gravityPredictedTimes: gravityRegression.predictedTimes,
    gravityResiduals: gravityRegression.residuals,
    gravityPeriod: gravityRegression.period,
    gravityIntercept: gravityRegression.intercept,
    gravityRSquared: gravityRegression.rSquared,
    gravity,
    gravityDifference,
    gravityRelativeError,
    reportExperiment1,
    reportExperiment2,
    warnings,
  };
}
