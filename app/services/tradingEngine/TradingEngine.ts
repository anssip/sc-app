import type {
  Order,
  Trade,
  Position,
  TradingAccount,
  CompletedTrade,
  TradingEngineEvent,
  TradeExecutedEvent,
  OrderRejectedEvent,
  PositionUpdatedEvent,
} from "~/types/trading";
import { OrderExecutor } from "./OrderExecutor";
import { PositionManager } from "./PositionManager";
import { AccountManager } from "./AccountManager";

/**
 * Simple EventEmitter implementation for trading engine events
 */
class EventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  /**
   * Register an event listener
   * @param event Event name
   * @param callback Callback function
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unregister an event listener
   * @param event Event name
   * @param callback Callback function
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Event arguments
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Abstract base class for trading engines
 * Provides core functionality for order execution, position management, and account tracking
 */
export abstract class TradingEngine extends EventEmitter {
  protected orderExecutor: OrderExecutor;
  protected positionManager: PositionManager;
  protected accountManager: AccountManager;
  protected trades: CompletedTrade[] = [];

  /**
   * Create a new trading engine
   * @param startingBalance Initial account balance
   */
  constructor(startingBalance: number) {
    super();
    this.orderExecutor = new OrderExecutor();
    this.positionManager = new PositionManager();
    this.accountManager = new AccountManager(startingBalance);
  }

  /**
   * Get price at a specific timestamp (to be implemented by subclasses)
   * @param symbol Symbol to get price for
   * @param timestamp Timestamp in milliseconds
   * @returns Price at timestamp
   */
  abstract getPriceAt(symbol: string, timestamp: number): Promise<number>;

  /**
   * Execute an order
   * @param order Order to execute
   * @returns Executed trade or null if rejected
   */
  async executeOrder(order: Order): Promise<Trade | null> {
    try {
      const currentPrice = await this.getPriceAt(order.symbol, Date.now());

      if (currentPrice === 0) {
        this.emit("order-rejected", {
          order,
          reason: "Price not available",
        } as OrderRejectedEvent);
        return null;
      }

      // Check if we have enough buying power for buy orders
      if (order.side === "buy") {
        const cost = order.quantity * currentPrice;
        if (!this.accountManager.deductOrderCost(order, currentPrice)) {
          this.emit("order-rejected", {
            order,
            reason: "Insufficient funds",
          } as OrderRejectedEvent);
          return null;
        }
      }

      // Track position before trade to detect if it gets closed
      const positionBefore = this.positionManager.getPosition(order.symbol);
      const hadPosition = positionBefore !== undefined;

      // Execute based on order type
      let trade: Trade | null = null;

      if (order.type === "market") {
        trade = this.orderExecutor.executeMarketOrder(order, currentPrice);
      } else if (order.type === "limit") {
        trade = this.orderExecutor.checkLimitOrder(order, currentPrice);
      } else if (order.type === "stop") {
        trade = this.orderExecutor.checkStopOrder(order, currentPrice);
      } else if (order.type === "stop_limit") {
        trade = this.orderExecutor.checkStopLimitOrder(order, currentPrice);
      }

      if (trade) {
        // Update position
        const position = this.positionManager.updatePosition(trade);

        // Credit proceeds if selling
        if (order.side === "sell") {
          this.accountManager.creditOrderProceeds(trade);
        }

        // Check if position was closed by this trade
        if (hadPosition && position.quantity === 0) {
          // Position was fully closed - create completed trade
          const completedTrade: CompletedTrade = {
            id: trade.id,
            symbol: trade.symbol,
            side: positionBefore.side,
            quantity: positionBefore.quantity,
            entryPrice: positionBefore.avgEntryPrice,
            exitPrice: trade.price,
            pnl: (trade.price - positionBefore.avgEntryPrice) * positionBefore.quantity * (positionBefore.side === "long" ? 1 : -1),
            pnlPercent: ((trade.price - positionBefore.avgEntryPrice) / positionBefore.avgEntryPrice) * 100 * (positionBefore.side === "long" ? 1 : -1),
            entryTime: positionBefore.entryTime,
            exitTime: trade.timestamp,
            duration: trade.timestamp - positionBefore.entryTime,
          };

          this.trades.push(completedTrade);
          this.emit("position-closed", completedTrade);
        }

        // Update account equity
        this.updateAccountEquity();

        // Emit events
        this.emit("trade-executed", {
          trade,
          position,
        } as TradeExecutedEvent);
        this.emit("account-updated", this.accountManager.getAccount());

        return trade;
      }

      return null;
    } catch (error) {
      this.emit("order-rejected", {
        order,
        reason: error instanceof Error ? error.message : "Unknown error",
      } as OrderRejectedEvent);
      return null;
    }
  }

  /**
   * Close a position at current market price
   * @param symbol Symbol to close
   * @returns Completed trade or null if no position
   */
  async closePosition(symbol: string): Promise<CompletedTrade | null> {
    const currentPrice = await this.getPriceAt(symbol, Date.now());
    const closedTrade = this.positionManager.closePosition(symbol, currentPrice);

    if (closedTrade) {
      // Record the completed trade
      this.trades.push(closedTrade);

      // Update account equity
      this.updateAccountEquity();

      // Emit events
      this.emit("position-closed", closedTrade);
      this.emit("account-updated", this.accountManager.getAccount());
    }

    return closedTrade;
  }

  /**
   * Get current account state
   * @returns Current trading account
   */
  getAccount(): TradingAccount {
    return this.accountManager.getAccount();
  }

  /**
   * Get all open positions
   * @returns Array of positions
   */
  getPositions(): Position[] {
    return this.positionManager.getPositionsArray();
  }

  /**
   * Get a specific position
   * @param symbol Symbol to get position for
   * @returns Position or undefined
   */
  getPosition(symbol: string): Position | undefined {
    return this.positionManager.getPosition(symbol);
  }

  /**
   * Get all completed trades
   * @returns Array of completed trades
   */
  getTrades(): CompletedTrade[] {
    return [...this.trades];
  }

  /**
   * Reset the trading engine to initial state
   * @param startingBalance Optional new starting balance
   */
  reset(startingBalance?: number): void {
    this.accountManager.reset(startingBalance);
    this.positionManager.clear();
    this.trades = [];
    this.emit("reset");
  }

  /**
   * Update account equity based on current positions and prices
   */
  protected updateAccountEquity(): void {
    const positions = this.getPositions();
    const currentPrices = new Map<string, number>();

    // This will be populated by subclasses with actual current prices
    positions.forEach((position) => {
      currentPrices.set(position.symbol, position.currentPrice);
    });

    this.accountManager.updateEquity(positions, currentPrices);
  }

  /**
   * Update position prices and P&L
   * @param symbol Symbol to update
   * @param currentPrice Current price
   */
  protected updatePositionPnL(symbol: string, currentPrice: number): void {
    const position = this.positionManager.updatePositionPrice(
      symbol,
      currentPrice
    );

    if (position) {
      const pnl = this.positionManager.calculatePnL(position, currentPrice);
      this.emit("position-updated", {
        symbol,
        position,
        pnl,
      } as PositionUpdatedEvent);

      // Update account equity
      this.updateAccountEquity();
      this.emit("account-updated", this.accountManager.getAccount());
    }
  }

  /**
   * Check if there's sufficient buying power for an order
   * @param quantity Order quantity
   * @param price Order price
   * @returns True if sufficient funds
   */
  hasSufficientFunds(quantity: number, price: number): boolean {
    return this.accountManager.hasSufficientFunds(quantity, price);
  }

  /**
   * Get count of open positions
   * @returns Number of open positions
   */
  getPositionCount(): number {
    return this.positionManager.getPositionCount();
  }

  /**
   * Check if there's an open position for a symbol
   * @param symbol Symbol to check
   * @returns True if position exists
   */
  hasPosition(symbol: string): boolean {
    return this.positionManager.hasPosition(symbol);
  }
}
