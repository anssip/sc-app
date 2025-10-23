import type {
  TradingStrategy,
  OrderSignal,
  Trade,
  TradingAccount,
  PerformanceMetrics,
} from "~/types/trading";
import type {
  CandleWithIndicators,
  IndicatorEvaluation,
} from "~/services/indicators";
import { getIndicator, getIndicatorValue } from "~/services/indicators";

/**
 * Abstract base class for trading strategies
 * Provides common functionality and helper methods
 */
export abstract class BaseStrategy implements TradingStrategy {
  public readonly name: string;
  public readonly symbol: string;
  public readonly description?: string;
  protected config: Record<string, any>;
  protected previousCandle?: CandleWithIndicators;

  /**
   * Create a new strategy
   * @param symbol Trading symbol
   * @param name Strategy name
   * @param config Strategy configuration
   * @param description Optional strategy description
   */
  constructor(
    symbol: string,
    name: string,
    config: Record<string, any> = {},
    description?: string
  ) {
    this.symbol = symbol;
    this.name = name;
    this.config = config;
    this.description = description;
  }

  /**
   * Process a candle and generate trading signal
   * This is the main entry point called by the backtest engine
   * @param candle Current candle with indicators
   * @returns Trading signal or null
   */
  onCandle(candle: any): OrderSignal | null {
    // Validate candle has indicators if this is a CandleWithIndicators
    const candleWithIndicators = candle as CandleWithIndicators;

    // Call strategy-specific analysis
    const signal = this.analyze(candleWithIndicators);

    // Store for next iteration
    this.previousCandle = candleWithIndicators;

    return signal;
  }

  /**
   * Strategy-specific analysis logic
   * Subclasses must implement this
   * @param candle Current candle with indicators
   * @returns Trading signal or null
   */
  protected abstract analyze(
    candle: CandleWithIndicators
  ): OrderSignal | null;

  /**
   * Called when strategy starts (optional)
   */
  onStart?(account: TradingAccount): void {
    // Default: no-op
  }

  /**
   * Called when a trade executes (optional)
   */
  onTrade?(trade: Trade): void {
    // Default: no-op
  }

  /**
   * Called when strategy ends (optional)
   */
  onEnd?(metrics: PerformanceMetrics): void {
    // Default: no-op
  }

  /**
   * Helper: Get indicator from candle
   */
  protected getIndicator(
    candle: CandleWithIndicators,
    indicatorId: string
  ): IndicatorEvaluation | undefined {
    return getIndicator(candle, indicatorId);
  }

  /**
   * Helper: Get specific indicator value
   */
  protected getIndicatorValue(
    candle: CandleWithIndicators,
    indicatorId: string,
    valueName: string
  ): number | undefined {
    return getIndicatorValue(candle, indicatorId, valueName);
  }

  /**
   * Helper: Check if we have a previous candle
   */
  protected hasPreviousCandle(): boolean {
    return this.previousCandle !== undefined;
  }

  /**
   * Helper: Get previous indicator value
   */
  protected getPreviousIndicatorValue(
    indicatorId: string,
    valueName: string
  ): number | undefined {
    if (!this.previousCandle) return undefined;
    return getIndicatorValue(this.previousCandle, indicatorId, valueName);
  }

  /**
   * Helper: Detect bullish crossover (current > prev && prev_prev <= prev)
   */
  protected isBullishCrossover(
    currentValue: number | undefined,
    previousValue: number | undefined,
    referenceValue: number | undefined,
    previousReferenceValue: number | undefined
  ): boolean {
    if (
      currentValue === undefined ||
      previousValue === undefined ||
      referenceValue === undefined ||
      previousReferenceValue === undefined
    ) {
      return false;
    }

    return (
      currentValue > referenceValue && previousValue <= previousReferenceValue
    );
  }

  /**
   * Helper: Detect bearish crossover (current < prev && prev_prev >= prev)
   */
  protected isBearishCrossover(
    currentValue: number | undefined,
    previousValue: number | undefined,
    referenceValue: number | undefined,
    previousReferenceValue: number | undefined
  ): boolean {
    if (
      currentValue === undefined ||
      previousValue === undefined ||
      referenceValue === undefined ||
      previousReferenceValue === undefined
    ) {
      return false;
    }

    return (
      currentValue < referenceValue && previousValue >= previousReferenceValue
    );
  }

  /**
   * Helper: Check if value is above threshold
   */
  protected isAbove(
    value: number | undefined,
    threshold: number
  ): boolean {
    return value !== undefined && value > threshold;
  }

  /**
   * Helper: Check if value is below threshold
   */
  protected isBelow(
    value: number | undefined,
    threshold: number
  ): boolean {
    return value !== undefined && value < threshold;
  }

  /**
   * Helper: Check if value crosses above threshold
   */
  protected crossesAbove(
    currentValue: number | undefined,
    previousValue: number | undefined,
    threshold: number
  ): boolean {
    if (currentValue === undefined || previousValue === undefined) {
      return false;
    }
    return currentValue > threshold && previousValue <= threshold;
  }

  /**
   * Helper: Check if value crosses below threshold
   */
  protected crossesBelow(
    currentValue: number | undefined,
    previousValue: number | undefined,
    threshold: number
  ): boolean {
    if (currentValue === undefined || previousValue === undefined) {
      return false;
    }
    return currentValue < threshold && previousValue >= threshold;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Update strategy configuration
   */
  updateConfig(updates: Record<string, any>): void {
    this.config = { ...this.config, ...updates };
  }
}
