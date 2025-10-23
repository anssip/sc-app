import type { Granularity } from "~/types";
import type { CandleWithIndicators } from "./indicatorTypes";

/**
 * Configuration for loading indicator data
 */
export interface IndicatorLoadConfig {
  symbol: string;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  evaluators?: string[]; // List of evaluator IDs (e.g., ["moving-averages", "rsi"])
  exchange?: string; // Default: "coinbase"
}

/**
 * Response from Market API /history endpoint
 */
interface MarketAPIHistoryResponse {
  symbol: string;
  granularity: string;
  start_time: string;
  end_time: string;
  evaluators: string[];
  candles: CandleWithIndicators[];
}

/**
 * Loads historical candles with indicator data from Market API
 */
export class IndicatorDataLoader {
  private baseUrl: string;

  constructor(baseUrl: string = "https://market.spotcanvas.com") {
    this.baseUrl = baseUrl;
  }

  /**
   * Load historical candles with indicator evaluations
   * @param config Configuration for data loading
   * @returns Array of candles with indicator data
   */
  async loadIndicatorData(
    config: IndicatorLoadConfig
  ): Promise<CandleWithIndicators[]> {
    const {
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators = [],
      exchange = "coinbase",
    } = config;

    // Build query parameters
    const params = new URLSearchParams({
      symbol,
      granularity,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      exchange,
    });

    // Add evaluators if provided
    if (evaluators.length > 0) {
      params.append("evaluators", evaluators.join(","));
    }

    const url = `${this.baseUrl}/history?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Market API returned ${response.status}: ${response.statusText}`
        );
      }

      const data: MarketAPIHistoryResponse = await response.json();

      // Validate response
      if (!data.candles || !Array.isArray(data.candles)) {
        throw new Error("Invalid response from Market API: missing candles");
      }

      return data.candles;
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
    endDate: Date
  ): Promise<CandleWithIndicators[]> {
    return this.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators: ["moving-averages"],
    });
  }

  /**
   * Load data with RSI
   */
  async loadWithRSI(
    symbol: string,
    granularity: Granularity,
    startDate: Date,
    endDate: Date
  ): Promise<CandleWithIndicators[]> {
    return this.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators: ["rsi"],
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
    evaluators: string[]
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
    requiredEvaluators: string[]
  ): boolean {
    if (candles.length === 0) return false;

    // Check first candle has all required evaluators
    const firstCandle = candles[0];
    if (!firstCandle.evaluations) return false;

    const evaluatorIds = firstCandle.evaluations.map((e) => e.id);
    return requiredEvaluators.every((required) =>
      evaluatorIds.includes(required)
    );
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
    requiredEvaluators: string[]
  ): CandleWithIndicators[] {
    return candles.filter((candle) => {
      if (!candle.evaluations) return false;

      const evaluatorIds = candle.evaluations.map((e) => e.id);
      return requiredEvaluators.every((required) =>
        evaluatorIds.includes(required)
      );
    });
  }
}

/**
 * Default singleton instance
 */
export const indicatorDataLoader = new IndicatorDataLoader();
