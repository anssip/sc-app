import { BaseStrategy } from "./BaseStrategy";
import type { OrderSignal } from "~/types/trading";
import type { CandleWithIndicators } from "~/services/indicators";
import { getRSI } from "~/services/indicators";

/**
 * Configuration for RSI strategy
 */
export interface RSIStrategyConfig {
  period?: number; // RSI period (default: 14)
  oversoldLevel?: number; // RSI level considered oversold (default: 30)
  overboughtLevel?: number; // RSI level considered overbought (default: 70)
  quantity?: number; // Order quantity (default: 1)
  useStopLoss?: boolean; // Enable stop-loss (default: false)
  stopLossPercent?: number; // Stop-loss percentage (default: 2%)
  useTakeProfit?: boolean; // Enable take-profit (default: false)
  takeProfitPercent?: number; // Take-profit percentage (default: 5%)
}

/**
 * Relative Strength Index (RSI) Mean Reversion Strategy
 *
 * Buy Signal: RSI crosses above oversold level (default 30)
 * Sell Signal: RSI crosses below overbought level (default 70)
 *
 * This is a mean-reversion strategy that attempts to profit from
 * price reversals after extreme moves.
 */
export class RSIStrategy extends BaseStrategy {
  private period: number;
  private oversoldLevel: number;
  private overboughtLevel: number;
  private quantity: number;
  private useStopLoss: boolean;
  private stopLossPercent: number;
  private useTakeProfit: boolean;
  private takeProfitPercent: number;

  private previousRSI?: number;
  private inPosition: boolean = false;
  private entryPrice?: number;

  constructor(symbol: string, config: RSIStrategyConfig = {}) {
    super(
      symbol,
      `RSI Mean Reversion (${config.period || 14})`,
      config,
      `RSI-based mean reversion strategy with ${config.oversoldLevel || 30}/${config.overboughtLevel || 70} levels`
    );

    this.period = config.period || 14;
    this.oversoldLevel = config.oversoldLevel || 30;
    this.overboughtLevel = config.overboughtLevel || 70;
    this.quantity = config.quantity || 1;
    this.useStopLoss = config.useStopLoss || false;
    this.stopLossPercent = config.stopLossPercent || 2;
    this.useTakeProfit = config.useTakeProfit || false;
    this.takeProfitPercent = config.takeProfitPercent || 5;

    // Validate configuration
    if (this.oversoldLevel >= this.overboughtLevel) {
      throw new Error(
        "Oversold level must be less than overbought level"
      );
    }

    if (this.oversoldLevel < 0 || this.overboughtLevel > 100) {
      throw new Error("RSI levels must be between 0 and 100");
    }

    if (this.period < 2) {
      throw new Error("RSI period must be at least 2");
    }
  }

  /**
   * Called when a trade executes - synchronize position state
   */
  onTrade(trade: any): void {
    // Update position tracking based on actual executed trades
    if (trade.side === "buy") {
      this.inPosition = true;
      this.entryPrice = trade.price;
    } else if (trade.side === "sell") {
      this.inPosition = false;
      this.entryPrice = undefined;
    }
  }

  /**
   * Analyze candle and generate trading signal
   */
  protected analyze(candle: CandleWithIndicators): OrderSignal | null {
    // Get RSI from candle
    const rsiData = getRSI(candle);

    if (!rsiData) {
      return null;
    }

    const currentRSI = rsiData.rsi;
    const currentPrice = candle.close;

    // Check stop-loss if in position
    if (this.inPosition && this.useStopLoss && this.entryPrice) {
      const stopLossPrice = this.entryPrice * (1 - this.stopLossPercent / 100);
      if (currentPrice <= stopLossPrice) {
        return {
          side: "sell",
          type: "market",
          quantity: this.quantity,
        };
      }
    }

    // Check take-profit if in position
    if (this.inPosition && this.useTakeProfit && this.entryPrice) {
      const takeProfitPrice = this.entryPrice * (1 + this.takeProfitPercent / 100);
      if (currentPrice >= takeProfitPrice) {
        return {
          side: "sell",
          type: "market",
          quantity: this.quantity,
        };
      }
    }

    // Need previous RSI for crossover detection
    if (this.previousRSI === undefined) {
      this.previousRSI = currentRSI;
      return null;
    }

    let signal: OrderSignal | null = null;

    // Buy signal: RSI crosses above oversold level (oversold -> recovering)
    if (this.crossesAbove(currentRSI, this.previousRSI, this.oversoldLevel)) {
      if (!this.inPosition) {
        signal = {
          side: "buy",
          type: "market",
          quantity: this.quantity,
        };
        // Note: Don't update inPosition here - wait for onTrade callback
      }
    }
    // Sell signal: RSI crosses below overbought level (overbought -> declining)
    else if (
      this.crossesBelow(currentRSI, this.previousRSI, this.overboughtLevel)
    ) {
      if (this.inPosition) {
        signal = {
          side: "sell",
          type: "market",
          quantity: this.quantity,
        };
        // Note: Don't update inPosition here - wait for onTrade callback
      }
    }

    // Update previous RSI
    this.previousRSI = currentRSI;

    return signal;
  }

  /**
   * Get current RSI value for debugging/monitoring
   */
  getCurrentRSI(): number | undefined {
    return this.previousRSI;
  }

  /**
   * Check if currently in a position
   */
  isInPosition(): boolean {
    return this.inPosition;
  }

  /**
   * Get entry price if in position
   */
  getEntryPrice(): number | undefined {
    return this.entryPrice;
  }

  /**
   * Check if RSI is in oversold territory
   */
  isOversold(rsi?: number): boolean {
    const rsiValue = rsi ?? this.previousRSI;
    return rsiValue !== undefined && rsiValue < this.oversoldLevel;
  }

  /**
   * Check if RSI is in overbought territory
   */
  isOverbought(rsi?: number): boolean {
    const rsiValue = rsi ?? this.previousRSI;
    return rsiValue !== undefined && rsiValue > this.overboughtLevel;
  }

  /**
   * Reset strategy state
   */
  reset(): void {
    this.previousRSI = undefined;
    this.inPosition = false;
    this.entryPrice = undefined;
  }
}
