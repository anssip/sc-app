import { describe, it, expect, beforeEach, mock } from "bun:test";
import { TradingEngine } from "../TradingEngine";
import type { Order } from "~/types/trading";

// Mock implementation of TradingEngine for testing
class MockTradingEngine extends TradingEngine {
  private mockPrices: Map<string, number> = new Map();

  setMockPrice(symbol: string, price: number): void {
    this.mockPrices.set(symbol, price);
  }

  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    return this.mockPrices.get(symbol) || 0;
  }
}

describe("TradingEngine", () => {
  let engine: MockTradingEngine;
  const STARTING_BALANCE = 100000;

  beforeEach(() => {
    engine = new MockTradingEngine(STARTING_BALANCE);
    engine.setMockPrice("BTC-USD", 50000);
    engine.setMockPrice("ETH-USD", 3000);
  });

  describe("initialization", () => {
    it("should initialize with correct starting balance", () => {
      const account = engine.getAccount();
      expect(account.startingBalance).toBe(STARTING_BALANCE);
      expect(account.balance).toBe(STARTING_BALANCE);
    });

    it("should have no initial positions or trades", () => {
      expect(engine.getPositions()).toHaveLength(0);
      expect(engine.getTrades()).toHaveLength(0);
      expect(engine.getPositionCount()).toBe(0);
    });
  });

  describe("executeOrder - market orders", () => {
    it("should execute a market buy order", async () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = await engine.executeOrder(order);

      expect(trade).toBeDefined();
      expect(trade!.symbol).toBe("BTC-USD");
      expect(trade!.side).toBe("buy");
      expect(trade!.price).toBe(50000);

      // Check account balance
      const account = engine.getAccount();
      expect(account.balance).toBe(50000); // 100000 - 50000

      // Check position
      expect(engine.hasPosition("BTC-USD")).toBe(true);
      const position = engine.getPosition("BTC-USD");
      expect(position!.quantity).toBe(1);
      expect(position!.side).toBe("long");
    });

    it("should execute a market sell order", async () => {
      // First buy
      const buyOrder: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(buyOrder);

      // Then sell
      engine.setMockPrice("BTC-USD", 52000);
      const sellOrder: Order = {
        id: "order-2",
        symbol: "BTC-USD",
        side: "sell",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = await engine.executeOrder(sellOrder);

      expect(trade).toBeDefined();
      expect(trade!.price).toBe(52000);

      // Position should be closed
      expect(engine.hasPosition("BTC-USD")).toBe(false);

      // Check account balance increased
      const account = engine.getAccount();
      expect(account.balance).toBe(102000); // 50000 + 52000
    });

    it("should reject order with insufficient funds", async () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 10, // 10 * 50000 = 500000 > 100000
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = await engine.executeOrder(order);

      expect(trade).toBeNull();
      expect(engine.getPositionCount()).toBe(0);
    });

    it("should reject order when price is not available", async () => {
      const order: Order = {
        id: "order-1",
        symbol: "UNKNOWN-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = await engine.executeOrder(order);

      expect(trade).toBeNull();
    });
  });

  describe("events", () => {
    it("should emit trade-executed event", async () => {
      const tradeExecutedCallback = mock(() => {});
      engine.on("trade-executed", tradeExecutedCallback);

      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      await engine.executeOrder(order);

      expect(tradeExecutedCallback).toHaveBeenCalled();
    });

    it("should emit order-rejected event for insufficient funds", async () => {
      const orderRejectedCallback = mock(() => {});
      engine.on("order-rejected", orderRejectedCallback);

      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 10,
        status: "pending",
        createdAt: Date.now(),
      };

      await engine.executeOrder(order);

      expect(orderRejectedCallback).toHaveBeenCalled();
    });

    it("should emit account-updated event", async () => {
      const accountUpdatedCallback = mock(() => {});
      engine.on("account-updated", accountUpdatedCallback);

      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      await engine.executeOrder(order);

      expect(accountUpdatedCallback).toHaveBeenCalled();
    });

    it("should emit reset event", () => {
      const resetCallback = mock(() => {});
      engine.on("reset", resetCallback);

      engine.reset();

      expect(resetCallback).toHaveBeenCalled();
    });
  });

  describe("closePosition", () => {
    it("should close an open position", async () => {
      // Open position
      const buyOrder: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(buyOrder);

      // Close position
      engine.setMockPrice("BTC-USD", 52000);
      const closedTrade = await engine.closePosition("BTC-USD");

      expect(closedTrade).toBeDefined();
      expect(closedTrade!.entryPrice).toBe(50000);
      expect(closedTrade!.exitPrice).toBe(52000);
      expect(closedTrade!.pnl).toBe(2000);
      expect(engine.hasPosition("BTC-USD")).toBe(false);

      // Should be added to trades
      const trades = engine.getTrades();
      expect(trades).toHaveLength(1);
      expect(trades[0]).toEqual(closedTrade);
    });

    it("should return null when closing non-existent position", async () => {
      const closedTrade = await engine.closePosition("BTC-USD");
      expect(closedTrade).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset all state", async () => {
      // Execute some trades
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(order);

      // Reset
      engine.reset();

      // Check all state is reset
      expect(engine.getPositionCount()).toBe(0);
      expect(engine.getTrades()).toHaveLength(0);
      const account = engine.getAccount();
      expect(account.balance).toBe(STARTING_BALANCE);
      expect(account.totalPnL).toBe(0);
    });

    it("should reset with new starting balance", async () => {
      engine.reset(50000);

      const account = engine.getAccount();
      expect(account.startingBalance).toBe(50000);
      expect(account.balance).toBe(50000);
    });
  });

  describe("utility methods", () => {
    it("should check sufficient funds", () => {
      expect(engine.hasSufficientFunds(1, 50000)).toBe(true);
      expect(engine.hasSufficientFunds(10, 50000)).toBe(false);
    });

    it("should get positions array", async () => {
      const order1: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(order1);

      const order2: Order = {
        id: "order-2",
        symbol: "ETH-USD",
        side: "buy",
        type: "market",
        quantity: 10,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(order2);

      const positions = engine.getPositions();
      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe("BTC-USD");
      expect(positions[1].symbol).toBe("ETH-USD");
    });

    it("should get specific position", async () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(order);

      const position = engine.getPosition("BTC-USD");
      expect(position).toBeDefined();
      expect(position!.symbol).toBe("BTC-USD");

      const nonExistent = engine.getPosition("UNKNOWN-USD");
      expect(nonExistent).toBeUndefined();
    });

    it("should get trades copy", async () => {
      // Open and close position
      const buyOrder: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      await engine.executeOrder(buyOrder);
      await engine.closePosition("BTC-USD");

      const trades1 = engine.getTrades();
      const trades2 = engine.getTrades();

      // Should return different array instances (copies)
      expect(trades1).not.toBe(trades2);
      expect(trades1).toEqual(trades2);
    });
  });

  describe("event emitter", () => {
    it("should allow adding and removing listeners", () => {
      const callback = mock(() => {});

      engine.on("reset", callback);
      engine.reset();
      expect(callback).toHaveBeenCalledTimes(1);

      engine.off("reset", callback);
      engine.reset();
      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should allow removing all listeners for an event", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      engine.on("reset", callback1);
      engine.on("reset", callback2);

      engine.removeAllListeners("reset");
      engine.reset();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("should allow removing all listeners", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      engine.on("reset", callback1);
      engine.on("account-updated", callback2);

      engine.removeAllListeners();
      engine.reset();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
