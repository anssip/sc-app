import React from "react";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import type { PerformanceMetrics, TradingAccount } from "~/types/trading";

interface Props {
  metrics: PerformanceMetrics;
  account: TradingAccount;
}

/**
 * Display grid of performance metrics
 */
export function MetricsGrid({ metrics, account }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const isProfit = metrics.totalPnL >= 0;

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total P&L */}
        <div
          className={`p-4 rounded-lg ${
            isProfit ? "bg-green-900/20" : "bg-red-900/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <div
            className={`text-lg font-semibold ${
              isProfit ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(metrics.totalPnL)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatPercent(metrics.totalPnLPercent)}
          </div>
        </div>

        {/* Final Balance */}
        <div className="p-4 rounded-lg bg-primary-lighter">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Final Balance</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {formatCurrency(account.balance)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Start: {formatCurrency(account.startingBalance)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Total Trades */}
        <MetricItem
          label="Total Trades"
          value={metrics.totalTrades.toString()}
        />

        {/* Win Rate */}
        <MetricItem
          label="Win Rate"
          value={formatPercent(metrics.winRate)}
          color={metrics.winRate >= 50 ? "text-green-400" : "text-red-400"}
        />

        {/* Winning Trades */}
        <MetricItem
          label="Winning Trades"
          value={metrics.winningTrades.toString()}
          color="text-green-400"
        />

        {/* Losing Trades */}
        <MetricItem
          label="Losing Trades"
          value={metrics.losingTrades.toString()}
          color="text-red-400"
        />

        {/* Average Win */}
        <MetricItem
          label="Avg Win"
          value={formatCurrency(metrics.avgWin)}
          color="text-green-400"
        />

        {/* Average Loss */}
        <MetricItem
          label="Avg Loss"
          value={formatCurrency(Math.abs(metrics.avgLoss))}
          color="text-red-400"
        />

        {/* Largest Win */}
        <MetricItem
          label="Largest Win"
          value={formatCurrency(metrics.largestWin)}
          color="text-green-400"
        />

        {/* Largest Loss */}
        <MetricItem
          label="Largest Loss"
          value={formatCurrency(Math.abs(metrics.largestLoss))}
          color="text-red-400"
        />

        {/* Profit Factor */}
        <MetricItem
          label="Profit Factor"
          value={formatNumber(metrics.profitFactor, 2)}
          color={metrics.profitFactor >= 1 ? "text-green-400" : "text-red-400"}
        />

        {/* Expectancy */}
        <MetricItem
          label="Expectancy"
          value={formatCurrency(metrics.expectancy)}
          color={metrics.expectancy >= 0 ? "text-green-400" : "text-red-400"}
        />

        {/* Max Drawdown */}
        <MetricItem
          label="Max Drawdown"
          value={formatPercent(metrics.maxDrawdown)}
          color="text-red-400"
        />

        {/* Sharpe Ratio */}
        <MetricItem
          label="Sharpe Ratio"
          value={formatNumber(metrics.sharpeRatio, 2)}
          color={metrics.sharpeRatio >= 1 ? "text-green-400" : "text-yellow-400"}
        />

        {/* Avg Trade Duration */}
        <MetricItem
          label="Avg Duration"
          value={formatDuration(metrics.avgTradeDuration)}
        />
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-primary-lighter">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
