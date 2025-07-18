import React, { useState, useRef } from "react";
import { SCChart, SCChartRef } from "./SCChart";
import { ChartHeader } from "./ChartHeader";
import { db } from "~/lib/firebase";
import { useCharts } from "~/hooks/useRepository";
import type { Granularity } from "@anssipiirainen/sc-charts";

export interface ChartConfig {
  id: string;
  symbol: string;
  granularity: Granularity;
  indicators?: any[];
}

interface ChartContainerProps {
  config: ChartConfig;
  layoutId?: string;
  onRemove?: () => void;
  onSymbolChange?: (symbol: string) => void;
  onConfigUpdate?: (config: ChartConfig) => void;
}

/**
 * ChartContainer Component
 *
 * Individual chart container that manages its own state and API interactions.
 * Uses the Chart API (from sc-charts library) to independently control:
 * - Symbol selection (BTC-USD, ETH-USD, etc.)
 * - Granularity/timeframe (1m, 5m, 1h, 1d, etc.)
 * - Error handling and loading states
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  layoutId,
  onRemove,
  onSymbolChange,
  onConfigUpdate,
}) => {
  const { updateChart, saveChart } = useCharts();
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState(config.symbol);
  const [currentGranularity, setCurrentGranularity] = useState(
    config.granularity
  );
  const [isChangingSymbol, setIsChangingSymbol] = useState(false);
  const [isChangingGranularity, setIsChangingGranularity] = useState(false);
  const chartRef = useRef<SCChartRef>(null);

  const initialState = {
    symbol: config.symbol,
    granularity: config.granularity,
  };

  console.log(`ChartContainer [${config.id}]: Rendering with config`, {
    config,
    initialState,
    renderCount: Math.random().toString(36).substr(2, 5),
  });

  /**
   * Wait for Chart API to be available with retry mechanism
   */
  const waitForApi = async (): Promise<boolean> => {
    let retries = 0;
    const maxRetries = 10;

    while (
      (!chartRef.current || !chartRef.current.api) &&
      retries < maxRetries
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }

    return !!(chartRef.current && chartRef.current.api);
  };

  /**
   * Handle symbol changes using the Chart API
   * This function uses the sc-charts API to change the trading pair independently
   * for this specific chart instance, without affecting other charts
   */
  const handleSymbolChange = async (symbol: string) => {
    if (symbol === currentSymbol) return;

    setIsChangingSymbol(true);
    setChartError(null);

    try {
      const apiAvailable = await waitForApi();

      if (apiAvailable && chartRef.current) {
        // Use Chart API to change symbol - this updates only this chart instance
        await chartRef.current.setSymbol(symbol);
        setCurrentSymbol(symbol);
        onSymbolChange?.(symbol);

        // Update the config through the callback
        const updatedConfig = {
          ...config,
          symbol,
          granularity: currentGranularity,
        };

        if (onConfigUpdate) {
          onConfigUpdate(updatedConfig);
        }

        // Persist to repository
        try {
          // Try to update first, if it fails (chart not found), create it
          try {
            await updateChart(config.id, { symbol }, layoutId);
          } catch (updateError: any) {
            if (updateError?.code === "NOT_FOUND") {
              console.log("Chart not found in repository, creating it...");
              // Create the chart with the correct ID and updated symbol
              const newChart = await saveChart(
                {
                  symbol: symbol, // Use the new symbol
                  granularity: currentGranularity,
                  indicators: config.indicators || [],
                },
                layoutId
              );
              console.log("Chart created with ID:", newChart.id);
            } else {
              throw updateError;
            }
          }
        } catch (error) {
          console.error(
            "Failed to persist symbol change to repository:",
            error
          );
        }
      } else {
        console.warn(
          "Chart API not available - symbol change will require chart reload"
        );
        setChartError(
          "Chart API not available. Symbol changes require chart reload."
        );
        // Reset the select to the previous symbol on error
        setCurrentSymbol(config.symbol);
      }
    } catch (error) {
      console.error("Failed to change symbol:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setChartError(`Failed to change symbol: ${errorMessage}`);
      // Reset the select to the previous symbol on error
      setCurrentSymbol(config.symbol);
    } finally {
      setIsChangingSymbol(false);
    }
  };

  /**
   * Handle granularity/timeframe changes using the Chart API
   * This function uses the sc-charts API to change the timeframe independently
   * for this specific chart instance
   */
  const handleGranularityChange = async (granularity: Granularity) => {
    if (granularity === currentGranularity) return;

    setIsChangingGranularity(true);
    setChartError(null);

    try {
      const apiAvailable = await waitForApi();

      if (apiAvailable && chartRef.current) {
        // Use Chart API to change granularity - this updates only this chart instance
        await chartRef.current.setGranularity(granularity);
        setCurrentGranularity(granularity);

        // Update the config through the callback
        const updatedConfig = {
          ...config,
          symbol: currentSymbol,
          granularity,
        };

        if (onConfigUpdate) {
          onConfigUpdate(updatedConfig);
        }

        // Persist to repository
        try {
          // Try to update first, if it fails (chart not found), create it
          try {
            await updateChart(config.id, { granularity }, layoutId);
          } catch (updateError: any) {
            if (updateError?.code === "NOT_FOUND") {
              console.log("Chart not found in repository, creating it...");
              // Create the chart with the correct ID and updated granularity
              const newChart = await saveChart(
                {
                  symbol: currentSymbol,
                  granularity: granularity, // Use the new granularity
                  indicators: config.indicators || [],
                },
                layoutId
              );
              console.log("Chart created with ID:", newChart.id);
            } else {
              throw updateError;
            }
          }
        } catch (error) {
          console.error(
            "Failed to persist granularity change to repository:",
            error
          );
        }
      } else {
        console.warn(
          "Chart API not available - granularity change will require chart reload"
        );
        setChartError(
          "Chart API not available. Granularity changes require chart reload."
        );
        // Reset the select to the previous granularity on error
        setCurrentGranularity(config.granularity);
      }
    } catch (error) {
      console.error("Failed to change granularity:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setChartError(`Failed to change granularity: ${errorMessage}`);
      // Reset the select to the previous granularity on error
      setCurrentGranularity(config.granularity);
    } finally {
      setIsChangingGranularity(false);
    }
  };

  // Dummy handlers for split functionality (to be implemented later)
  const handleSplitHorizontal = () => {
    // TODO: Implement split functionality
    console.log("Split horizontal - not yet implemented");
  };

  const handleSplitVertical = () => {
    // TODO: Implement split functionality
    console.log("Split vertical - not yet implemented");
  };

  const handleAddChart = () => {
    // TODO: Implement add chart functionality
    console.log("Add chart - not yet implemented");
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ChartHeader
        symbol={currentSymbol}
        granularity={currentGranularity}
        isChangingSymbol={isChangingSymbol}
        isChangingGranularity={isChangingGranularity}
        onSymbolChange={handleSymbolChange}
        onGranularityChange={handleGranularityChange}
        onDelete={onRemove}
        onSplitHorizontal={handleSplitHorizontal}
        onSplitVertical={handleSplitVertical}
      />

      {/* Chart Content */}
      <div className="flex-1 relative">
        {chartError ? (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
            <div className="text-center p-4">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 max-w-xs">
                {chartError}
              </p>
              <button
                onClick={() => setChartError(null)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <SCChart
            ref={chartRef}
            firestore={db}
            initialState={initialState}
            style={{ width: "100%", height: "100%" }}
            className="trading-chart"
            chartId={config.id}
            onReady={() => {}}
            onError={(error) => setChartError(error)}
          />
        )}
      </div>
    </div>
  );
};
