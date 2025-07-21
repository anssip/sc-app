import React, { useState, useRef, useEffect, useMemo } from "react";
import { SCChart, SCChartRef } from "./SCChart";
import { ChartHeader } from "./ChartHeader";
import { db } from "~/lib/firebase";
import { useCharts } from "~/hooks/useRepository";
import {
  ChartSettingsProvider,
  useChartSettings,
  type ChartSettings,
} from "~/contexts/ChartSettingsContext";
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
  onConfigUpdate,
}) => {
  const { updateChart, saveChart } = useCharts();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSettingsChange = async (
    settings: ChartSettings,
    chartId?: string
  ) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the persistence to prevent rapid updates
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Update the config through the callback
        const updatedConfig = {
          ...config,
          symbol: settings.symbol,
          granularity: settings.granularity,
        };

        if (onConfigUpdate) {
          onConfigUpdate(updatedConfig);
        }

        // Persist to repository (chart-specific persistence)
        // Don't trigger layout auto-save as this is a chart data change, not structural
        try {
          const result = await updateChart(
            config.id,
            {
              symbol: settings.symbol,
              granularity: settings.granularity,
              indicators: config.indicators || [],
            },
            layoutId
          );
        } catch (updateError: any) {
          if (updateError?.code === "NOT_FOUND") {
            // Create the chart if it doesn't exist
            const newChart = await saveChart(
              {
                symbol: settings.symbol,
                granularity: settings.granularity,
                indicators: config.indicators || [],
              },
              layoutId
            );
          } else {
            throw updateError;
          }
        }
      } catch (error) {
        console.error(
          "Failed to persist settings change to repository:",
          error
        );
      }
    }, 500); // Wait 500ms before persisting
  };

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const initialSettings = useMemo(
    () => ({
      symbol: config.symbol,
      granularity: config.granularity,
      indicators: [],
    }),
    [config.symbol, config.granularity]
  );

  return (
    <ChartSettingsProvider
      initialSettings={initialSettings}
      onSettingsChange={handleSettingsChange}
    >
      <ChartContainerInner
        config={config}
        layoutId={layoutId}
        onRemove={onRemove}
        onConfigUpdate={onConfigUpdate}
      />
    </ChartSettingsProvider>
  );
};

const ChartContainerInner: React.FC<ChartContainerProps> = ({
  config,
  layoutId,
  onRemove,
  onConfigUpdate,
}) => {
  const { updateChart, saveChart } = useCharts();
  const [chartError, setChartError] = useState<string | null>(null);
  const [isChangingSymbol, setIsChangingSymbol] = useState(false);
  const [isChangingGranularity, setIsChangingGranularity] = useState(false);
  const chartRef = useRef<SCChartRef>(null);
  const { settings } = useChartSettings(config.id);

  const initialState = {
    symbol: config.symbol,
    granularity: config.granularity,
    indicators: [],
  };

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
        chartId={config.id}
        chartApiRef={chartRef}
        isChangingSymbol={isChangingSymbol}
        isChangingGranularity={isChangingGranularity}
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
