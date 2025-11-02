import React, { useState, useEffect, useMemo } from "react";
import { Play, X, RotateCcw, Loader, BarChart3 } from "lucide-react";
import {
  StrategySelector,
  createStrategy,
  type StrategyType,
} from "./StrategySelector";
import { DynamicEvaluatorForm } from "./DynamicEvaluatorForm";
import { schemaService } from "~/services/indicators/schemaService";
import type { Granularity, EvaluatorConfig } from "~/types/trading";
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
  onClose: () => void;
  hasResults: boolean;
  onViewResults: () => void;
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
  onClose,
  hasResults,
  onViewResults,
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
  const [evaluatorConfigs, setEvaluatorConfigs] = useState<EvaluatorConfig[]>(
    []
  );

  // Form validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get required indicators from strategy
  const requiredIndicators = useMemo(() => {
    try {
      const strategy = createStrategy(strategyType, symbol, strategyConfig);
      return strategy.getRequiredIndicators();
    } catch (error) {
      return [];
    }
  }, [strategyType, symbol, strategyConfig]);

  // Load schemas for required indicators
  const indicatorSchemas = useMemo(() => {
    return requiredIndicators
      .map((id) => schemaService.getSchema(id))
      .filter((schema) => schema !== null);
  }, [requiredIndicators]);

  // Initialize evaluator configs when strategy changes
  useEffect(() => {
    // Create default evaluator configs for required indicators
    const defaultConfigs: EvaluatorConfig[] = requiredIndicators.map((id) => ({
      id,
      params: schemaService.getDefaultParams(id),
    }));
    setEvaluatorConfigs(defaultConfigs);
  }, [requiredIndicators]);

  // Update indicator params
  const updateIndicatorParams = (indicatorId: string, params: Record<string, any>) => {
    setEvaluatorConfigs((prev) =>
      prev.map((config) =>
        config.id === indicatorId ? { ...config, params } : config
      )
    );
  };

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
      // Validate all indicator parameters
      const validationErrors: string[] = [];
      evaluatorConfigs.forEach((config) => {
        const result = schemaService.validateParams(
          config.id,
          config.params || {}
        );
        if (!result.valid) {
          const schema = schemaService.getSchema(config.id);
          const indicatorName = schema?.name || config.id;
          validationErrors.push(
            `${indicatorName}: ${result.errors.join(", ")}`
          );
        }
      });

      if (validationErrors.length > 0) {
        setValidationError(validationErrors.join("; "));
        return;
      }

      // Create strategy instance
      const strategy = createStrategy(strategyType, symbol, strategyConfig);

      // Create backtest config with validated evaluator configs
      const config: BacktestConfig = {
        symbol,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        granularity,
        startingBalance,
        strategy,
        evaluators: evaluatorConfigs,
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
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Backtest Configuration</h2>
            <p className="text-xs text-gray-400 mt-1">
              Configure and run strategy backtests
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasResults && !isRunning && (
              <button
                onClick={onViewResults}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded text-xs font-medium transition-colors border border-gray-800"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Results
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
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

        {/* Required Indicators Configuration */}
        {indicatorSchemas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Indicators
            </label>
            <div className="space-y-3">
              {indicatorSchemas.map((schema) => {
                const config = evaluatorConfigs.find((c) => c.id === schema.id);
                return (
                  <div key={schema.id} className="bg-gray-900 rounded border border-gray-800 p-3">
                    <DynamicEvaluatorForm
                      schema={schema}
                      values={config?.params || {}}
                      onChange={(params) => updateIndicatorParams(schema.id, params)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      <div className="p-4 border-t border-gray-800">
        {!isRunning ? (
          <button
            onClick={handleRun}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 rounded-lg text-white font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            Run Backtest
          </button>
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
