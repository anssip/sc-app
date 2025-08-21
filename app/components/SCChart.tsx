import { FirebaseApp } from "firebase/app";
import { Firestore } from "firebase/firestore";
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { firebaseConfig } from "~/lib/firebase";
import {
  useChartSettings,
  UseChartSettingsReturn,
  type ChartSettings,
} from "~/contexts/ChartSettingsContext";
import type { ChartApi, Granularity } from "@anssipiirainen/sc-charts";

interface SCChartProps {
  firestore?: Firestore;
  initialState?: any;
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
  onError?: (error: string) => void;
  chartId?: string;
}

export interface SCChartRef {
  setSymbol: (symbol: string) => Promise<void>;
  setGranularity: (granularity: Granularity) => Promise<void>;
  getSymbol: () => string;
  getGranularity: () => Granularity;
  api: ChartApi | null;
  activateTrendLineTool: () => void;
  deactivateTrendLineTool: () => void;
}

export const SCChart = forwardRef<SCChartRef, SCChartProps>(
  (
    { firestore, initialState, className, style, onReady, onError, chartId },
    ref
  ) => {
    console.log(`📈 SCChart: Component initialized with initialState:`, {
      hasInitialState: !!initialState,
      symbol: initialState?.symbol,
      granularity: initialState?.granularity,
      trendLineCount: initialState?.trendLines?.length || 0,
      trendLines: initialState?.trendLines,
      chartId: chartId,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const appRef = useRef<any>(null);
    const apiRef = useRef<ChartApi | null>(null);
    const symbolChangeHandlerRef = useRef<((event: any) => void) | null>(null);
    const indicatorChangeHandlerRef = useRef<((event: any) => void) | null>(
      null
    );
    const readyHandlerRef = useRef<((event: any) => void) | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    const [isApiReady, setIsApiReady] = useState(false);
    const uniqueChartId = useRef(
      chartId || `chart-${Math.random().toString(36).substr(2, 9)}`
    );
    const isInitializedRef = useRef(false);
    const isInitializingRef = useRef(false);

    // Use chart settings context
    const globalChartSettings = useChartSettings();
    const chartSettings: UseChartSettingsReturn = useChartSettings(
      uniqueChartId.current
    );

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Register chart with context on mount
    useEffect(() => {
      if (initialState) {
        const chartId = uniqueChartId.current;
        const settings = {
          symbol: initialState.symbol || "BTC-USD",
          granularity: initialState.granularity || "ONE_HOUR",
          indicators: [],
        };
        (
          globalChartSettings.registerChart as (
            chartId: string,
            settings: ChartSettings
          ) => void
        )(chartId, settings);
      }

      // Cleanup on unmount
      return () => {
        (globalChartSettings.unregisterChart as (chartId: string) => void)(
          uniqueChartId.current
        );
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setSymbol: async (symbol: string) => {
          if (apiRef.current) {
            const currentSymbol = apiRef.current.getSymbol?.() || "";
            if (currentSymbol === symbol) {
              return;
            }

            // Try the standard setSymbol method first
            if (apiRef.current.setSymbol) {
              try {
                await apiRef.current.setSymbol(symbol);

                // Wait a moment and check if the symbol actually changed
                await new Promise((resolve) => setTimeout(resolve, 100));
                const newSymbol = apiRef.current.getSymbol?.() || "";

                if (newSymbol === symbol) {
                  // Update the context to trigger persistence
                  chartSettings.setSymbol(symbol, uniqueChartId.current);
                  return;
                } else {
                  // Force chart re-initialization with new symbol
                  await reinitializeChart(
                    symbol,
                    apiRef.current.getGranularity?.() || "ONE_HOUR"
                  );
                  // Update the context after reinit
                  chartSettings.setSymbol(symbol, uniqueChartId.current);
                }
              } catch (error) {
                // Fall back to re-initialization
                await reinitializeChart(
                  symbol,
                  apiRef.current.getGranularity?.() || "ONE_HOUR"
                );
                // Update the context after reinit
                chartSettings.setSymbol(symbol);
              }
            } else {
              await reinitializeChart(
                symbol,
                apiRef.current.getGranularity?.() || "ONE_HOUR"
              );
              // Update the context after reinit
              chartSettings.setSymbol(symbol, uniqueChartId.current);
            }
          }
        },
        setGranularity: async (granularity: Granularity) => {
          if (apiRef.current) {
            const currentGranularity = apiRef.current.getGranularity?.() || "";
            if (currentGranularity === granularity) {
              return;
            }

            // Try the standard setGranularity method first
            if (apiRef.current.setGranularity) {
              try {
                await apiRef.current.setGranularity(granularity);

                // Wait a moment and check if the granularity actually changed
                await new Promise((resolve) => setTimeout(resolve, 100));
                const newGranularity = apiRef.current.getGranularity?.() || "";

                if (newGranularity === granularity) {
                  // Update the context to trigger persistence
                  chartSettings.setGranularity(
                    granularity,
                    uniqueChartId.current
                  );
                  return;
                } else {
                  // Force chart re-initialization with new granularity
                  await reinitializeChart(
                    apiRef.current.getSymbol?.() || "BTC-USD",
                    granularity
                  );
                  // Update the context after reinit
                  chartSettings.setGranularity(
                    granularity,
                    uniqueChartId.current
                  );
                }
              } catch (error) {
                // Fall back to re-initialization
                await reinitializeChart(
                  apiRef.current.getSymbol?.() || "BTC-USD",
                  granularity
                );
                // Update the context after reinit
                chartSettings.setGranularity(granularity);
              }
            } else {
              await reinitializeChart(
                apiRef.current.getSymbol?.() || "BTC-USD",
                granularity
              );
              // Update the context after reinit
              chartSettings.setGranularity(granularity, uniqueChartId.current);
            }
          }
        },
        getSymbol: () => {
          return apiRef.current?.getSymbol() || "";
        },
        getGranularity: () => {
          return apiRef.current?.getGranularity() || "ONE_HOUR";
        },
        activateTrendLineTool: () => {
          if (apiRef.current?.activateTrendLineTool) {
            apiRef.current.activateTrendLineTool();
          }
        },
        deactivateTrendLineTool: () => {
          if (apiRef.current?.deactivateTrendLineTool) {
            apiRef.current.deactivateTrendLineTool();
          }
        },
        get api() {
          return apiRef.current;
        },
      }),
      []
    );

    // Function to set up event handlers
    const setupEventHandlers = useCallback(
      (api: any, currentInitialState: any) => {
        if (!api.on) return;

        // Remove old handlers if they exist
        if (readyHandlerRef.current && api.off) {
          api.off("ready", readyHandlerRef.current);
        }
        if (symbolChangeHandlerRef.current && api.off) {
          api.off("symbolChange", symbolChangeHandlerRef.current);
        }
        if (indicatorChangeHandlerRef.current && api.off) {
          api.off("indicatorChange", indicatorChangeHandlerRef.current);
        }

        // Store the symbolChange handler reference for cleanup
        symbolChangeHandlerRef.current = (event: any) => {
          // Only handle changes after initial setup is complete
          if (!isInitializedRef.current) {
            return;
          }

          // Update context when chart symbol changes internally, but only if different
          if (
            event.newSymbol &&
            event.newSymbol !== chartSettings.settings.symbol
          ) {
            chartSettings.setSymbol(event.newSymbol, uniqueChartId.current);
          }

          // Also check for granularity changes in the same event, but only if different
          if (
            event.newGranularity &&
            event.newGranularity !== chartSettings.settings.granularity
          ) {
            chartSettings.setGranularity(
              event.newGranularity,
              uniqueChartId.current
            );
          }
        };

        // Store the indicatorChange handler reference for cleanup
        indicatorChangeHandlerRef.current = (event: any) => {
          // Only handle changes after initial setup is complete
          if (!isInitializedRef.current) {
            return;
          }

          // Update indicators in context based on chart changes
          if (event.action === "show" && event.indicator) {
            // Use functional update to ensure we get the most current state
            chartSettings.setIndicators((currentIndicators) => {
              const existingIndex = currentIndicators.findIndex(
                (ind) => ind.id === event.indicator.id
              );

              let updatedIndicators;
              if (existingIndex >= 0) {
                // Update existing indicator
                updatedIndicators = [...currentIndicators];
                updatedIndicators[existingIndex] = {
                  ...updatedIndicators[existingIndex],
                  visible: true,
                  display:
                    event.indicator.display === "main" ? "Overlay" : "Bottom",
                  params: event.indicator.params || {},
                };
              } else {
                // Add new indicator
                updatedIndicators = [
                  ...currentIndicators,
                  {
                    id: event.indicator.id,
                    name: event.indicator.name,
                    display:
                      event.indicator.display === "main" ? "Overlay" : "Bottom",
                    visible: true,
                    params: event.indicator.params || {},
                    scale:
                      event.indicator.scale === "value" ? "Price" : "Value",
                    className: "MarketIndicator",
                  },
                ];
              }

              console.log(
                `SCChart: Updated indicators for ${event.indicator.id}:`,
                updatedIndicators.map((i) => `${i.id}(${i.visible})`)
              );
              return updatedIndicators;
            }, uniqueChartId.current);
          } else if (event.action === "hide" && event.indicatorId) {
            // Use functional update for hide as well
            chartSettings.setIndicators((currentIndicators) => {
              const updatedIndicators = currentIndicators.map((ind) =>
                ind.id === event.indicatorId ? { ...ind, visible: false } : ind
              );
              console.log(
                `SCChart: Hidden indicator ${event.indicatorId}:`,
                updatedIndicators.map((i) => `${i.id}(${i.visible})`)
              );
              return updatedIndicators;
            }, uniqueChartId.current);
          }
        };

        // Store the ready handler reference for cleanup
        readyHandlerRef.current = (event: any) => {
          console.log("SCChart: Chart ready event received:", event);

          // Always mark as initialized when ready
          isInitializedRef.current = true;
          setIsApiReady(true); // Mark API as ready

          // Restore indicators from initial state after chart is ready
          if (
            currentInitialState?.indicators &&
            Array.isArray(currentInitialState.indicators) &&
            currentInitialState.indicators.length > 0 &&
            api.showIndicator
          ) {
            console.log(
              "SCChart: Restoring indicators from initial state:",
              currentInitialState.indicators
            );

            // Show all indicators at once using setIndicators if available
            if (api.setIndicators) {
              // Convert string array to IndicatorConfig array
              const indicatorConfigs = currentInitialState.indicators.map(
                (indicatorId: string) => ({
                  id: indicatorId,
                  name: indicatorId.toUpperCase(),
                  visible: true,
                })
              );
              api.setIndicators(indicatorConfigs);
            } else {
              // Fallback to showing indicators one by one
              currentInitialState.indicators.forEach((indicatorId: string) => {
                if (indicatorId.length > 0) {
                  console.log(`SCChart: Restoring indicator '${indicatorId}'`);
                  try {
                    api.showIndicator({
                      id: indicatorId,
                      name: indicatorId.toUpperCase(),
                      visible: true,
                    });
                  } catch (error) {
                    console.error(
                      `SCChart: Failed to show indicator '${indicatorId}':`,
                      error
                    );
                  }
                }
              });
            }
          }

          setIsLoading(false);

          if (onReady) {
            onReady();
          }
        };

        api.on("ready", readyHandlerRef.current);
        api.on("symbolChange", symbolChangeHandlerRef.current);
        api.on("indicatorChange", indicatorChangeHandlerRef.current);
      },
      [chartSettings, onReady, chartId]
    );

    // Function to reinitialize the chart with new parameters
    const reinitializeChart = useCallback(
      async (newSymbol: string, newGranularity: string) => {
        try {
          // Get current visible indicators and trend lines BEFORE cleanup
          const currentIndicators =
            apiRef.current?.getVisibleIndicators?.() || [];
          const visibleIndicatorIds = currentIndicators.map(
            (ind: any) => ind.id
          );
          const currentTrendLines = apiRef.current?.getTrendLines?.() || [];

          console.log(
            "SCChart: Preserving indicators for reinit:",
            visibleIndicatorIds
          );
          console.log(
            "SCChart: Preserving trend lines for reinit:",
            currentTrendLines.length
          );

          // Clean up existing chart and event listeners
          if (apiRef.current) {
            // Remove event listeners if they exist
            if (symbolChangeHandlerRef.current && apiRef.current.off) {
              apiRef.current.off(
                "symbolChange",
                symbolChangeHandlerRef.current
              );
              symbolChangeHandlerRef.current = null;
            }
            if (indicatorChangeHandlerRef.current && apiRef.current.off) {
              apiRef.current.off(
                "indicatorChange",
                indicatorChangeHandlerRef.current
              );
              indicatorChangeHandlerRef.current = null;
            }
            if (readyHandlerRef.current && apiRef.current.off) {
              apiRef.current.off("ready", readyHandlerRef.current);
              readyHandlerRef.current = null;
            }
            if (apiRef.current.dispose) {
              apiRef.current.dispose();
            }
          }
          if (appRef.current && appRef.current.cleanup) {
            appRef.current.cleanup();
          }
          if (chartRef.current && chartRef.current.parentElement) {
            chartRef.current.parentElement.removeChild(chartRef.current);
          }

          // Reset refs
          apiRef.current = null;
          appRef.current = null;
          chartRef.current = null;

          // Set new initial state - include trend lines but not indicators
          const newInitialState = {
            symbol: newSymbol,
            granularity: newGranularity,
            trendLines: currentTrendLines, // Preserve trend lines
            // Don't pass indicators - they will be restored after chart is ready
          };

          console.log(
            `📈 SCChart: Reinitializing chart with preserved state:`,
            {
              symbol: newInitialState.symbol,
              granularity: newInitialState.granularity,
              trendLineCount: newInitialState.trendLines.length,
              trendLines: newInitialState.trendLines,
              chartId: uniqueChartId.current,
            }
          );

          // Find the container
          const container = document.querySelector(
            `[data-chart-id="${uniqueChartId.current}"]`
          ) as HTMLElement;

          if (!container) {
            throw new Error(`Container not found: ${uniqueChartId.current}`);
          }

          // Reinitialize the chart
          const { createChartContainer, initChartWithApi } = await import(
            "@anssipiirainen/sc-charts"
          );

          const chartContainer = createChartContainer();
          chartRef.current = chartContainer;
          container.appendChild(chartContainer as HTMLElement);

          console.log("initChartWithApi", {
            chartContainer,
            firebaseConfig,
            newInitialState,
          });
          const { app, api } = initChartWithApi(
            chartContainer as any,
            firebaseConfig,
            newInitialState as any
          );

          if (!app || !api) {
            throw new Error(
              "Invalid app or api returned during reinitialization"
            );
          }

          appRef.current = app;
          apiRef.current = api;

          // Re-attach event handlers after reinit with preserved indicators
          setupEventHandlers(api, {
            ...newInitialState,
            indicators: visibleIndicatorIds,
          });
        } catch (error) {
          setInitError(
            `Chart reinitialization failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      [firebaseConfig, chartSettings, setupEventHandlers]
    );

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Add trend lines to chart when BOTH API is available AND trend lines are present
    useEffect(() => {
      console.log(
        `📈 SCChart: TrendLine effect running - isApiReady: ${isApiReady}, apiRef.current: ${!!apiRef.current}, trendLines: ${
          initialState?.trendLines?.length || 0
        }`
      );

      // Only proceed if both conditions are met
      if (
        !isApiReady ||
        !apiRef.current ||
        !initialState?.trendLines ||
        initialState.trendLines.length === 0
      ) {
        return;
      }

      // Both API and trend lines are available
      if (
        isApiReady &&
        apiRef.current &&
        initialState?.trendLines &&
        initialState.trendLines.length > 0
      ) {
        console.log(
          `📈 SCChart: Detected trend lines in initialState, adding ${initialState.trendLines.length} trend lines to chart`
        );

        // Check if addTrendLine method exists
        if (!apiRef.current.addTrendLine) {
          console.error(
            `📈 SCChart: addTrendLine method not available on API!`
          );
          console.log(
            `📈 SCChart: Available API methods:`,
            Object.keys(apiRef.current)
          );
          return;
        }

        // Get current trend lines in the chart
        const currentTrendLines = apiRef.current.getTrendLines?.() || [];
        const currentIds = new Set(
          currentTrendLines.map((line: any) => line.id)
        );

        console.log(
          `📈 SCChart: Current trend lines in chart:`,
          currentTrendLines
        );

        // Add only new trend lines that aren't already in the chart
        initialState.trendLines.forEach((trendLine: any) => {
          if (!currentIds.has(trendLine.id)) {
            try {
              console.log(
                `📈 SCChart: Adding trend line ${trendLine.id} to chart:`,
                JSON.stringify(trendLine, null, 2)
              );
              const result = apiRef.current?.addTrendLine({
                ...trendLine,
                selected: false, // trend lines from initial state should not be selected
              });
              console.log(`📈 SCChart: Add trend line result:`, result);
            } catch (error) {
              console.error(
                `📈 SCChart: Failed to add trend line ${trendLine.id}:`,
                error
              );
            }
          } else {
            console.log(
              `📈 SCChart: Trend line ${trendLine.id} already exists in chart`
            );
          }
        });

        // Verify trend lines were added
        setTimeout(() => {
          const updatedTrendLines = apiRef.current.getTrendLines?.();
          console.log(
            `📈 SCChart: Verification - trend lines in chart after adding:`,
            updatedTrendLines
          );
        }, 500);
      }
    }, [initialState?.trendLines, isApiReady]); // Watch both trend lines AND api readiness

    useEffect(() => {
      if (!isClient || appRef.current || isInitializingRef.current) {
        return;
      }

      const initChart = async () => {
        // Set initialization flag to prevent double initialization
        isInitializingRef.current = true;

        try {
          setIsLoading(true);
          setInitError(null);

          // Wait a bit for DOM to be ready, with staggered delay for multiple charts
          const delay = 100 + uniqueChartId.current.length * 50; // Stagger by chart ID
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Find container by ID attribute instead of ref
          let container = document.querySelector(
            `[data-chart-id="${uniqueChartId.current}"]`
          ) as HTMLElement;

          if (!container) {
            // Try alternative selectors - find containers without data-chart-id
            const allContainers = document.querySelectorAll(
              ".trading-chart:not([data-chart-id])"
            );

            if (allContainers.length > 0) {
              const altContainer = allContainers[0] as HTMLElement;
              altContainer.setAttribute("data-chart-id", uniqueChartId.current);
              container = altContainer;
            } else {
              throw new Error(`Container not found: ${uniqueChartId.current}`);
            }
          }

          await initializeChart(container);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          setInitError(`Chart initialization failed: ${errorMessage}`);
          setIsLoading(false);

          // Reset initialization flag on error so retry is possible
          isInitializingRef.current = false;

          if (onError) {
            onError(errorMessage);
          }
        }
      };

      const initializeChart = async (container: HTMLElement) => {
        const { createChartContainer, initChartWithApi } = await import(
          "@anssipiirainen/sc-charts"
        );

        if (!initChartWithApi) {
          throw new Error("initChartWithApi is not available");
        }

        const chartContainer = createChartContainer();
        chartRef.current = chartContainer;
        container.appendChild(chartContainer as HTMLElement);

        // Pass initial state including trend lines
        const chartInitState = {
          symbol: initialState?.symbol || "BTC-USD",
          granularity: initialState?.granularity || "ONE_HOUR",
          // Remove indicators from initial state as they're added after chart is ready
          trendLines: initialState?.trendLines || [], // Include trend lines if provided
        };

        console.log(`📈 SCChart: Initializing chart with state:`, {
          symbol: chartInitState.symbol,
          granularity: chartInitState.granularity,
          trendLineCount: chartInitState.trendLines.length,
          trendLines: chartInitState.trendLines,
          chartId: uniqueChartId.current,
        });

        const { app, api } = initChartWithApi(
          chartContainer as any,
          firebaseConfig,
          chartInitState as any
        );

        if (!app || !api) {
          throw new Error("Invalid app or api returned");
        }

        appRef.current = app;
        apiRef.current = api;

        // Mark API as ready when it's assigned
        if (api) {
          console.log(`📈 SCChart: API initialized and assigned to apiRef`);
        }

        // Set up event handlers
        setupEventHandlers(api, initialState);
      };

      initChart();
    }, [isClient, setupEventHandlers]);

    // Context-to-API sync removed - ChartToolbar now calls API directly
    // SCChart only updates context when API fires symbolChange events

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (apiRef.current) {
          // Remove event listeners if they exist
          if (readyHandlerRef.current && apiRef.current.off) {
            apiRef.current.off("ready", readyHandlerRef.current);
            readyHandlerRef.current = null;
          }
          if (symbolChangeHandlerRef.current && apiRef.current.off) {
            apiRef.current.off("symbolChange", symbolChangeHandlerRef.current);
            symbolChangeHandlerRef.current = null;
          }
          if (indicatorChangeHandlerRef.current && apiRef.current.off) {
            apiRef.current.off(
              "indicatorChange",
              indicatorChangeHandlerRef.current
            );
            indicatorChangeHandlerRef.current = null;
          }
          if (apiRef.current.dispose) {
            apiRef.current.dispose();
          }
        }
        if (appRef.current && appRef.current.cleanup) {
          appRef.current.cleanup();
        }
        if (chartRef.current && chartRef.current.parentElement) {
          chartRef.current.parentElement.removeChild(chartRef.current);
        }
      };
    }, []);

    if (!isClient || isLoading) {
      return (
        <div className={className} style={style}>
          <div className="flex items-center justify-center h-full bg-black rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      );
    }

    if (initError) {
      return (
        <div className={className} style={style}>
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded">
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
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                Chart initialization failed
              </p>
              <p className="text-xs text-red-500 dark:text-red-300 mb-3 max-w-xs">
                {initError}
              </p>
              <button
                onClick={() => {
                  setInitError(null);
                  // Trigger re-initialization
                  if (containerRef.current) {
                    containerRef.current.innerHTML = "";
                  }
                }}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={style}
        data-chart-id={uniqueChartId.current}
      />
    );
  }
);

SCChart.displayName = "SCChart";
