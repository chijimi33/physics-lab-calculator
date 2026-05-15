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
  amplitudeZeroPeriod: number | null;
  amplitudePeriodAtFiveDegrees: number | null;
  amplitudeIncreaseAtFiveDegrees: number | null;
  gravityPredictedTimes: Array<number | null>;
  gravityResiduals: Array<number | null>;
  gravityPeriod: number | null;
  gravity: number | null;
  gravityRelativeError: number | null;
  warnings: string[];
};

function parseNumber(value: string | undefined): number | null {
  const numeric = Number((value ?? "").trim());
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
  const points = squares.flatMap((square, index) =>
    square !== null && periods[index] !== null
      ? [{ x: square, y: periods[index] }]
      : [],
  );
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
    hasRegression: regression !== null,
  };
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
  const gravityRelativeError =
    gravity === null ? null : Math.abs(gravity - STANDARD_GRAVITY) / STANDARD_GRAVITY;

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
    amplitudeZeroPeriod: amplitude.zeroPeriod,
    amplitudePeriodAtFiveDegrees: amplitude.periodAtFiveDegrees,
    amplitudeIncreaseAtFiveDegrees: amplitude.increaseAtFiveDegrees,
    gravityPredictedTimes: gravityRegression.predictedTimes,
    gravityResiduals: gravityRegression.residuals,
    gravityPeriod: gravityRegression.period,
    gravity,
    gravityRelativeError,
    warnings,
  };
}
