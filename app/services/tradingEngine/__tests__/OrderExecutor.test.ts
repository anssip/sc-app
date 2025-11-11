import { describe, it, expect, beforeEach } from "bun:test";
import { OrderExecutor } from "../OrderExecutor";
import type { Order } from "~/types/trading";

describe("OrderExecutor", () => {
  let executor: OrderExecutor;

  beforeEach(() => {
    executor = new OrderExecutor();
  });

  describe("executeMarketOrder", () => {
    it("should execute a market buy order at current price", () => {
      const order: Order = {
        id: "order-1",
        symbol: "BTC-USD",
        side: "buy",
        type: "market",
        quantity: 1,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.executeMarketOrder(order, 50000);

      expect(trade).toBeDefined();
      expect(trade.symbol).toBe("BTC-USD");
      expect(trade.side).toBe("buy");
      expect(trade.quantity).toBe(1);
      expect(trade.price).toBe(50000);
      expect(trade.type).toBe("market");
      expect(trade.orderId).toBe("order-1");
    });

    it("should execute a market sell order at current price", () => {
      const order: Order = {
        id: "order-2",
        symbol: "ETH-USD",
        side: "sell",
        type: "market",
        quantity: 10,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.executeMarketOrder(order, 3000);

      expect(trade).toBeDefined();
      expect(trade.symbol).toBe("ETH-USD");
      expect(trade.side).toBe("sell");
      expect(trade.quantity).toBe(10);
      expect(trade.price).toBe(3000);
    });
  });

  describe("checkLimitOrder", () => {
    it("should execute limit buy when current price <= limit price", () => {
      const order: Order = {
        id: "order-3",
        symbol: "BTC-USD",
        side: "buy",
        type: "limit",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      // Price at limit
      let trade = executor.checkLimitOrder(order, 50000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);

      // Price below limit
      trade = executor.checkLimitOrder(order, 49000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);
    });

    it("should not execute limit buy when current price > limit price", () => {
      const order: Order = {
        id: "order-4",
        symbol: "BTC-USD",
        side: "buy",
        type: "limit",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.checkLimitOrder(order, 51000);
      expect(trade).toBeNull();
    });

    it("should execute limit sell when current price >= limit price", () => {
      const order: Order = {
        id: "order-5",
        symbol: "BTC-USD",
        side: "sell",
        type: "limit",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      // Price at limit
      let trade = executor.checkLimitOrder(order, 50000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);

      // Price above limit
      trade = executor.checkLimitOrder(order, 51000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);
    });

    it("should not execute limit sell when current price < limit price", () => {
      const order: Order = {
        id: "order-6",
        symbol: "BTC-USD",
        side: "sell",
        type: "limit",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.checkLimitOrder(order, 49000);
      expect(trade).toBeNull();
    });
  });

  describe("checkStopOrder", () => {
    it("should execute stop buy when current price >= stop price", () => {
      const order: Order = {
        id: "order-7",
        symbol: "BTC-USD",
        side: "buy",
        type: "stop",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      // Price at stop
      let trade = executor.checkStopOrder(order, 50000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);

      // Price above stop
      trade = executor.checkStopOrder(order, 51000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(51000);
    });

    it("should not execute stop buy when current price < stop price", () => {
      const order: Order = {
        id: "order-8",
        symbol: "BTC-USD",
        side: "buy",
        type: "stop",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.checkStopOrder(order, 49000);
      expect(trade).toBeNull();
    });

    it("should execute stop sell when current price <= stop price", () => {
      const order: Order = {
        id: "order-9",
        symbol: "BTC-USD",
        side: "sell",
        type: "stop",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      // Price at stop
      let trade = executor.checkStopOrder(order, 50000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50000);

      // Price below stop
      trade = executor.checkStopOrder(order, 49000);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(49000);
    });

    it("should not execute stop sell when current price > stop price", () => {
      const order: Order = {
        id: "order-10",
        symbol: "BTC-USD",
        side: "sell",
        type: "stop",
        quantity: 1,
        price: 50000,
        status: "pending",
        createdAt: Date.now(),
      };

      const trade = executor.checkStopOrder(order, 51000);
      expect(trade).toBeNull();
    });
  });

  describe("checkStopLimitOrder", () => {
    it("should execute stop-limit buy when stop triggered and limit met", () => {
      const order: Order = {
        id: "order-11",
        symbol: "BTC-USD",
        side: "buy",
        type: "stop_limit",
        quantity: 1,
        stopPrice: 50000,
        price: 50500,
        status: "pending",
        createdAt: Date.now(),
      };

      // Stop triggered at 50000, current price 50200 meets limit 50500
      const trade = executor.checkStopLimitOrder(order, 50200);
      expect(trade).toBeDefined();
      expect(trade!.price).toBe(50500);
    });

    it("should not execute stop-limit buy when stop not triggered", () => {
      const order: Order = {
        id: "order-12",
        symbol: "BTC-USD",
        side: "buy",
        type: "stop_limit",
        quantity: 1,
        stopPrice: 50000,
        price: 50500,
        status: "pending",
        createdAt: Date.now(),
      };

      // Price below stop
      const trade = executor.checkStopLimitOrder(order, 49000);
      expect(trade).toBeNull();
    });

    it("should not execute stop-limit buy when stop triggered but limit not met", () => {
      const order: Order = {
        id: "order-13",
        symbol: "BTC-USD",
        side: "buy",
        type: "stop_limit",
        quantity: 1,
        stopPrice: 50000,
        price: 50500,
        status: "pending",
        createdAt: Date.now(),
      };

      // Stop triggered but price 51000 > limit 50500
      const trade = executor.checkStopLimitOrder(order, 51000);
      expect(trade).toBeNull();
    });
  });
});
