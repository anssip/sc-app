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
}

export const SCChart = forwardRef<SCChartRef, SCChartProps>(
  (
    { firestore, initialState, className, style, onReady, onError, chartId },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const appRef = useRef<any>(null);
    const apiRef = useRef<ChartApi | null>(null);
    const symbolChangeHandlerRef = useRef<((event: any) => void) | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    const uniqueChartId = useRef(
      chartId || `chart-${Math.random().toString(36).substr(2, 9)}`
    );
    const isInitializedRef = useRef(false);

    // Use chart settings context
    const globalChartSettings = useChartSettings();
    const chartSettings = useChartSettings(uniqueChartId.current);

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

    useImperativeHandle(ref, () => ({
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
                return;
              } else {
                // Force chart re-initialization with new symbol
                await reinitializeChart(
                  symbol,
                  apiRef.current.getGranularity?.() || "ONE_HOUR"
                );
              }
            } catch (error) {
              // Fall back to re-initialization
              await reinitializeChart(
                symbol,
                apiRef.current.getGranularity?.() || "ONE_HOUR"
              );
            }
          } else {
            await reinitializeChart(
              symbol,
              apiRef.current.getGranularity?.() || "ONE_HOUR"
            );
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
                return;
              } else {
                // Force chart re-initialization with new granularity
                await reinitializeChart(
                  apiRef.current.getSymbol?.() || "BTC-USD",
                  granularity
                );
              }
            } catch (error) {
              // Fall back to re-initialization
              await reinitializeChart(
                apiRef.current.getSymbol?.() || "BTC-USD",
                granularity
              );
            }
          } else {
            await reinitializeChart(
              apiRef.current.getSymbol?.() || "BTC-USD",
              granularity
            );
          }
        }
      },
      getSymbol: () => {
        return apiRef.current?.getSymbol() || "";
      },
      getGranularity: () => {
        return apiRef.current?.getGranularity() || "ONE_HOUR";
      },
      api: apiRef.current,
    }));

    // Function to reinitialize the chart with new parameters
    const reinitializeChart = useCallback(
      async (newSymbol: string, newGranularity: string) => {
        try {
          // Clean up existing chart and event listeners
          if (apiRef.current) {
            // Remove event listener if it exists
            if (symbolChangeHandlerRef.current && apiRef.current.off) {
              apiRef.current.off(
                "symbolChange",
                symbolChangeHandlerRef.current
              );
              symbolChangeHandlerRef.current = null;
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

          // Set new initial state
          const newInitialState = {
            symbol: newSymbol,
            granularity: newGranularity,
          };

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
        } catch (error) {
          setInitError(
            `Chart reinitialization failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      [firebaseConfig]
    );

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient || appRef.current) {
        return;
      }

      const initChart = async () => {
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

        const { app, api } = await initChartWithApi(
          chartContainer as any,
          firebaseConfig,
          initialState as any
        );

        if (!app || !api) {
          throw new Error("Invalid app or api returned");
        }

        appRef.current = app;
        apiRef.current = api;

        // Add symbolChange event listener
        if (api.on) {
          // Store the handler reference for cleanup
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
              chartSettings.setSymbol(event.newSymbol);
            }

            // Also check for granularity changes in the same event, but only if different
            if (
              event.newGranularity &&
              event.newGranularity !== chartSettings.settings.granularity
            ) {
              chartSettings.setGranularity(event.newGranularity);
            }
          };

          api.on("symbolChange", symbolChangeHandlerRef.current);
        }

        setIsLoading(false);

        // Mark as initialized after a brief delay to avoid capturing initial symbol changes
        setTimeout(() => {
          isInitializedRef.current = true;
        }, 100);

        if (onReady) {
          onReady();
        }
      };

      initChart();
    }, [isClient]);

    // Sync chart API with context changes (from toolbar)
    useEffect(() => {
      if (!isInitializedRef.current || !apiRef.current) {
        return;
      }

      const currentSymbol = apiRef.current.getSymbol?.() || "";
      const currentGranularity = apiRef.current.getGranularity?.() || "";

      // Update chart symbol if context changed
      if (chartSettings.settings.symbol !== currentSymbol) {
        apiRef.current.setSymbol?.(chartSettings.settings.symbol);
      }

      // Update chart granularity if context changed
      if (chartSettings.settings.granularity !== currentGranularity) {
        apiRef.current.setGranularity?.(chartSettings.settings.granularity);
      }
    }, [chartSettings.settings.symbol, chartSettings.settings.granularity]);

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (apiRef.current) {
          // Remove event listener if it exists
          if (symbolChangeHandlerRef.current && apiRef.current.off) {
            apiRef.current.off("symbolChange", symbolChangeHandlerRef.current);
            symbolChangeHandlerRef.current = null;
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
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {!isClient ? "Loading chart..." : "Initializing chart API..."}
              </p>
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
