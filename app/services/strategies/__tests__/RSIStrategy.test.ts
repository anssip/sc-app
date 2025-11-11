import { describe, it, expect } from "bun:test";
import { RSIStrategy } from "../RSIStrategy";
import type { CandleWithIndicators } from "~/services/indicators";

// Helper to create a candle with RSI value
function createCandleWithRSI(
  timestamp: number,
  close: number,
  rsi: number
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
        id: "rsi",
        name: "RSIEvaluator",
        values: [{ name: "rsi", timestamp, value: rsi, plot_ref: "rsi" }],
      },
    ],
  };
}

describe("RSIStrategy", () => {
  describe("configuration validation", () => {
    it("should create strategy with default config", () => {
      const strategy = new RSIStrategy("BTC-USD");

      expect(strategy.name).toBe("RSI Mean Reversion (14)");
      expect(strategy.symbol).toBe("BTC-USD");
    });

    it("should create strategy with custom config", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        period: 21,
        oversoldLevel: 20,
        overboughtLevel: 80,
      });

      expect(strategy.name).toBe("RSI Mean Reversion (21)");
    });

    it("should throw error if oversold >= overbought", () => {
      expect(() => {
        new RSIStrategy("BTC-USD", {
          oversoldLevel: 70,
          overboughtLevel: 30,
        });
      }).toThrow("Oversold level must be less than overbought level");
    });

    it("should throw error if levels out of range", () => {
      expect(() => {
        new RSIStrategy("BTC-USD", {
          oversoldLevel: -10,
          overboughtLevel: 80,
        });
      }).toThrow("RSI levels must be between 0 and 100");
    });
  });

  describe("signal generation", () => {
    it("should return null when RSI is not available", () => {
      const strategy = new RSIStrategy("BTC-USD");

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
      const strategy = new RSIStrategy("BTC-USD");

      const candle = createCandleWithRSI(1000, 50000, 25);
      const signal = strategy.onCandle(candle);
      expect(signal).toBeNull();
    });

    it("should generate buy signal when RSI crosses above oversold level", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        oversoldLevel: 30,
        quantity: 1,
      });

      // First candle: RSI below oversold
      const candle1 = createCandleWithRSI(1000, 45000, 25);
      strategy.onCandle(candle1);

      // Second candle: RSI crosses above oversold
      const candle2 = createCandleWithRSI(2000, 46000, 35);
      const signal = strategy.onCandle(candle2);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("buy");
      expect(signal!.type).toBe("market");
      expect(signal!.quantity).toBe(1);

      // Simulate trade execution
      strategy.onTrade({ side: "buy", price: 46000 });
      expect(strategy.isInPosition()).toBe(true);
    });

    it("should generate sell signal when RSI crosses below overbought level", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        overboughtLevel: 70,
      });

      // Enter position first
      const candle1 = createCandleWithRSI(1000, 45000, 25);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithRSI(2000, 46000, 35);
      const signal2 = strategy.onCandle(candle2);

      // Simulate trade execution to enter position
      strategy.onTrade({ side: "buy", price: 46000 });

      // RSI in overbought
      const candle3 = createCandleWithRSI(3000, 52000, 75);
      strategy.onCandle(candle3);

      // RSI crosses below overbought
      const candle4 = createCandleWithRSI(4000, 51000, 65);
      const signal = strategy.onCandle(candle4);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("sell");
      expect(signal!.type).toBe("market");

      // Simulate trade execution to exit position
      strategy.onTrade({ side: "sell", price: 51000 });
      expect(strategy.isInPosition()).toBe(false);
    });

    it("should not generate buy signal if already in position", () => {
      const strategy = new RSIStrategy("BTC-USD");

      // Enter position
      const candle1 = createCandleWithRSI(1000, 45000, 25);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithRSI(2000, 46000, 35);
      const signal1 = strategy.onCandle(candle2);
      expect(signal1).toBeDefined();

      // Simulate trade execution to enter position
      strategy.onTrade({ side: "buy", price: 46000 });

      // Second buy signal attempt (should be ignored)
      const candle3 = createCandleWithRSI(3000, 45000, 25);
      strategy.onCandle(candle3);
      const candle4 = createCandleWithRSI(4000, 46000, 35);
      const signal2 = strategy.onCandle(candle4);
      expect(signal2).toBeNull();
    });
  });

  describe("stop-loss and take-profit", () => {
    it("should trigger stop-loss when enabled", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        useStopLoss: true,
        stopLossPercent: 2,
      });

      // Enter position at 50000
      const candle1 = createCandleWithRSI(1000, 49000, 25);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithRSI(2000, 50000, 35);
      strategy.onCandle(candle2);

      // Simulate trade execution to enter position
      strategy.onTrade({ side: "buy", price: 50000 });
      expect(strategy.getEntryPrice()).toBe(50000);

      // Price drops to 48900 (2.2% loss, triggers 2% stop-loss)
      const candle3 = createCandleWithRSI(3000, 48900, 40);
      const signal = strategy.onCandle(candle3);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("sell");

      // Simulate trade execution to exit position
      strategy.onTrade({ side: "sell", price: 48900 });
      expect(strategy.isInPosition()).toBe(false);
    });

    it("should trigger take-profit when enabled", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        useTakeProfit: true,
        takeProfitPercent: 5,
      });

      // Enter position at 50000
      const candle1 = createCandleWithRSI(1000, 49000, 25);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithRSI(2000, 50000, 35);
      strategy.onCandle(candle2);

      // Simulate trade execution to enter position
      strategy.onTrade({ side: "buy", price: 50000 });

      // Price rises to 52600 (5.2% gain, triggers 5% take-profit)
      const candle3 = createCandleWithRSI(3000, 52600, 60);
      const signal = strategy.onCandle(candle3);

      expect(signal).toBeDefined();
      expect(signal!.side).toBe("sell");

      // Simulate trade execution to exit position
      strategy.onTrade({ side: "sell", price: 52600 });
      expect(strategy.isInPosition()).toBe(false);
    });
  });

  describe("RSI level checks", () => {
    it("should identify oversold conditions", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        oversoldLevel: 30,
      });

      expect(strategy.isOversold(25)).toBe(true);
      expect(strategy.isOversold(30)).toBe(false);
      expect(strategy.isOversold(35)).toBe(false);
    });

    it("should identify overbought conditions", () => {
      const strategy = new RSIStrategy("BTC-USD", {
        overboughtLevel: 70,
      });

      expect(strategy.isOverbought(75)).toBe(true);
      expect(strategy.isOverbought(70)).toBe(false);
      expect(strategy.isOverbought(65)).toBe(false);
    });
  });

  describe("state management", () => {
    it("should track position and entry price", () => {
      const strategy = new RSIStrategy("BTC-USD");

      expect(strategy.isInPosition()).toBe(false);
      expect(strategy.getEntryPrice()).toBeUndefined();

      // Enter position
      const candle1 = createCandleWithRSI(1000, 45000, 25);
      strategy.onCandle(candle1);
      const candle2 = createCandleWithRSI(2000, 46000, 35);
      strategy.onCandle(candle2);

      // Simulate trade execution to enter position
      strategy.onTrade({ side: "buy", price: 46000 });

      expect(strategy.isInPosition()).toBe(true);
      expect(strategy.getEntryPrice()).toBe(46000);
    });

    it("should reset state", () => {
      const strategy = new RSIStrategy("BTC-USD");

      // Process candles
      const candle1 = createCandleWithRSI(1000, 45000, 25);
      strategy.onCandle(candle1);

      // Reset
      strategy.reset();

      expect(strategy.isInPosition()).toBe(false);
      expect(strategy.getEntryPrice()).toBeUndefined();
      expect(strategy.getCurrentRSI()).toBeUndefined();
    });
  });
});
