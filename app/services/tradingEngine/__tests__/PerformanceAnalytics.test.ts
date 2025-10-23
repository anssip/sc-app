import { describe, it, expect, beforeEach } from "bun:test";
import { PerformanceAnalytics } from "../PerformanceAnalytics";
import type { CompletedTrade, TradingAccount } from "~/types/trading";

describe("PerformanceAnalytics", () => {
  let analytics: PerformanceAnalytics;

  beforeEach(() => {
    analytics = new PerformanceAnalytics();
  });

  describe("calculateMetrics", () => {
    it("should return empty metrics for no trades", () => {
      const account: TradingAccount = {
        balance: 100000,
        startingBalance: 100000,
        equity: 100000,
        buyingPower: 100000,
        totalPnL: 0,
        totalPnLPercent: 0,
      };

      const metrics = analytics.calculateMetrics([], account);

      expect(metrics.totalTrades).toBe(0);
      expect(metrics.winningTrades).toBe(0);
      expect(metrics.losingTrades).toBe(0);
      expect(metrics.winRate).toBe(0);
    });

    it("should calculate metrics for winning trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: Date.now() - 60000,
          exitTime: Date.now(),
          duration: 60000,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 51000,
          exitPrice: 54000,
          pnl: 3000,
          pnlPercent: 5.88,
          entryTime: Date.now() - 60000,
          exitTime: Date.now(),
          duration: 60000,
        },
      ];

      const account: TradingAccount = {
        balance: 100000,
        startingBalance: 100000,
        equity: 105000,
        buyingPower: 100000,
        totalPnL: 5000,
        totalPnLPercent: 5,
      };

      const metrics = analytics.calculateMetrics(trades, account);

      expect(metrics.totalTrades).toBe(2);
      expect(metrics.winningTrades).toBe(2);
      expect(metrics.losingTrades).toBe(0);
      expect(metrics.winRate).toBe(100);
      expect(metrics.avgWin).toBe(2500); // (2000 + 3000) / 2
      expect(metrics.largestWin).toBe(3000);
      expect(metrics.totalPnL).toBe(5000);
    });

    it("should calculate metrics for mixed trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: Date.now() - 60000,
          exitTime: Date.now(),
          duration: 60000,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 51000,
          exitPrice: 49000,
          pnl: -2000,
          pnlPercent: -3.92,
          entryTime: Date.now() - 60000,
          exitTime: Date.now(),
          duration: 60000,
        },
        {
          id: "trade-3",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 54000,
          pnl: 4000,
          pnlPercent: 8,
          entryTime: Date.now() - 60000,
          exitTime: Date.now(),
          duration: 60000,
        },
      ];

      const account: TradingAccount = {
        balance: 100000,
        startingBalance: 100000,
        equity: 104000,
        buyingPower: 100000,
        totalPnL: 4000,
        totalPnLPercent: 4,
      };

      const metrics = analytics.calculateMetrics(trades, account);

      expect(metrics.totalTrades).toBe(3);
      expect(metrics.winningTrades).toBe(2);
      expect(metrics.losingTrades).toBe(1);
      expect(metrics.winRate).toBe(66.66666666666666);
      expect(metrics.avgWin).toBe(3000); // (2000 + 4000) / 2
      expect(metrics.avgLoss).toBe(2000);
      expect(metrics.profitFactor).toBe(1.5); // 3000 / 2000
      expect(metrics.largestWin).toBe(4000);
      expect(metrics.largestLoss).toBe(-2000);
      expect(metrics.expectancy).toBeCloseTo(1333.33, 1); // 4000 / 3
    });
  });

  describe("calculateAvgDuration", () => {
    it("should calculate average trade duration", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 60000,
          duration: 60000,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 120000,
          duration: 120000,
        },
      ];

      const avgDuration = analytics.calculateAvgDuration(trades);
      expect(avgDuration).toBe(90000); // (60000 + 120000) / 2
    });

    it("should return 0 for no trades", () => {
      const avgDuration = analytics.calculateAvgDuration([]);
      expect(avgDuration).toBe(0);
    });
  });

  describe("calculateMaxDrawdown", () => {
    it("should calculate maximum drawdown", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1,
          duration: 1,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 52000,
          exitPrice: 47000,
          pnl: -5000, // Drawdown here
          pnlPercent: -9.62,
          entryTime: 1,
          exitTime: 2,
          duration: 1,
        },
        {
          id: "trade-3",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 47000,
          exitPrice: 50000,
          pnl: 3000,
          pnlPercent: 6.38,
          entryTime: 2,
          exitTime: 3,
          duration: 1,
        },
      ];

      const maxDrawdown = analytics.calculateMaxDrawdown(trades, 100000);

      // Balance progression: 100000 -> 102000 (peak) -> 97000 (drawdown) -> 100000
      // Drawdown = (102000 - 97000) / 102000 * 100 = 4.90%
      expect(maxDrawdown).toBeCloseTo(4.9, 1);
    });

    it("should return 0 for no trades", () => {
      const maxDrawdown = analytics.calculateMaxDrawdown([], 100000);
      expect(maxDrawdown).toBe(0);
    });

    it("should return 0 when only winning trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1,
          duration: 1,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 52000,
          exitPrice: 54000,
          pnl: 2000,
          pnlPercent: 3.85,
          entryTime: 1,
          exitTime: 2,
          duration: 1,
        },
      ];

      const maxDrawdown = analytics.calculateMaxDrawdown(trades, 100000);
      expect(maxDrawdown).toBe(0);
    });
  });

  describe("calculateSharpeRatio", () => {
    it("should calculate Sharpe ratio for trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1,
          duration: 1,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 51000,
          pnl: 1000,
          pnlPercent: 2,
          entryTime: 1,
          exitTime: 2,
          duration: 1,
        },
        {
          id: "trade-3",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 54000,
          pnl: 4000,
          pnlPercent: 8,
          entryTime: 2,
          exitTime: 3,
          duration: 1,
        },
      ];

      const account: TradingAccount = {
        balance: 100000,
        startingBalance: 100000,
        equity: 107000,
        buyingPower: 100000,
        totalPnL: 7000,
        totalPnLPercent: 7,
      };

      const sharpeRatio = analytics.calculateSharpeRatio(trades, account);
      expect(sharpeRatio).toBeGreaterThan(0);
    });

    it("should return 0 for less than 2 trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1,
          duration: 1,
        },
      ];

      const account: TradingAccount = {
        balance: 100000,
        startingBalance: 100000,
        equity: 102000,
        buyingPower: 100000,
        totalPnL: 2000,
        totalPnLPercent: 2,
      };

      const sharpeRatio = analytics.calculateSharpeRatio(trades, account);
      expect(sharpeRatio).toBe(0);
    });
  });

  describe("generateEquityCurve", () => {
    it("should generate equity curve from trades", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1000,
          duration: 1000,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 52000,
          exitPrice: 54000,
          pnl: 2000,
          pnlPercent: 3.85,
          entryTime: 1000,
          exitTime: 2000,
          duration: 1000,
        },
      ];

      const curve = analytics.generateEquityCurve(trades, 100000);

      expect(curve).toHaveLength(3); // Start + 2 trades
      expect(curve[0]).toEqual({ timestamp: 0, equity: 100000 });
      expect(curve[1]).toEqual({ timestamp: 1000, equity: 102000 });
      expect(curve[2]).toEqual({ timestamp: 2000, equity: 104000 });
    });
  });

  describe("calculateDrawdownCurve", () => {
    it("should generate drawdown curve", () => {
      const trades: CompletedTrade[] = [
        {
          id: "trade-1",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 50000,
          exitPrice: 52000,
          pnl: 2000,
          pnlPercent: 4,
          entryTime: 0,
          exitTime: 1000,
          duration: 1000,
        },
        {
          id: "trade-2",
          symbol: "BTC-USD",
          side: "long",
          quantity: 1,
          entryPrice: 52000,
          exitPrice: 48000,
          pnl: -4000,
          pnlPercent: -7.69,
          entryTime: 1000,
          exitTime: 2000,
          duration: 1000,
        },
      ];

      const curve = analytics.calculateDrawdownCurve(trades, 100000);

      expect(curve).toHaveLength(3); // Start + 2 trades
      expect(curve[0].drawdownPercent).toBe(0);
      expect(curve[1].drawdownPercent).toBe(0); // New peak
      expect(curve[2].drawdownPercent).toBeCloseTo(3.92, 1); // Drawdown from 102000 to 98000
    });
  });
});
