import type { Granularity } from "~/types";
import type { EvaluatorConfig } from "~/types/trading";
import type { CandleWithIndicators } from "./indicatorTypes";
import { marketAPI, type PriceCandle } from "../../../functions/lib/market-api";

/**
 * Configuration for loading indicator data
 */
export interface IndicatorLoadConfig {
  symbol: string;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  evaluators?: EvaluatorConfig[]; // List of evaluator configurations with parameters
  exchange?: string; // Default: "coinbase"
}

/**
 * Loads historical candles with indicator data from Market API
 */
export class IndicatorDataLoader {
  /**
   * Load historical candles with indicator evaluations
   * Uses MarketAPI with automatic batching for large time ranges
   *
   * @param config Configuration for data loading
   * @returns Array of candles with indicator data
   */
  async loadIndicatorData(
    config: IndicatorLoadConfig
  ): Promise<CandleWithIndicators[]> {
    const { symbol, granularity, startDate, endDate, evaluators = [] } = config;

    try {
      // Convert dates to timestamps (milliseconds)
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      console.log("IndicatorDataLoader: Loading data with batching");
      console.log(`  Symbol: ${symbol}`);
      console.log(`  Granularity: ${granularity}`);
      console.log(`  Start: ${startDate.toISOString()}`);
      console.log(`  End: ${endDate.toISOString()}`);
      console.log(`  Evaluators: ${evaluators.map((e) => e.id).join(", ")}`);

      // Use MarketAPI which handles batching automatically
      const candles: PriceCandle[] = await marketAPI.fetchPriceData(
        symbol,
        granularity,
        startTime,
        endTime,
        (message) => console.log(`MarketAPI: ${message}`),
        evaluators
      );

      console.log(`IndicatorDataLoader: Loaded ${candles.length} candles`);

      // Transform PriceCandle to CandleWithIndicators
      // They have the same structure, just cast the type
      return candles as CandleWithIndicators[];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load indicator data: ${error.message}`);
      }
      throw new Error("Failed to load indicator data: Unknown error");
    }
  }

  /**
   * Load data with moving averages
   */
  async loadWithMovingAverages(
    symbol: string,
    granularity: Granularity,
    startDate: Date,
    endDate: Date,
    params?: { fastPeriod?: number; slowPeriod?: number }
  ): Promise<CandleWithIndicators[]> {
    return this.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators: [{ id: "moving-averages", params }],
    });
  }

  /**
   * Load data with RSI
   */
  async loadWithRSI(
    symbol: string,
    granularity: Granularity,
    startDate: Date,
    endDate: Date,
    params?: { period?: number }
  ): Promise<CandleWithIndicators[]> {
    return this.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators: [{ id: "rsi", params }],
    });
  }

  /**
   * Load data with multiple indicators
   */
  async loadWithIndicators(
    symbol: string,
    granularity: Granularity,
    startDate: Date,
    endDate: Date,
    evaluators: EvaluatorConfig[]
  ): Promise<CandleWithIndicators[]> {
    return this.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators,
    });
  }

  /**
   * Validate that candles have required indicators
   */
  validateIndicators(
    candles: CandleWithIndicators[],
    requiredEvaluators: EvaluatorConfig[]
  ): boolean {
    if (candles.length === 0) return false;

    // Check first candle has all required evaluators
    const firstCandle = candles[0];
    if (!firstCandle.evaluations) return false;

    const evaluatorIds = firstCandle.evaluations.map((e) => e.id);
    const requiredIds = requiredEvaluators.map((e) => e.id);
    return requiredIds.every((required) => evaluatorIds.includes(required));
  }

  /**
   * Get available evaluators from first candle
   */
  getAvailableEvaluators(candles: CandleWithIndicators[]): string[] {
    if (candles.length === 0 || !candles[0].evaluations) return [];
    return candles[0].evaluations.map((e) => e.id);
  }

  /**
   * Filter candles to only include those with complete indicator data
   */
  filterCompleteCandles(
    candles: CandleWithIndicators[],
    requiredEvaluators: EvaluatorConfig[]
  ): CandleWithIndicators[] {
    const requiredIds = requiredEvaluators.map((e) => e.id);

    return candles.filter((candle) => {
      if (!candle.evaluations) return false;

      const evaluatorIds = candle.evaluations.map((e) => e.id);
      return requiredIds.every((required) => evaluatorIds.includes(required));
    });
  }
}

/**
 * Default singleton instance
 */
export const indicatorDataLoader = new IndicatorDataLoader();
