import React, { useState } from "react";
import { Play, X, RotateCcw, Loader } from "lucide-react";
import {
  StrategySelector,
  createStrategy,
  type StrategyType,
} from "./StrategySelector";
import type { Granularity } from "~/types/trading";
import type { BacktestConfig } from "~/hooks/useBacktesting";

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "ONE_MINUTE", label: "1 Minute" },
  { value: "FIVE_MINUTE", label: "5 Minutes" },
  { value: "FIFTEEN_MINUTE", label: "15 Minutes" },
  { value: "ONE_HOUR", label: "1 Hour" },
  { value: "SIX_HOUR", label: "6 Hours" },
  { value: "ONE_DAY", label: "1 Day" },
];

interface Props {
  symbol: string;
  isRunning: boolean;
  isLoading: boolean;
  progress: number;
  error: string | null;
  onRun: (config: BacktestConfig) => void;
  onCancel: () => void;
  onReset: () => void;
}

/**
 * Backtest configuration and control panel
 */
export function BacktestPanel({
  symbol,
  isRunning,
  isLoading,
  progress,
  error,
  onRun,
  onCancel,
  onReset,
}: Props) {
  // Form state
  const [strategyType, setStrategyType] = useState<StrategyType>("sma");
  const [strategyConfig, setStrategyConfig] = useState<any>({
    fastPeriod: 50,
    slowPeriod: 200,
    quantity: 1,
  });
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to 3 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split("T")[0];
  });
  const [granularity, setGranularity] = useState<Granularity>("ONE_HOUR");
  const [startingBalance, setStartingBalance] = useState<number>(100000);

  // Form validation
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setValidationError("End date must be after start date");
      return false;
    }

    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (end.getTime() - start.getTime() > maxRange) {
      setValidationError("Date range cannot exceed 1 year");
      return false;
    }

    if (startingBalance <= 0) {
      setValidationError("Starting balance must be greater than 0");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleRun = () => {
    if (!validateForm()) return;

    try {
      // Get evaluators needed for the strategy
      const evaluators: string[] = [];
      if (strategyType === "sma") {
        evaluators.push("moving-averages");
      } else if (strategyType === "rsi") {
        evaluators.push("rsi");
      }

      // Create strategy instance
      const strategy = createStrategy(strategyType, symbol, strategyConfig);

      // Create backtest config
      const config: BacktestConfig = {
        symbol,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        granularity,
        startingBalance,
        strategy,
        evaluators,
      };

      onRun(config);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Failed to create strategy"
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Backtest Configuration</h2>
        <p className="text-xs text-gray-400 mt-1">
          Configure and run strategy backtests
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Symbol Display */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Symbol
          </label>
          <div className="px-3 py-2 bg-gray-900 rounded text-sm text-white border border-gray-800">
            {symbol}
          </div>
        </div>

        {/* Strategy Selector */}
        <StrategySelector
          selectedStrategy={strategyType}
          onStrategyChange={setStrategyType}
          config={strategyConfig}
          onConfigChange={setStrategyConfig}
          symbol={symbol}
        />

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-900 rounded text-sm text-white border border-gray-800 focus:border-accent-primary focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-900 rounded text-sm text-white border border-gray-800 focus:border-accent-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Granularity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Candle Granularity
          </label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            disabled={isRunning}
            className="w-full px-3 py-2 bg-gray-900 rounded text-sm text-white border border-gray-800 focus:border-accent-primary focus:outline-none disabled:opacity-50"
          >
            {GRANULARITIES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Starting Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Starting Balance ($)
          </label>
          <input
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(parseFloat(e.target.value))}
            disabled={isRunning}
            min="100"
            step="1000"
            className="w-full px-3 py-2 bg-gray-900 rounded text-sm text-white border border-gray-800 focus:border-accent-primary focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Error Display */}
        {(error || validationError) && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-200">
            {error || validationError}
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>
                {isLoading ? "Loading historical data..." : "Running backtest..."}
              </span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {!isRunning ? (
          <>
            <button
              onClick={handleRun}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 rounded-lg text-white font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              Run Backtest
            </button>
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-white transition-colors border border-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
