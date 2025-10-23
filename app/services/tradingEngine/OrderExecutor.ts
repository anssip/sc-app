import type { Order, Trade } from "~/types/trading";

/**
 * Handles order execution logic for different order types
 */
export class OrderExecutor {
  /**
   * Generate a unique trade ID
   */
  private generateTradeId(): string {
    return `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute a market order at current price
   * @param order The order to execute
   * @param currentPrice Current market price
   * @returns Executed trade
   */
  executeMarketOrder(order: Order, currentPrice: number): Trade {
    return {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: currentPrice,
      timestamp: Date.now(),
      type: "market",
      metadata: order.metadata,
    };
  }

  /**
   * Check if a limit order should execute and execute if conditions met
   * @param order The limit order to check
   * @param currentPrice Current market price
   * @returns Executed trade or null if conditions not met
   */
  checkLimitOrder(order: Order, currentPrice: number): Trade | null {
    // Limit buy: execute if current price <= limit price
    if (order.side === "buy" && currentPrice <= (order.price || 0)) {
      return this.executeLimitOrder(order, order.price!);
    }

    // Limit sell: execute if current price >= limit price
    if (order.side === "sell" && currentPrice >= (order.price || 0)) {
      return this.executeLimitOrder(order, order.price!);
    }

    return null;
  }

  /**
   * Execute a limit order at specified price
   * @param order The order to execute
   * @param limitPrice The limit price
   * @returns Executed trade
   */
  executeLimitOrder(order: Order, limitPrice: number): Trade {
    return {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: limitPrice,
      timestamp: Date.now(),
      type: "limit",
      metadata: order.metadata,
    };
  }

  /**
   * Check if a stop order should trigger and execute if conditions met
   * @param order The stop order to check
   * @param currentPrice Current market price
   * @returns Executed trade or null if conditions not met
   */
  checkStopOrder(order: Order, currentPrice: number): Trade | null {
    // Stop buy: trigger if current price >= stop price (buying on breakout)
    if (order.side === "buy" && currentPrice >= (order.price || 0)) {
      return this.executeStopOrder(order, currentPrice);
    }

    // Stop sell: trigger if current price <= stop price (stop-loss)
    if (order.side === "sell" && currentPrice <= (order.price || 0)) {
      return this.executeStopOrder(order, currentPrice);
    }

    return null;
  }

  /**
   * Execute a stop order at market price
   * @param order The order to execute
   * @param marketPrice Current market price
   * @returns Executed trade
   */
  executeStopOrder(order: Order, marketPrice: number): Trade {
    return {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: marketPrice,
      timestamp: Date.now(),
      type: "stop",
      metadata: order.metadata,
    };
  }

  /**
   * Check if a stop-limit order should trigger and execute
   * @param order The stop-limit order to check
   * @param currentPrice Current market price
   * @returns Executed trade or null if conditions not met
   */
  checkStopLimitOrder(order: Order, currentPrice: number): Trade | null {
    if (!order.stopPrice) {
      return null;
    }

    // For stop-limit orders:
    // 1. First check if stop price is triggered
    // 2. Then check if limit price can be filled

    // Stop-limit buy: trigger when price >= stop price, then buy at limit if price <= limit
    if (order.side === "buy") {
      if (currentPrice >= order.stopPrice) {
        // Stop triggered, now check limit
        if (currentPrice <= (order.price || Infinity)) {
          return this.executeLimitOrder(order, order.price!);
        }
      }
    }

    // Stop-limit sell: trigger when price <= stop price, then sell at limit if price >= limit
    if (order.side === "sell") {
      if (currentPrice <= order.stopPrice) {
        // Stop triggered, now check limit
        if (currentPrice >= (order.price || 0)) {
          return this.executeLimitOrder(order, order.price!);
        }
      }
    }

    return null;
  }
}
