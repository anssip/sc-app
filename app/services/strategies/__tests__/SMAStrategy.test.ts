import { describe, it, expect } from "bun:test";
import { SMAStrategy } from "../SMAStrategy";
import type { CandleWithIndicators } from "~/services/indicators";

// Helper to create a candle with MA values
function createCandleWithMA(
  timestamp: number,
  close: number,
  ma50: number,
  ma200: number
): CandleWithIndicators {
  return {
    timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
    lastUpdate: new Date(),
    evaluations: [
      {
        id: "moving-averages",
        name: "MovingAveragesEvaluator",
        values: [
          { name: "ma50", timestamp, value: ma50, plot_ref: "ma50" },
          { name: "ma200", timestamp, value: ma200, plot_ref: "ma200" },
        ],
      },
    ],
  };
}

describe("SMAStrategy", () => {
  describe("configuration validation", () => {
    it("should create strategy with valid config", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      expect(strategy.name).toBe("SMA Crossover (50/200)");
      expect(strategy.symbol).toBe("BTC-USD");
    });

    it("should throw error if fast period >= slow period", () => {
      expect(() => {
        new SMAStrategy("BTC-USD", {
          fastPeriod: 200,
          slowPeriod: 50,
        });
      }).toThrow("Fast period must be less than slow period");
    });

    it("should throw error if periods are too small", () => {
      expect(() => {
        new SMAStrategy("BTC-USD", {
          fastPeriod: 1,
          slowPeriod: 50,
        });
      }).toThrow("MA periods must be at least 2");
    });
  });

  describe("signal generation", () => {
    it("should return null when MAs are not available", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      const candle: CandleWithIndicators = {
        timestamp: Date.now(),
        open: 50000,
        high: 50000,
        low: 50000,
        close: 50000,
        volume: 1000,
        lastUpdate: new Date(),
      };

      const signal = strategy.onCandle(candle);
      expect(signal).toBeNull();
    });

    it("should return null on first candle (no previous data)", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      const candle = createCandleWithMA(1000, 50000, 49000, 50000);
      const signal = strategy.onCandle(candle);
      expect(signal).toBeNull();
    });

    it("should generate buy signal on golden cross", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
        quantity: 1,
      });

      // First candle: fast MA below slow MA
      const candle1 = createCandleWithMA(1000, 50000, 49000, 50000);
      strategy.onCandle(candle1);

      // Second candle: fast MA crosses above slow MA (golden cross)
      const candle2 = createCandleWithMA(2000, 51000, 50100, 50000);
      const signal = strategy.onCandle(candle2);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("buy");
      expect(signal!.type).toBe("market");
      expect(signal!.quantity).toBe(1);
      expect(strategy.isInPosition()).toBe(true);
    });

    it("should generate sell signal on death cross", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      // First candle: fast MA below slow MA
      const candle1 = createCandleWithMA(1000, 50000, 49900, 50000);
      strategy.onCandle(candle1);

      // Second candle: fast MA crosses above slow MA (golden cross - enter position)
      const candle2 = createCandleWithMA(2000, 51000, 50200, 50000);
      strategy.onCandle(candle2);

      // Third candle: fast MA above slow MA
      const candle3 = createCandleWithMA(3000, 51000, 50100, 50050);
      strategy.onCandle(candle3);

      // Fourth candle: fast MA crosses below slow MA (death cross)
      const candle4 = createCandleWithMA(4000, 49000, 49900, 50050);
      const signal = strategy.onCandle(candle4);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("sell");
      expect(signal!.type).toBe("market");
      expect(strategy.isInPosition()).toBe(false);
    });

    it("should not generate multiple buy signals when already in position", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      // First golden cross
      const candle1 = createCandleWithMA(1000, 50000, 49000, 50000);
      strategy.onCandle(candle1);

      const candle2 = createCandleWithMA(2000, 51000, 50100, 50000);
      const signal1 = strategy.onCandle(candle2);
      expect(signal1).toBeDefined();

      // Second golden cross attempt (should be ignored)
      const candle3 = createCandleWithMA(3000, 52000, 50200, 50100);
      const signal2 = strategy.onCandle(candle3);
      expect(signal2).toBeNull();
    });
  });

  describe("state management", () => {
    it("should track position state correctly", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      expect(strategy.isInPosition()).toBe(false);

      // Enter position
      const candle1 = createCandleWithMA(1000, 50000, 49000, 50000);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithMA(2000, 51000, 50100, 50000);
      strategy.onCandle(candle2);

      expect(strategy.isInPosition()).toBe(true);
    });

    it("should reset state", () => {
      const strategy = new SMAStrategy("BTC-USD", {
        fastPeriod: 50,
        slowPeriod: 200,
      });

      // Process some candles
      const candle1 = createCandleWithMA(1000, 50000, 49000, 50000);
      strategy.onCandle(candle1);

      // Reset
      strategy.reset();

      expect(strategy.isInPosition()).toBe(false);
      expect(strategy.getCurrentMAValues().fastMA).toBeUndefined();
    });
  });
});
