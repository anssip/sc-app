import type { Position, Trade, PnLResult, CompletedTrade } from "~/types/trading";

/**
 * Manages trading positions - opening, updating, and closing
 */
export class PositionManager {
  private positions: Map<string, Position> = new Map();

  /**
   * Generate a unique trade ID
   */
  private generateTradeId(): string {
    return `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update or create a position based on a trade
   * @param trade The executed trade
   * @returns Updated position
   */
  updatePosition(trade: Trade): Position {
    const existing = this.positions.get(trade.symbol);

    if (!existing) {
      // New position
      return this.createPosition(trade);
    }

    // Check if trade is in same direction or opposite
    if (this.isSameSide(existing, trade)) {
      // Adding to position
      return this.addToPosition(existing, trade);
    } else {
      // Reducing or closing position
      return this.reducePosition(existing, trade);
    }
  }

  /**
   * Create a new position from a trade
   * @param trade The opening trade
   * @returns New position
   */
  createPosition(trade: Trade): Position {
    const position: Position = {
      symbol: trade.symbol,
      quantity: trade.quantity,
      side: trade.side === "buy" ? "long" : "short",
      avgEntryPrice: trade.price,
      currentPrice: trade.price,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      entryTime: trade.timestamp,
      costBasis: trade.quantity * trade.price,
    };

    this.positions.set(trade.symbol, position);
    return position;
  }

  /**
   * Add to an existing position
   * @param position Existing position
   * @param trade New trade to add
   * @returns Updated position
   */
  addToPosition(position: Position, trade: Trade): Position {
    const totalCost = position.costBasis + trade.quantity * trade.price;
    const totalQuantity = position.quantity + trade.quantity;

    position.avgEntryPrice = totalCost / totalQuantity;
    position.quantity = totalQuantity;
    position.costBasis = totalCost;

    // Recalculate P&L with current price
    const pnl = this.calculatePnL(position, position.currentPrice);
    position.unrealizedPnL = pnl.unrealizedPnL;
    position.unrealizedPnLPercent = pnl.unrealizedPnLPercent;

    this.positions.set(position.symbol, position);
    return position;
  }

  /**
   * Reduce or close a position
   * @param position Existing position
   * @param trade Closing/reducing trade
   * @returns Updated position or new position if remaining
   */
  reducePosition(position: Position, trade: Trade): Position {
    if (trade.quantity >= position.quantity) {
      // Closing entire position or flipping
      this.positions.delete(position.symbol);

      // If trade quantity exceeds position, create new opposite position
      if (trade.quantity > position.quantity) {
        const remainingQuantity = trade.quantity - position.quantity;
        const newTrade: Trade = {
          ...trade,
          quantity: remainingQuantity,
        };
        return this.createPosition(newTrade);
      }

      // Position fully closed, return final state
      return {
        ...position,
        quantity: 0,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
      };
    } else {
      // Partial close
      position.quantity -= trade.quantity;
      position.costBasis = position.quantity * position.avgEntryPrice;

      // Recalculate P&L
      const pnl = this.calculatePnL(position, position.currentPrice);
      position.unrealizedPnL = pnl.unrealizedPnL;
      position.unrealizedPnLPercent = pnl.unrealizedPnLPercent;

      this.positions.set(position.symbol, position);
      return position;
    }
  }

  /**
   * Calculate P&L for a position at a given price
   * @param position The position
   * @param currentPrice Current market price
   * @returns P&L result
   */
  calculatePnL(position: Position, currentPrice: number): PnLResult {
    const positionValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.avgEntryPrice;

    let unrealizedPnL: number;
    if (position.side === "long") {
      unrealizedPnL = positionValue - costBasis;
    } else {
      // Short position
      unrealizedPnL = costBasis - positionValue;
    }

    const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;

    return {
      unrealizedPnL,
      unrealizedPnLPercent,
      positionValue,
      costBasis,
    };
  }

  /**
   * Close a position and return the closing trade
   * @param symbol Symbol to close
   * @param exitPrice Exit price
   * @returns Closing trade with P&L or null if no position
   */
  closePosition(symbol: string, exitPrice: number): CompletedTrade | null {
    const position = this.positions.get(symbol);
    if (!position) {
      return null;
    }

    const pnl = this.calculatePnL(position, exitPrice);

    // Create closing trade
    const closingTrade: CompletedTrade = {
      id: this.generateTradeId(),
      symbol,
      side: position.side,
      quantity: position.quantity,
      entryPrice: position.avgEntryPrice,
      exitPrice,
      pnl: pnl.unrealizedPnL,
      pnlPercent: pnl.unrealizedPnLPercent,
      entryTime: position.entryTime,
      exitTime: Date.now(),
      duration: Date.now() - position.entryTime,
    };

    this.positions.delete(symbol);
    return closingTrade;
  }

  /**
   * Update the current price for a position and recalculate P&L
   * @param symbol Symbol to update
   * @param currentPrice New current price
   * @returns Updated position or null if not found
   */
  updatePositionPrice(symbol: string, currentPrice: number): Position | null {
    const position = this.positions.get(symbol);
    if (!position) {
      return null;
    }

    position.currentPrice = currentPrice;
    const pnl = this.calculatePnL(position, currentPrice);
    position.unrealizedPnL = pnl.unrealizedPnL;
    position.unrealizedPnLPercent = pnl.unrealizedPnLPercent;

    this.positions.set(symbol, position);
    return position;
  }

  /**
   * Check if a trade is in the same direction as a position
   * @param position The position
   * @param trade The trade
   * @returns True if same direction
   */
  private isSameSide(position: Position, trade: Trade): boolean {
    return (
      (position.side === "long" && trade.side === "buy") ||
      (position.side === "short" && trade.side === "sell")
    );
  }

  /**
   * Get a specific position
   * @param symbol Symbol to get
   * @returns Position or undefined
   */
  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  /**
   * Get all positions
   * @returns Map of all positions
   */
  getPositions(): Map<string, Position> {
    return this.positions;
  }

  /**
   * Get all positions as an array
   * @returns Array of positions
   */
  getPositionsArray(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Clear all positions
   */
  clear(): void {
    this.positions.clear();
  }

  /**
   * Get total count of open positions
   * @returns Number of open positions
   */
  getPositionCount(): number {
    return this.positions.size;
  }

  /**
   * Check if there's an open position for a symbol
   * @param symbol Symbol to check
   * @returns True if position exists
   */
  hasPosition(symbol: string): boolean {
    return this.positions.has(symbol);
  }
}
