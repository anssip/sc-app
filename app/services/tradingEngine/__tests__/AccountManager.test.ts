import { describe, it, expect, beforeEach } from "bun:test";
import { AccountManager } from "../AccountManager";
import type { Order, Trade, Position } from "~/types/trading";

describe("AccountManager", () => {
  let manager: AccountManager;
  const STARTING_BALANCE = 100000;

  beforeEach(() => {
    manager = new AccountManager(STARTING_BALANCE);
  });

  describe("initialization", () => {
    it("should initialize with starting balance", () => {
      const account = manager.getAccount();

      expect(account.balance).toBe(STARTING_BALANCE);
      expect(account.startingBalance).toBe(STARTING_BALANCE);
      expect(account.equity).toBe(STARTING_BALANCE);
      expect(account.buyingPower).toBe(STARTING_BALANCE);
      expect(account.totalPnL).toBe(0);
      expect(account.totalPnLPercent).toBe(0);
    });
  });

  describe("deductOrderCost", () => {
    it("should deduct cost for buy order", () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const success = manager.deductOrderCost(order, 50000);

      expect(success).toBe(true);
      expect(manager.getBalance()).toBe(50000);
      expect(manager.getBuyingPower()).toBe(50000);
    });

    it("should not deduct for sell order", () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "sell",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const success = manager.deductOrderCost(order, 50000);

      expect(success).toBe(true);
      expect(manager.getBalance()).toBe(STARTING_BALANCE);
    });

    it("should reject order with insufficient funds", () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 10,
        status: "pending",
        createdAt: Date.now(),
      };

      const success = manager.deductOrderCost(order, 50000); // 10 * 50000 = 500000 > 100000

      expect(success).toBe(false);
      expect(manager.getBalance()).toBe(STARTING_BALANCE);
    });
  });

  describe("creditOrderProceeds", () => {
    it("should credit proceeds for sell order", () => {
      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };

      manager.creditOrderProceeds(trade);

      expect(manager.getBalance()).toBe(150000); // 100000 + 50000
      expect(manager.getBuyingPower()).toBe(150000);
    });

    it("should not credit for buy order", () => {
      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "buy",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
      };

      manager.creditOrderProceeds(trade);

      expect(manager.getBalance()).toBe(STARTING_BALANCE);
    });

    it("should deduct fees from proceeds", () => {
      const trade: Trade = {
        id: "trade-1",
        symbol: "BTC-USD",
        side: "sell",
        quantity: 1,
        price: 50000,
        timestamp: Date.now(),
        type: "market",
        fees: 100,
      };

      manager.creditOrderProceeds(trade);

      expect(manager.getBalance()).toBe(149900); // 100000 + 50000 - 100
    });
  });

  describe("updateEquity", () => {
    it("should update equity based on open positions", () => {
      // Simulate buying BTC
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      manager.deductOrderCost(order, 50000);

      // Current price increased
      const positions: Position[] = [
        {
          symbol: "BTC-USD",
          quantity: 1,
          side: "long",
          avgEntryPrice: 50000,
          currentPrice: 52000,
          unrealizedPnL: 2000,
          unrealizedPnLPercent: 4,
          entryTime: Date.now(),
          costBasis: 50000,
        },
      ];

      const currentPrices = new Map([["BTC-USD", 52000]]);
      manager.updateEquity(positions, currentPrices);

      const account = manager.getAccount();
      expect(account.equity).toBe(102000); // 50000 (balance) + 52000 (position value)
      expect(account.totalPnL).toBe(2000); // 102000 - 100000
      expect(account.totalPnLPercent).toBe(2); // 2000 / 100000 * 100
    });

    it("should handle negative P&L", () => {
      // Simulate buying BTC
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      manager.deductOrderCost(order, 50000);

      // Current price decreased
      const positions: Position[] = [
        {
          symbol: "BTC-USD",
          quantity: 1,
          side: "long",
          avgEntryPrice: 50000,
          currentPrice: 45000,
          unrealizedPnL: -5000,
          unrealizedPnLPercent: -10,
          entryTime: Date.now(),
          costBasis: 50000,
        },
      ];

      const currentPrices = new Map([["BTC-USD", 45000]]);
      manager.updateEquity(positions, currentPrices);

      const account = manager.getAccount();
      expect(account.equity).toBe(95000); // 50000 + 45000
      expect(account.totalPnL).toBe(-5000);
      expect(account.totalPnLPercent).toBe(-5);
    });
  });

  describe("reset", () => {
    it("should reset account to starting balance", () => {
      // Make some trades
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };
      manager.deductOrderCost(order, 50000);

      // Reset
      manager.reset();

      const account = manager.getAccount();
      expect(account.balance).toBe(STARTING_BALANCE);
      expect(account.equity).toBe(STARTING_BALANCE);
      expect(account.buyingPower).toBe(STARTING_BALANCE);
      expect(account.totalPnL).toBe(0);
      expect(account.totalPnLPercent).toBe(0);
    });

    it("should reset with new starting balance", () => {
      manager.reset(50000);

      const account = manager.getAccount();
      expect(account.balance).toBe(50000);
      expect(account.startingBalance).toBe(50000);
      expect(account.equity).toBe(50000);
    });
  });

  describe("hasSufficientFunds", () => {
    it("should return true when funds are sufficient", () => {
      expect(manager.hasSufficientFunds(1, 50000)).toBe(true);
      expect(manager.hasSufficientFunds(2, 50000)).toBe(true);
    });

    it("should return false when funds are insufficient", () => {
      expect(manager.hasSufficientFunds(3, 50000)).toBe(false);
    });
  });

  describe("balance adjustments", () => {
    it("should add to balance", () => {
      manager.addToBalance(10000);

      expect(manager.getBalance()).toBe(110000);
      expect(manager.getBuyingPower()).toBe(110000);
      expect(manager.getEquity()).toBe(110000);
    });

    it("should deduct from balance", () => {
      manager.deductFromBalance(10000);

      expect(manager.getBalance()).toBe(90000);
      expect(manager.getBuyingPower()).toBe(90000);
      expect(manager.getEquity()).toBe(90000);
    });
  });

  describe("getters", () => {
    it("should return current values", () => {
      expect(manager.getBalance()).toBe(STARTING_BALANCE);
      expect(manager.getEquity()).toBe(STARTING_BALANCE);
      expect(manager.getBuyingPower()).toBe(STARTING_BALANCE);
      expect(manager.getTotalPnL()).toBe(0);
      expect(manager.getTotalPnLPercent()).toBe(0);
    });

    it("should return a copy of account object", () => {
      const account1 = manager.getAccount();
      const account2 = manager.getAccount();

      expect(account1).toEqual(account2);
      expect(account1).not.toBe(account2); // Different object references
    });
  });
});
