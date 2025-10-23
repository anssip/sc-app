import type { TradingAccount, Order, Trade, Position } from "~/types/trading";

/**
 * Manages trading account balance, equity, and buying power
 */
export class AccountManager {
  private account: TradingAccount;

  /**
   * Create a new account manager
   * @param startingBalance Initial account balance
   */
  constructor(startingBalance: number) {
    this.account = {
      balance: startingBalance,
      startingBalance,
      equity: startingBalance,
      buyingPower: startingBalance,
      totalPnL: 0,
      totalPnLPercent: 0,
    };
  }

  /**
   * Deduct the cost of an order from available balance
   * @param order The order being placed
   * @param executionPrice The execution price
   * @returns True if successful, false if insufficient funds
   */
  deductOrderCost(order: Order, executionPrice: number): boolean {
    if (order.side !== "buy") {
      // Only deduct for buy orders
      return true;
    }

    const cost = order.quantity * executionPrice;

    if (cost > this.account.buyingPower) {
      return false; // Insufficient funds
    }

    this.account.balance -= cost;
    this.account.buyingPower -= cost;
    return true;
  }

  /**
   * Credit the proceeds from a sell order
   * @param trade The executed sell trade
   */
  creditOrderProceeds(trade: Trade): void {
    if (trade.side !== "sell") {
      return;
    }

    const proceeds = trade.quantity * trade.price;

    // Deduct fees if any
    const netProceeds = trade.fees ? proceeds - trade.fees : proceeds;

    this.account.balance += netProceeds;
    this.account.buyingPower += netProceeds;
  }

  /**
   * Update total equity based on current positions
   * @param positions Array of current positions
   * @param currentPrices Map of current prices by symbol
   */
  updateEquity(
    positions: Position[],
    currentPrices: Map<string, number>
  ): void {
    let totalPositionValue = 0;

    positions.forEach((position) => {
      const currentPrice =
        currentPrices.get(position.symbol) || position.avgEntryPrice;
      totalPositionValue += position.quantity * currentPrice;
    });

    this.account.equity = this.account.balance + totalPositionValue;
    this.account.totalPnL = this.account.equity - this.account.startingBalance;
    this.account.totalPnLPercent =
      (this.account.totalPnL / this.account.startingBalance) * 100;
  }

  /**
   * Reset the account to starting balance or new balance
   * @param startingBalance Optional new starting balance
   */
  reset(startingBalance?: number): void {
    const balance = startingBalance ?? this.account.startingBalance;
    this.account = {
      balance,
      startingBalance: balance,
      equity: balance,
      buyingPower: balance,
      totalPnL: 0,
      totalPnLPercent: 0,
    };
  }

  /**
   * Get current account state
   * @returns Current account
   */
  getAccount(): TradingAccount {
    return { ...this.account };
  }

  /**
   * Get current balance
   * @returns Current balance
   */
  getBalance(): number {
    return this.account.balance;
  }

  /**
   * Get current equity
   * @returns Current equity
   */
  getEquity(): number {
    return this.account.equity;
  }

  /**
   * Get current buying power
   * @returns Current buying power
   */
  getBuyingPower(): number {
    return this.account.buyingPower;
  }

  /**
   * Get total P&L
   * @returns Total P&L in dollars
   */
  getTotalPnL(): number {
    return this.account.totalPnL;
  }

  /**
   * Get total P&L percentage
   * @returns Total P&L as percentage
   */
  getTotalPnLPercent(): number {
    return this.account.totalPnLPercent;
  }

  /**
   * Check if account has sufficient funds for an order
   * @param quantity Order quantity
   * @param price Order price
   * @returns True if sufficient funds
   */
  hasSufficientFunds(quantity: number, price: number): boolean {
    return quantity * price <= this.account.buyingPower;
  }

  /**
   * Add to account balance (for testing or adjustments)
   * @param amount Amount to add
   */
  addToBalance(amount: number): void {
    this.account.balance += amount;
    this.account.buyingPower += amount;
    this.account.equity += amount;
  }

  /**
   * Deduct from account balance (for fees, etc.)
   * @param amount Amount to deduct
   */
  deductFromBalance(amount: number): void {
    this.account.balance -= amount;
    this.account.buyingPower -= amount;
    this.account.equity -= amount;
  }
}
