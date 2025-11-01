import { useState, useCallback, useRef } from "react";
import { BacktestingEngine } from "~/services/tradingEngine";
import type {
  TradingStrategy,
  BacktestResult,
  Granularity,
  EvaluatorConfig,
} from "~/types/trading";

/**
 * Backtest configuration
 */
export interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  granularity: Granularity;
  startingBalance: number;
  strategy: TradingStrategy;
  evaluators?: EvaluatorConfig[]; // Indicator evaluators to load with parameters
}

/**
 * Hook state
 */
interface BacktestState {
  isRunning: boolean;
  isLoading: boolean;
  progress: number;
  result: BacktestResult | null;
  error: string | null;
}

/**
 * React hook for managing backtesting state and execution
 */
export function useBacktesting() {
  const [state, setState] = useState<BacktestState>({
    isRunning: false,
    isLoading: false,
    progress: 0,
    result: null,
    error: null,
  });

  const engineRef = useRef<BacktestingEngine | null>(null);
  const isCancelledRef = useRef(false);

  /**
   * Run a backtest with the given configuration
   */
  const runBacktest = useCallback(async (config: BacktestConfig) => {
    try {
      // Reset state
      setState({
        isRunning: true,
        isLoading: true,
        progress: 0,
        result: null,
        error: null,
      });

      isCancelledRef.current = false;

      // Create new backtesting engine
      const engine = new BacktestingEngine(config.startingBalance);
      engineRef.current = engine;

      // Set up progress listener
      engine.on("progress", (progressData: any) => {
        if (isCancelledRef.current) return;

        setState((prev) => ({
          ...prev,
          progress: progressData.percent,
        }));
      });

      // Load historical data with indicators
      setState((prev) => ({ ...prev, isLoading: true }));

      await engine.loadHistoricalData(
        config.symbol,
        config.startDate,
        config.endDate,
        config.granularity,
        config.evaluators || []
      );

      if (isCancelledRef.current) {
        throw new Error("Backtest cancelled");
      }

      setState((prev) => ({ ...prev, isLoading: false }));

      // Run the backtest
      const result = await engine.runBacktest(config.strategy);

      if (isCancelledRef.current) {
        throw new Error("Backtest cancelled");
      }

      // Update state with result
      setState({
        isRunning: false,
        isLoading: false,
        progress: 100,
        result,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setState({
        isRunning: false,
        isLoading: false,
        progress: 0,
        result: null,
        error: errorMessage,
      });
    } finally {
      engineRef.current = null;
    }
  }, []);

  /**
   * Cancel the currently running backtest
   */
  const cancelBacktest = useCallback(() => {
    isCancelledRef.current = true;

    setState((prev) => ({
      ...prev,
      isRunning: false,
      isLoading: false,
      error: "Backtest cancelled by user",
    }));

    engineRef.current = null;
  }, []);

  /**
   * Reset the backtest state
   */
  const resetBacktest = useCallback(() => {
    isCancelledRef.current = false;

    setState({
      isRunning: false,
      isLoading: false,
      progress: 0,
      result: null,
      error: null,
    });

    engineRef.current = null;
  }, []);

  return {
    // State
    isRunning: state.isRunning,
    isLoading: state.isLoading,
    progress: state.progress,
    result: state.result,
    error: state.error,

    // Actions
    runBacktest,
    cancelBacktest,
    resetBacktest,
  };
}
