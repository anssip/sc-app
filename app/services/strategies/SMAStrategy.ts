import { BaseStrategy } from "./BaseStrategy";
import type { OrderSignal } from "~/types/trading";
import type { CandleWithIndicators } from "~/services/indicators";
import { getMovingAverages } from "~/services/indicators";

/**
 * Configuration for SMA crossover strategy
 */
export interface SMAStrategyConfig {
  fastPeriod: number; // Fast MA period (e.g., 50)
  slowPeriod: number; // Slow MA period (e.g., 200)
  quantity?: number; // Order quantity (default: 1)
}

/**
 * Simple Moving Average (SMA) Crossover Strategy
 *
 * Buy Signal: Fast MA crosses above Slow MA (golden cross)
 * Sell Signal: Fast MA crosses below Slow MA (death cross)
 *
 * This is a trend-following strategy that attempts to capture major trends.
 */
export class SMAStrategy extends BaseStrategy {
  private fastPeriod: number;
  private slowPeriod: number;
  private quantity: number;
  private previousFastMA?: number;
  private previousSlowMA?: number;
  private inPosition: boolean = false;

  constructor(symbol: string, config: SMAStrategyConfig) {
    super(
      symbol,
      `SMA Crossover (${config.fastPeriod}/${config.slowPeriod})`,
      config,
      `Moving average crossover strategy using ${config.fastPeriod} and ${config.slowPeriod} period SMAs`
    );

    this.fastPeriod = config.fastPeriod;
    this.slowPeriod = config.slowPeriod;
    this.quantity = config.quantity || 1;

    // Validate configuration
    if (this.fastPeriod >= this.slowPeriod) {
      throw new Error(
        "Fast period must be less than slow period for SMA crossover strategy"
      );
    }

    if (this.fastPeriod < 2 || this.slowPeriod < 2) {
      throw new Error("MA periods must be at least 2");
    }
  }

  /**
   * Returns list of required indicators
   * SMA strategy requires moving averages indicator
   */
  getRequiredIndicators(): string[] {
    return ["moving-averages"];
  }

  /**
   * Analyze candle and generate trading signal
   */
  protected analyze(candle: CandleWithIndicators): OrderSignal | null {
    // Get moving averages from candle
    const maValues = getMovingAverages(candle);

    const fastMA = maValues[`ma${this.fastPeriod}`];
    const slowMA = maValues[`ma${this.slowPeriod}`];

    // Need both MAs to be available
    if (fastMA === undefined || slowMA === undefined) {
      return null;
    }

    // Need previous values for crossover detection
    if (this.previousFastMA === undefined || this.previousSlowMA === undefined) {
      this.previousFastMA = fastMA;
      this.previousSlowMA = slowMA;
      return null;
    }

    let signal: OrderSignal | null = null;

    // Detect golden cross (bullish): fast MA crosses above slow MA
    if (
      this.isBullishCrossover(
        fastMA,
        this.previousFastMA,
        slowMA,
        this.previousSlowMA
      )
    ) {
      if (!this.inPosition) {
        signal = {
          side: "buy",
          type: "market",
          quantity: this.quantity,
        };
        this.inPosition = true;
      }
    }
    // Detect death cross (bearish): fast MA crosses below slow MA
    else if (
      this.isBearishCrossover(
        fastMA,
        this.previousFastMA,
        slowMA,
        this.previousSlowMA
      )
    ) {
      if (this.inPosition) {
        signal = {
          side: "sell",
          type: "market",
          quantity: this.quantity,
        };
        this.inPosition = false;
      }
    }

    // Update previous values
    this.previousFastMA = fastMA;
    this.previousSlowMA = slowMA;

    return signal;
  }

  /**
   * Get current MA values for debugging/monitoring
   */
  getCurrentMAValues(): {
    fastMA?: number;
    slowMA?: number;
    previousFastMA?: number;
    previousSlowMA?: number;
  } {
    return {
      fastMA: this.previousFastMA, // Current is stored as previous after each candle
      slowMA: this.previousSlowMA,
      previousFastMA: this.previousFastMA,
      previousSlowMA: this.previousSlowMA,
    };
  }

  /**
   * Check if currently in a position
   */
  isInPosition(): boolean {
    return this.inPosition;
  }

  /**
   * Reset strategy state
   */
  reset(): void {
    this.previousFastMA = undefined;
    this.previousSlowMA = undefined;
    this.inPosition = false;
  }
}
