import { describe, it, expect, beforeEach, mock } from "bun:test";
import { BacktestingEngine } from "../BacktestingEngine";
import type { TradingStrategy, OrderSignal } from "~/types/trading";
import type { CandleWithIndicators } from "~/services/indicators";

// Simple mock strategy for testing
class MockStrategy implements TradingStrategy {
  name = "Mock Strategy";
  symbol = "BTC-USD";
  description = "Test strategy";
  private callCount = 0;

  onCandle(candle: any): OrderSignal | null {
    this.callCount++;

    // Buy on first candle, sell on third candle
    if (this.callCount === 1) {
      return { side: "buy", type: "market", quantity: 1 };
    } else if (this.callCount === 3) {
      return { side: "sell", type: "market", quantity: 1 };
    }

    return null;
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset(): void {
    this.callCount = 0;
  }
}

describe("BacktestingEngine", () => {
  let engine: BacktestingEngine;
  const STARTING_BALANCE = 100000;

  beforeEach(() => {
    engine = new BacktestingEngine(STARTING_BALANCE);
  });

  describe("initialization", () => {
    it("should initialize with correct starting balance", () => {
      const account = engine.getAccount();
      expect(account.startingBalance).toBe(STARTING_BALANCE);
      expect(account.balance).toBe(STARTING_BALANCE);
    });

    it("should have no historical data initially", () => {
      expect(engine.hasHistoricalData("BTC-USD")).toBe(false);
      expect(engine.getHistoricalData("BTC-USD")).toHaveLength(0);
    });
  });

  describe("runBacktest", () => {
    it("should throw error if no data loaded", async () => {
      const strategy = new MockStrategy();

      await expect(engine.runBacktest(strategy)).rejects.toThrow(
        "No historical data loaded"
      );
    });

    it("should process all candles with strategy", async () => {
      const strategy = new MockStrategy();

      // Manually inject historical data for testing
      const testCandles: CandleWithIndicators[] = [
        {
          timestamp: 1000,
          open: 50000,
          high: 50100,
          low: 49900,
          close: 50050,
          volume: 1000,
          lastUpdate: new Date(),
        },
        {
          timestamp: 2000,
          open: 50050,
          high: 50200,
          low: 50000,
          close: 50100,
          volume: 1100,
          lastUpdate: new Date(),
        },
        {
          timestamp: 3000,
          open: 50100,
          high: 50300,
          low: 50050,
          close: 50200,
          volume: 1200,
          lastUpdate: new Date(),
        },
      ];

      // Inject data directly
      (engine as any).historicalData.set("BTC-USD", testCandles);

      const result = await engine.runBacktest(strategy);

      // Verify strategy was called for each candle
      expect(strategy.getCallCount()).toBe(3);

      // Verify result structure
      expect(result.symbol).toBe("BTC-USD");
      expect(result.strategy).toBe("Mock Strategy");
      expect(result.metrics).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.equityCurve).toBeDefined();
    });

    it("should execute trades during backtest", async () => {
      const strategy = new MockStrategy();

      const testCandles: CandleWithIndicators[] = [
        {
          timestamp: 1000,
          open: 50000,
          high: 50000,
          low: 50000,
          close: 50000,
          volume: 1000,
          lastUpdate: new Date(),
        },
        {
          timestamp: 2000,
          open: 51000,
          high: 51000,
          low: 51000,
          close: 51000,
          volume: 1000,
          lastUpdate: new Date(),
        },
        {
          timestamp: 3000,
          open: 52000,
          high: 52000,
          low: 52000,
          close: 52000,
          volume: 1000,
          lastUpdate: new Date(),
        },
      ];

      (engine as any).historicalData.set("BTC-USD", testCandles);

      const result = await engine.runBacktest(strategy);

      // Should have executed buy and sell
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.metrics.totalTrades).toBeGreaterThan(0);
    });

    it("should emit progress events", async () => {
      const strategy = new MockStrategy();
      const progressCallback = mock(() => {});

      engine.on("progress", progressCallback);

      const testCandles: CandleWithIndicators[] = Array.from(
        { length: 150 },
        (_, i) => ({
          timestamp: i * 1000,
          open: 50000,
          high: 50000,
          low: 50000,
          close: 50000,
          volume: 1000,
          lastUpdate: new Date(),
        })
      );

      (engine as any).historicalData.set("BTC-USD", testCandles);

      await engine.runBacktest(strategy);

      // Should emit progress at least once
      expect(progressCallback).toHaveBeenCalled();
    });

    it("should close open positions at end", async () => {
      const strategy: TradingStrategy = {
        name: "Always Buy Strategy",
        symbol: "BTC-USD",
        onCandle: (candle: any) => {
          // Always buy on first candle, never sell
          return { side: "buy", type: "market", quantity: 1 };
        },
      };

      const testCandles: CandleWithIndicators[] = [
        {
          timestamp: 1000,
          open: 50000,
          high: 50000,
          low: 50000,
          close: 50000,
          volume: 1000,
          lastUpdate: new Date(),
        },
        {
          timestamp: 2000,
          open: 51000,
          high: 51000,
          low: 51000,
          close: 51000,
          volume: 1000,
          lastUpdate: new Date(),
        },
      ];

      (engine as any).historicalData.set("BTC-USD", testCandles);

      const result = await engine.runBacktest(strategy);

      // Position should be closed at end
      expect(engine.getPositionCount()).toBe(0);
      expect(result.trades.length).toBeGreaterThan(0);
    });
  });

  describe("utility methods", () => {
    it("should track current position during backtest", () => {
      const position = engine.getCurrentPosition();
      expect(position.index).toBe(0);
      expect(position.timestamp).toBe(0);
    });

    it("should clear historical data", () => {
      // Inject data
      (engine as any).historicalData.set("BTC-USD", [
        {
          timestamp: 1000,
          open: 50000,
          high: 50000,
          low: 50000,
          close: 50000,
          volume: 1000,
          lastUpdate: new Date(),
        },
      ]);

      expect(engine.hasHistoricalData("BTC-USD")).toBe(true);

      engine.clearHistoricalData();

      expect(engine.hasHistoricalData("BTC-USD")).toBe(false);
    });
  });
});
