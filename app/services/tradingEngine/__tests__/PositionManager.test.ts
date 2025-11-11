import { describe, it, expect, beforeEach } from "bun:test";
import { PositionManager } from "../PositionManager";
import type { Trade } from "~/types/trading";

describe("PositionManager", () => {
  let manager: PositionManager;

  beforeEach(() => {
    manager = new PositionManager();
  });

  describe("createPosition", () => {
    it("should create a long position from a buy trade", () => {
      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };

      const position = manager.updatePosition(trade);

      expect(position.symbol).toBe("BTC-USD");
      expect(position.quantity).toBe(1);
      expect(position.side).toBe("long");
      expect(position.avgEntryPrice).toBe(50000);
      expect(position.costBasis).toBe(50000);
      expect(position.unrealizedPnL).toBe(0);
    });

    it("should create a short position from a sell trade", () => {
      const trade: Trade = {
        id: "trade-2",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };

      const position = manager.updatePosition(trade);

      expect(position.symbol).toBe("BTC-USD");
      expect(position.side).toBe("short");
      expect(position.avgEntryPrice).toBe(50000);
    });
  });

  describe("addToPosition", () => {
    it("should add to existing long position and update average price", () => {
      // First trade
      const trade1: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(trade1);

      // Second trade
      const trade2: Trade = {
        id: "trade-2",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 52000,
        timestamp: Date.now(),
        type: "market",
      };
      const position = manager.updatePosition(trade2);

      expect(position.quantity).toBe(2);
      expect(position.avgEntryPrice).toBe(51000); // (50000 + 52000) / 2
      expect(position.costBasis).toBe(102000);
    });
  });

  describe("reducePosition", () => {
    it("should partially close a position", () => {
      // Open position with 2 BTC
      const openTrade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 2,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(openTrade);

      // Sell 1 BTC
      const closeTrade: Trade = {
        id: "trade-2",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 1,
        price: 52000,
        timestamp: Date.now(),
        type: "market",
      };
      const position = manager.updatePosition(closeTrade);

      expect(position.quantity).toBe(1);
      expect(position.avgEntryPrice).toBe(50000);
      expect(position.costBasis).toBe(50000);
    });

    it("should fully close a position when sell quantity matches", () => {
      // Open position
      const openTrade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(openTrade);

      // Close position
      const closeTrade: Trade = {
        id: "trade-2",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 1,
        price: 52000,
        timestamp: Date.now(),
        type: "market",
      };
      const position = manager.updatePosition(closeTrade);

      expect(position.quantity).toBe(0);
      expect(manager.hasPosition("BTC-USD")).toBe(false);
    });

    it("should flip position when sell quantity exceeds long position", () => {
      // Open long position with 1 BTC
      const openTrade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(openTrade);

      // Sell 2 BTC (1 to close, 1 to go short)
      const flipTrade: Trade = {
        id: "trade-2",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 2,
        price: 52000,
        timestamp: Date.now(),
        type: "market",
      };
      const position = manager.updatePosition(flipTrade);

      expect(position.quantity).toBe(1);
      expect(position.side).toBe("short");
      expect(position.avgEntryPrice).toBe(52000);
    });
  });

  describe("calculatePnL", () => {
    it("should calculate unrealized P&L for long position with profit", () => {
      const position = {
        symbol: "BTC-USD",
        quantity: 1,
        side: "long" as const,
        avgEntryPrice: 50000,
        currentPrice: 52000,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        entryTime: Date.now(),
        costBasis: 50000,
      };

      const pnl = manager.calculatePnL(position, 52000);

      expect(pnl.unrealizedPnL).toBe(2000);
      expect(pnl.unrealizedPnLPercent).toBe(4);
      expect(pnl.positionValue).toBe(52000);
      expect(pnl.costBasis).toBe(50000);
    });

    it("should calculate unrealized P&L for long position with loss", () => {
      const position = {
        symbol: "BTC-USD",
        quantity: 1,
        side: "long" as const,
        avgEntryPrice: 50000,
        currentPrice: 48000,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        entryTime: Date.now(),
        costBasis: 50000,
      };

      const pnl = manager.calculatePnL(position, 48000);

      expect(pnl.unrealizedPnL).toBe(-2000);
      expect(pnl.unrealizedPnLPercent).toBe(-4);
    });

    it("should calculate unrealized P&L for short position with profit", () => {
      const position = {
        symbol: "BTC-USD",
        quantity: 1,
        side: "short" as const,
        avgEntryPrice: 50000,
        currentPrice: 48000,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        entryTime: Date.now(),
        costBasis: 50000,
      };

      const pnl = manager.calculatePnL(position, 48000);

      expect(pnl.unrealizedPnL).toBe(2000); // Short profits when price goes down
      expect(pnl.unrealizedPnLPercent).toBe(4);
    });

    it("should calculate unrealized P&L for short position with loss", () => {
      const position = {
        symbol: "BTC-USD",
        quantity: 1,
        side: "short" as const,
        avgEntryPrice: 50000,
        currentPrice: 52000,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        entryTime: Date.now(),
        costBasis: 50000,
      };

      const pnl = manager.calculatePnL(position, 52000);

      expect(pnl.unrealizedPnL).toBe(-2000); // Short loses when price goes up
      expect(pnl.unrealizedPnLPercent).toBe(-4);
    });
  });

  describe("closePosition", () => {
    it("should close a position and return completed trade", () => {
      // Open position
      const openTrade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(openTrade);

      // Close position
      const closedTrade = manager.closePosition("BTC-USD", 52000);

      expect(closedTrade).toBeDefined();
      expect(closedTrade!.symbol).toBe("BTC-USD");
      expect(closedTrade!.entryPrice).toBe(50000);
      expect(closedTrade!.exitPrice).toBe(52000);
      expect(closedTrade!.pnl).toBe(2000);
      expect(closedTrade!.pnlPercent).toBe(4);
      expect(manager.hasPosition("BTC-USD")).toBe(false);
    });

    it("should return null when closing non-existent position", () => {
      const closedTrade = manager.closePosition("BTC-USD", 52000);
      expect(closedTrade).toBeNull();
    });
  });

  describe("updatePositionPrice", () => {
    it("should update position price and recalculate P&L", () => {
      // Open position
      const openTrade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(openTrade);

      // Update price
      const position = manager.updatePositionPrice("BTC-USD", 52000);

      expect(position).toBeDefined();
      expect(position!.currentPrice).toBe(52000);
      expect(position!.unrealizedPnL).toBe(2000);
      expect(position!.unrealizedPnLPercent).toBe(4);
    });
  });

  describe("utility methods", () => {
    it("should get position count", () => {
      expect(manager.getPositionCount()).toBe(0);

      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(trade);

      expect(manager.getPositionCount()).toBe(1);
    });

    it("should check if position exists", () => {
      expect(manager.hasPosition("BTC-USD")).toBe(false);

      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(trade);

      expect(manager.hasPosition("BTC-USD")).toBe(true);
    });

    it("should clear all positions", () => {
      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };
      manager.updatePosition(trade);

      manager.clear();

      expect(manager.getPositionCount()).toBe(0);
      expect(manager.hasPosition("BTC-USD")).toBe(false);
    });
  });
});
