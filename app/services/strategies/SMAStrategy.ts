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

    console.log("=== SMA Strategy Initialized ===");
    console.log(`Symbol: ${symbol}`);
    console.log(`Fast Period: ${this.fastPeriod}`);
    console.log(`Slow Period: ${this.slowPeriod}`);
    console.log(`Quantity: ${this.quantity}`);
    console.log("================================");
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

    // The API returns 'ma_fast' and 'ma_slow' as defined in the Firestore schema
    const fastMA = maValues.ma_fast;
    const slowMA = maValues.ma_slow;

    // Debug logging for first few candles
    if (!this.previousFastMA) {
      console.log(`\n[SMAStrategy] First candle analysis:`);
      console.log(`  Timestamp: ${new Date(candle.timestamp).toISOString()}`);
      console.log(`  Has evaluations:`, !!candle.evaluations);
      console.log(`  Evaluations count:`, candle.evaluations?.length || 0);
      console.log(`  MA Values extracted:`, maValues);
      console.log(`  fastMA (${this.fastPeriod}):`, fastMA);
      console.log(`  slowMA (${this.slowPeriod}):`, slowMA);
    }

    // Need both MAs to be available
    if (fastMA === undefined || slowMA === undefined) {
      return null;
    }

    // Need previous values for crossover detection
    if (
      this.previousFastMA === undefined ||
      this.previousSlowMA === undefined
    ) {
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
      console.log(`\n🟢 GOLDEN CROSS DETECTED!`);
      console.log(`  Timestamp: ${new Date(candle.timestamp).toISOString()}`);
      console.log(`  Price: $${candle.close.toFixed(2)}`);
      console.log(`  Fast MA crossed above Slow MA`);
      console.log(
        `  Previous: Fast($${this.previousFastMA.toFixed(
          2
        )}) < Slow($${this.previousSlowMA.toFixed(2)})`
      );
      console.log(
        `  Current:  Fast($${fastMA.toFixed(2)}) > Slow($${slowMA.toFixed(2)})`
      );

      if (!this.inPosition) {
        signal = {
          side: "buy",
          type: "market",
          quantity: this.quantity,
        };
        this.inPosition = true;

        console.log(
          `  → 📈 Generating BUY signal for ${
            this.quantity
          } units at $${candle.close.toFixed(2)}`
        );
      } else {
        console.log(`  → Already in position, no signal generated`);
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
      console.log(`\n🔴 DEATH CROSS DETECTED!`);
      console.log(`  Timestamp: ${new Date(candle.timestamp).toISOString()}`);
      console.log(`  Price: $${candle.close.toFixed(2)}`);
      console.log(`  Fast MA crossed below Slow MA`);
      console.log(
        `  Previous: Fast($${this.previousFastMA.toFixed(
          2
        )}) > Slow($${this.previousSlowMA.toFixed(2)})`
      );
      console.log(
        `  Current:  Fast($${fastMA.toFixed(2)}) < Slow($${slowMA.toFixed(2)})`
      );

      if (this.inPosition) {
        signal = {
          side: "sell",
          type: "market",
          quantity: this.quantity,
        };
        this.inPosition = false;

        console.log(
          `  → 📉 Generating SELL signal for ${
            this.quantity
          } units at $${candle.close.toFixed(2)}`
        );
      } else {
        console.log(`  → Not in position, no signal generated`);
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
