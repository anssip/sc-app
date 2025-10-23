import { TradingEngine } from "./TradingEngine";
import { PerformanceAnalytics } from "./PerformanceAnalytics";
import type {
  TradingStrategy,
  BacktestResult,
  Order,
  EquityPoint,
  Granularity,
} from "~/types/trading";
import type { CandleWithIndicators } from "~/services/indicators";
import { indicatorDataLoader } from "~/services/indicators";

/**
 * Backtesting engine for running trading strategies against historical data
 */
export class BacktestingEngine extends TradingEngine {
  private historicalData = new Map<string, CandleWithIndicators[]>();
  private currentTimestamp: number = 0;
  private currentIndex: number = 0;

  /**
   * Create a new backtesting engine
   * @param startingBalance Initial account balance
   */
  constructor(startingBalance: number) {
    super(startingBalance);
  }

  /**
   * Load historical data with indicators for backtesting
   * @param symbol Trading symbol
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @param granularity Candle granularity
   * @param evaluators List of indicator evaluators to include
   */
  async loadHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity,
    evaluators: string[] = []
  ): Promise<void> {
    // Load candles with indicators from Market API
    const candles = await indicatorDataLoader.loadIndicatorData({
      symbol,
      granularity,
      startDate,
      endDate,
      evaluators,
    });

    if (candles.length === 0) {
      throw new Error(
        `No historical data found for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`
      );
    }

    this.historicalData.set(symbol, candles);

    this.emit("data-loaded", {
      symbol,
      candleCount: candles.length,
      startDate,
      endDate,
    });
  }

  /**
   * Get price at a specific timestamp
   * @param symbol Trading symbol
   * @param timestamp Timestamp in milliseconds
   * @returns Price at timestamp or 0 if not found
   */
  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    const candles = this.historicalData.get(symbol) || [];

    // For backtesting, we use the current candle being processed
    // or find the closest candle to the timestamp
    if (this.currentTimestamp > 0) {
      const candle = candles.find((c) => c.timestamp === this.currentTimestamp);
      return candle?.close || 0;
    }

    // Fallback: find closest candle
    const candle = candles.find((c) => c.timestamp === timestamp);
    return candle?.close || 0;
  }

  /**
   * Run a backtest with a trading strategy
   * @param strategy Trading strategy to test
   * @returns Backtest result with metrics and trades
   */
  async runBacktest(strategy: TradingStrategy): Promise<BacktestResult> {
    const candles = this.historicalData.get(strategy.symbol) || [];

    if (candles.length === 0) {
      throw new Error(
        `No historical data loaded for ${strategy.symbol}. Call loadHistoricalData() first.`
      );
    }

    // Reset engine state
    this.reset();

    // Initialize strategy
    strategy.onStart?.(this.getAccount());

    // Process each candle
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      this.currentIndex = i;
      this.currentTimestamp = candle.timestamp;

      // Let strategy analyze candle
      const signal = strategy.onCandle(candle);

      if (signal) {
        // Create order from signal
        const order: Order = {
          id: this.generateOrderId(),
          symbol: strategy.symbol,
          side: signal.side,
          type: signal.type,
          quantity: signal.quantity,
          price: signal.price,
          status: "pending",
          createdAt: candle.timestamp,
        };

        // Execute order
        const trade = await this.executeOrder(order);

        if (trade) {
          strategy.onTrade?.(trade);
        }
      }

      // Update all positions with current price
      this.getPositions().forEach((position) => {
        this.updatePositionPnL(position.symbol, candle.close);
      });

      // Emit progress
      if (i % 100 === 0 || i === candles.length - 1) {
        this.emit("progress", {
          current: i + 1,
          total: candles.length,
          percent: ((i + 1) / candles.length) * 100,
          timestamp: candle.timestamp,
        });
      }
    }

    // Close any remaining open positions at final price
    const finalCandle = candles[candles.length - 1];
    const openPositions = [...this.getPositions()];
    for (const position of openPositions) {
      await this.closePosition(position.symbol);
    }

    // Generate result
    const result = this.generateResult(strategy, candles);

    // Cleanup
    strategy.onEnd?.(result.metrics);

    return result;
  }

  /**
   * Generate backtest result with metrics and curves
   * @param strategy Strategy that was tested
   * @param candles Historical candles used
   * @returns Complete backtest result
   */
  private generateResult(
    strategy: TradingStrategy,
    candles: CandleWithIndicators[]
  ): BacktestResult {
    const analytics = new PerformanceAnalytics();
    const trades = this.getTrades();
    const account = this.getAccount();

    // Calculate performance metrics
    const metrics = analytics.calculateMetrics(trades, account);

    // Generate equity curve
    const equityCurve = analytics.generateEquityCurve(
      trades,
      account.startingBalance
    );

    // Generate drawdown curve
    const drawdownCurve = analytics.calculateDrawdownCurve(
      trades,
      account.startingBalance
    );

    return {
      strategy: strategy.name,
      symbol: strategy.symbol,
      startDate: new Date(candles[0].timestamp),
      endDate: new Date(candles[candles.length - 1].timestamp),
      metrics,
      trades,
      equityCurve,
      drawdownCurve,
      account,
    };
  }

  /**
   * Generate a unique order ID
   * @returns Order ID
   */
  private generateOrderId(): string {
    return `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get loaded historical data for a symbol
   * @param symbol Trading symbol
   * @returns Array of candles with indicators
   */
  getHistoricalData(symbol: string): CandleWithIndicators[] {
    return this.historicalData.get(symbol) || [];
  }

  /**
   * Check if historical data is loaded for a symbol
   * @param symbol Trading symbol
   * @returns True if data is loaded
   */
  hasHistoricalData(symbol: string): boolean {
    return this.historicalData.has(symbol);
  }

  /**
   * Clear all historical data
   */
  clearHistoricalData(): void {
    this.historicalData.clear();
    this.currentTimestamp = 0;
    this.currentIndex = 0;
  }

  /**
   * Get current processing position in backtest
   * @returns Current index and timestamp
   */
  getCurrentPosition(): { index: number; timestamp: number } {
    return {
      index: this.currentIndex,
      timestamp: this.currentTimestamp,
    };
  }
}
