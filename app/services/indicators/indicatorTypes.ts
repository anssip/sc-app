import type { Candle } from "~/types";

/**
 * Single indicator value from an evaluation
 */
export interface IndicatorValue {
  name: string; // e.g., "ma50", "rsi", "macd_line"
  timestamp: number;
  value: number;
  plot_ref: string; // Reference for plotting
}

/**
 * Plot style configuration for visualization
 */
export interface PlotStyle {
  type: string; // "line", "histogram", etc.
  style: {
    color: string;
    lineWidth?: number;
    opacity?: number;
  };
}

/**
 * Complete indicator evaluation from Market API
 */
export interface IndicatorEvaluation {
  id: string; // e.g., "moving-averages", "rsi", "macd"
  name: string; // e.g., "MovingAveragesEvaluator", "RSIEvaluator"
  values: IndicatorValue[];
  plot_styles?: Record<string, PlotStyle>;
}

/**
 * Candle with indicator evaluations attached
 * This extends the base Candle type with indicator data from Market API
 */
export interface CandleWithIndicators extends Candle {
  evaluations?: IndicatorEvaluation[];
}

/**
 * Moving Average indicator values
 */
export interface MovingAverageValues {
  ma50?: number;
  ma200?: number;
  [key: string]: number | undefined; // Support for any MA period
}

/**
 * RSI indicator values
 */
export interface RSIValues {
  rsi: number;
  period: number;
}

/**
 * MACD indicator values
 */
export interface MACDValues {
  macd_line: number;
  signal_line: number;
  histogram: number;
}

/**
 * Bollinger Bands indicator values
 */
export interface BollingerBandsValues {
  upper: number;
  middle: number;
  lower: number;
  bandwidth?: number;
}

/**
 * Generic indicator data structure for flexibility
 */
export type IndicatorData = Record<string, number | string | boolean>;

/**
 * Helper to extract specific indicator from candle
 */
export function getIndicator(
  candle: CandleWithIndicators,
  indicatorId: string
): IndicatorEvaluation | undefined {
  return candle.evaluations?.find((e) => e.id === indicatorId);
}

/**
 * Helper to extract specific indicator value by name
 */
export function getIndicatorValue(
  candle: CandleWithIndicators,
  indicatorId: string,
  valueName: string
): number | undefined {
  const indicator = getIndicator(candle, indicatorId);
  return indicator?.values.find((v) => v.name === valueName)?.value;
}

/**
 * Extract all moving average values from candle
 */
export function getMovingAverages(
  candle: CandleWithIndicators
): MovingAverageValues {
  const indicator = getIndicator(candle, "moving-averages");
  if (!indicator) return {};

  const values: MovingAverageValues = {};
  indicator.values.forEach((v) => {
    values[v.name] = v.value;
  });
  return values;
}

/**
 * Extract RSI value from candle
 */
export function getRSI(candle: CandleWithIndicators): RSIValues | undefined {
  const rsiValue = getIndicatorValue(candle, "rsi", "rsi");
  if (rsiValue === undefined) return undefined;

  return {
    rsi: rsiValue,
    period: 14, // Default RSI period
  };
}

/**
 * Extract MACD values from candle
 */
export function getMACD(candle: CandleWithIndicators): MACDValues | undefined {
  const macdLine = getIndicatorValue(candle, "macd", "macd_line");
  const signalLine = getIndicatorValue(candle, "macd", "signal_line");
  const histogram = getIndicatorValue(candle, "macd", "histogram");

  if (
    macdLine === undefined ||
    signalLine === undefined ||
    histogram === undefined
  ) {
    return undefined;
  }

  return {
    macd_line: macdLine,
    signal_line: signalLine,
    histogram,
  };
}

/**
 * Extract Bollinger Bands values from candle
 */
export function getBollingerBands(
  candle: CandleWithIndicators
): BollingerBandsValues | undefined {
  const upper = getIndicatorValue(candle, "bollinger-bands", "upper");
  const middle = getIndicatorValue(candle, "bollinger-bands", "middle");
  const lower = getIndicatorValue(candle, "bollinger-bands", "lower");

  if (upper === undefined || middle === undefined || lower === undefined) {
    return undefined;
  }

  return {
    upper,
    middle,
    lower,
  };
}
