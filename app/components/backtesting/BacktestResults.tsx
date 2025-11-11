import React, { useState } from "react";
import { Download, TrendingUp, BarChart3, X, ArrowLeft } from "lucide-react";
import { MetricsGrid } from "./MetricsGrid";
import { TradesList } from "./TradesList";
import type { BacktestResult } from "~/types/trading";

interface Props {
  result: BacktestResult;
  onClose: () => void;
  onExport: (format: "csv" | "json") => void;
  onVisualize: () => void;
  onBack: () => void;
}

type TabType = "metrics" | "trades";

/**
 * Display backtest results with metrics and trades
 */
export function BacktestResults({
  result,
  onClose,
  onExport,
  onVisualize,
  onBack,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("metrics");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-start gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-800 rounded transition-colors mt-0.5"
            title="Back to configuration"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Backtest Results</h2>
            <p className="text-xs text-gray-400 mt-1">
              {result.strategy} • {result.symbol}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-lighter rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-gray-400">
          {formatDate(result.startDate)} - {formatDate(result.endDate)}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton
            active={activeTab === "metrics"}
            onClick={() => setActiveTab("metrics")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Metrics"
          />
          <TabButton
            active={activeTab === "trades"}
            onClick={() => setActiveTab("trades")}
            icon={<TrendingUp className="h-4 w-4" />}
            label={`Trades (${result.trades.length})`}
          />
        </div>

        {/* Export Menu */}
        <div className="flex gap-2">
          <button
            onClick={onVisualize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary hover:bg-accent-primary/90 rounded text-xs font-medium transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Visualize
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded text-xs font-medium transition-colors border border-gray-800">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-gray-900 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 border border-gray-800">
              <button
                onClick={() => onExport("csv")}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => onExport("json")}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-800 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "metrics" ? (
          <div className="h-full overflow-y-auto p-4">
            <MetricsGrid metrics={result.metrics} account={result.account} />
          </div>
        ) : (
          <TradesList trades={result.trades} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-accent-primary text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
