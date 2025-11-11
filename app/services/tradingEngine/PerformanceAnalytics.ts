import type {
  PerformanceMetrics,
  CompletedTrade,
  TradingAccount,
  EquityPoint,
  DrawdownPoint,
} from "~/types/trading";

/**
 * Calculates performance metrics and analytics for trading results
 */
export class PerformanceAnalytics {
  /**
   * Calculate comprehensive performance metrics
   * @param trades Array of completed trades
   * @param account Current account state
   * @returns Performance metrics
   */
  calculateMetrics(
    trades: CompletedTrade[],
    account: TradingAccount
  ): PerformanceMetrics {
    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(
      losingTrades.reduce((sum, t) => sum + t.pnl, 0)
    );

    const winRate = (winningTrades.length / trades.length) * 100;
    const avgWin =
      winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss =
      losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    const largestWin =
      winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.pnl)) : 0;
    const largestLoss =
      losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.pnl)) : 0;

    const avgTradeDuration = this.calculateAvgDuration(trades);
    const sharpeRatio = this.calculateSharpeRatio(trades, account);
    const maxDrawdown = this.calculateMaxDrawdown(
      trades,
      account.startingBalance
    );
    const expectancy = trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalPnL: account.totalPnL,
      totalPnLPercent: account.totalPnLPercent,
      largestWin,
      largestLoss,
      avgTradeDuration,
      sharpeRatio,
      maxDrawdown,
      expectancy,
    };
  }

  /**
   * Calculate average trade duration
   * @param trades Array of completed trades
   * @returns Average duration in milliseconds
   */
  calculateAvgDuration(trades: CompletedTrade[]): number {
    if (trades.length === 0) return 0;

    const totalDuration = trades.reduce((sum, trade) => sum + trade.duration, 0);
    return totalDuration / trades.length;
  }

  /**
   * Calculate Sharpe Ratio (risk-adjusted return)
   * @param trades Array of completed trades
   * @param account Account state
   * @returns Sharpe ratio
   */
  calculateSharpeRatio(
    trades: CompletedTrade[],
    account: TradingAccount
  ): number {
    if (trades.length < 2) return 0;

    // Calculate returns as percentage for each trade
    const returns = trades.map((t) => t.pnlPercent);

    // Calculate mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate standard deviation of returns
    const squaredDiffs = returns.map((r) => Math.pow(r - meanReturn, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe ratio = mean return / standard deviation
    // (assuming risk-free rate of 0 for simplicity)
    if (stdDev === 0) return 0;

    return meanReturn / stdDev;
  }

  /**
   * Calculate maximum drawdown percentage
   * @param trades Array of completed trades
   * @param startingBalance Starting account balance
   * @returns Maximum drawdown as percentage
   */
  calculateMaxDrawdown(
    trades: CompletedTrade[],
    startingBalance: number
  ): number {
    if (trades.length === 0) return 0;

    let peak = startingBalance;
    let maxDrawdown = 0;
    let runningBalance = startingBalance;

    trades.forEach((trade) => {
      runningBalance += trade.pnl;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const drawdown = ((peak - runningBalance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
  }

  /**
   * Generate drawdown curve from trades
   * @param trades Array of completed trades
   * @param startingBalance Starting account balance
   * @returns Array of drawdown points
   */
  calculateDrawdownCurve(
    trades: CompletedTrade[],
    startingBalance: number
  ): DrawdownPoint[] {
    if (trades.length === 0) return [];

    const curve: DrawdownPoint[] = [];
    let peak = startingBalance;
    let runningBalance = startingBalance;

    // Add starting point
    curve.push({
      timestamp: trades[0].entryTime,
      drawdownPercent: 0,
    });

    trades.forEach((trade) => {
      runningBalance += trade.pnl;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const drawdown = ((peak - runningBalance) / peak) * 100;

      curve.push({
        timestamp: trade.exitTime,
        drawdownPercent: drawdown,
      });
    });

    return curve;
  }

  /**
   * Generate equity curve from trades
   * @param trades Array of completed trades
   * @param startingBalance Starting account balance
   * @returns Array of equity points
   */
  generateEquityCurve(
    trades: CompletedTrade[],
    startingBalance: number
  ): EquityPoint[] {
    if (trades.length === 0) return [];

    const curve: EquityPoint[] = [];
    let equity = startingBalance;

    // Add starting point
    curve.push({
      timestamp: trades[0].entryTime,
      equity: startingBalance,
    });

    trades.forEach((trade) => {
      equity += trade.pnl;
      curve.push({
        timestamp: trade.exitTime,
        equity,
      });
    });

    return curve;
  }

  /**
   * Get empty metrics (for when no trades exist)
   * @returns Empty performance metrics
   */
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      largestWin: 0,
      largestLoss: 0,
      avgTradeDuration: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      expectancy: 0,
    };
  }

  /**
   * Calculate win/loss ratio
   * @param metrics Performance metrics
   * @returns Win/loss ratio
   */
  calculateWinLossRatio(metrics: PerformanceMetrics): number {
    if (metrics.losingTrades === 0) return Infinity;
    return metrics.winningTrades / metrics.losingTrades;
  }

  /**
   * Calculate profit per trade
   * @param metrics Performance metrics
   * @returns Average profit per trade
   */
  calculateProfitPerTrade(metrics: PerformanceMetrics): number {
    if (metrics.totalTrades === 0) return 0;
    return metrics.totalPnL / metrics.totalTrades;
  }

  /**
   * Format duration in human-readable format
   * @param milliseconds Duration in milliseconds
   * @returns Formatted duration string
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
