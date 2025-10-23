import type { BacktestResult, CompletedTrade } from "~/types/trading";

/**
 * Export backtest results to CSV format
 */
export function exportToCSV(result: BacktestResult): void {
  const rows: string[] = [];

  // Header
  rows.push(
    "Entry Time,Exit Time,Symbol,Side,Quantity,Entry Price,Exit Price,P&L ($),P&L (%),Duration (ms)"
  );

  // Trades
  result.trades.forEach((trade) => {
    rows.push(
      [
        new Date(trade.entryTime).toISOString(),
        new Date(trade.exitTime).toISOString(),
        result.symbol,
        trade.side,
        trade.quantity,
        trade.entryPrice,
        trade.exitPrice,
        trade.pnl,
        trade.pnlPercent,
        trade.duration,
      ].join(",")
    );
  });

  // Create blob and download
  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `backtest_${result.strategy}_${result.symbol}_${Date.now()}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export backtest results to JSON format
 */
export function exportToJSON(result: BacktestResult): void {
  // Create a simplified version of the result for export
  const exportData = {
    metadata: {
      strategy: result.strategy,
      symbol: result.symbol,
      startDate: result.startDate.toISOString(),
      endDate: result.endDate.toISOString(),
      exportedAt: new Date().toISOString(),
    },
    account: {
      startingBalance: result.account.startingBalance,
      finalBalance: result.account.balance,
      totalPnL: result.account.totalPnL,
      totalPnLPercent: result.account.totalPnLPercent,
    },
    metrics: result.metrics,
    trades: result.trades.map((trade) => ({
      id: trade.id,
      entryTime: new Date(trade.entryTime).toISOString(),
      exitTime: new Date(trade.exitTime).toISOString(),
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      pnlPercent: trade.pnlPercent,
      duration: trade.duration,
    })),
    equityCurve: result.equityCurve.map((point) => ({
      timestamp: new Date(point.timestamp).toISOString(),
      equity: point.equity,
    })),
    drawdownCurve: result.drawdownCurve.map((point) => ({
      timestamp: new Date(point.timestamp).toISOString(),
      drawdownPercent: point.drawdownPercent,
    })),
  };

  // Create blob and download
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `backtest_${result.strategy}_${result.symbol}_${Date.now()}.json`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
