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

    useEffect(() => {
      setIsClient(true);
    }, []);

    useImperativeHandle(ref, () => ({
      setSymbol: async (symbol: string) => {
        console.log(
          `SCChart [${uniqueChartId.current}]: setSymbol called with ${symbol}`
        );
        if (apiRef.current) {
          const currentSymbol = apiRef.current.state?.symbol?.toString() || "";
          if (currentSymbol === symbol) {
            console.log(
              `SCChart [${uniqueChartId.current}]: Symbol already set to ${symbol}, skipping`
            );
            return;
          }

          // Try the standard setSymbol method first
          if (apiRef.current.setSymbol) {
            console.log(
              `SCChart [${uniqueChartId.current}]: Calling api.setSymbol(${symbol})`
            );

            try {
              await apiRef.current.setSymbol(symbol);

              // Wait a moment and check if the symbol actually changed
              await new Promise((resolve) => setTimeout(resolve, 100));
              const newSymbol = apiRef.current.state?.symbol?.toString() || "";

              if (newSymbol === symbol) {
                console.log(
                  `SCChart [${uniqueChartId.current}]: setSymbol successful - symbol is now ${newSymbol}`
                );
                return;
              } else {
                console.warn(
                  `SCChart [${uniqueChartId.current}]: setSymbol didn't update symbol (still ${newSymbol}), trying re-initialization`
                );

                // Force chart re-initialization with new symbol
                await reinitializeChart(
                  symbol,
                  apiRef.current.state?.granularity?.toString() || "ONE_HOUR"
                );
              }
            } catch (error) {
              console.error(
                `SCChart [${uniqueChartId.current}]: setSymbol failed:`,
                error
              );
              // Fall back to re-initialization
              await reinitializeChart(
                symbol,
                apiRef.current.state?.granularity?.toString() || "ONE_HOUR"
              );
            }
          } else {
            console.warn(
              `SCChart [${uniqueChartId.current}]: No setSymbol method found, trying re-initialization`
            );
            await reinitializeChart(
              symbol,
              apiRef.current.state?.granularity?.toString() || "ONE_HOUR"
            );
          }
        } else {
          console.warn(
            `SCChart [${uniqueChartId.current}]: No API available for setSymbol`
          );
        }
      },
      setGranularity: async (granularity: Granularity) => {
        console.log(
          `SCChart [${uniqueChartId.current}]: setGranularity called with ${granularity}`
        );
        if (apiRef.current) {
          const currentGranularity =
            apiRef.current.state?.granularity?.toString() || "";
          if (currentGranularity === granularity) {
            console.log(
              `SCChart [${uniqueChartId.current}]: Granularity already set to ${granularity}, skipping`
            );
            return;
          }

          // Try the standard setGranularity method first
          if (apiRef.current.setGranularity) {
            console.log(
              `SCChart [${uniqueChartId.current}]: Calling api.setGranularity(${granularity})`
            );

            try {
              await apiRef.current.setGranularity(granularity);

              // Wait a moment and check if the granularity actually changed
              await new Promise((resolve) => setTimeout(resolve, 100));
              const newGranularity =
                apiRef.current.state?.granularity?.toString() || "";

              if (newGranularity === granularity) {
                console.log(
                  `SCChart [${uniqueChartId.current}]: setGranularity successful - granularity is now ${newGranularity}`
                );
                return;
              } else {
                console.warn(
                  `SCChart [${uniqueChartId.current}]: setGranularity didn't update granularity (still ${newGranularity}), trying re-initialization`
                );

                // Force chart re-initialization with new granularity
                await reinitializeChart(
                  apiRef.current.state?.symbol?.toString() || "BTC-USD",
                  granularity
                );
              }
            } catch (error) {
              console.error(
                `SCChart [${uniqueChartId.current}]: setGranularity failed:`,
                error
              );
              // Fall back to re-initialization
              await reinitializeChart(
                apiRef.current.state?.symbol?.toString() || "BTC-USD",
                granularity
              );
            }
          } else {
            console.warn(
              `SCChart [${uniqueChartId.current}]: No setGranularity method found, trying re-initialization`
            );
            await reinitializeChart(
              apiRef.current.state?.symbol?.toString() || "BTC-USD",
              granularity
            );
          }
        } else {
          console.warn(
            `SCChart [${uniqueChartId.current}]: No API available for setGranularity`
          );
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
        console.log(
          `SCChart [${uniqueChartId.current}]: Reinitializing chart with symbol=${newSymbol}, granularity=${newGranularity}`
        );

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
          console.log(
            `SCChart [${uniqueChartId.current}]: Loading chart library for reinitialization`
          );
          const { createChartContainer, initChartWithApi } = await import(
            "@anssipiirainen/sc-charts"
          );

          const chartContainer = createChartContainer();
          chartRef.current = chartContainer;
          container.appendChild(chartContainer as HTMLElement);

          const { app, api } = initChartWithApi(
            chartContainer,
            firebaseConfig,
            newInitialState
          );

          if (!app || !api) {
            throw new Error(
              "Invalid app or api returned during reinitialization"
            );
          }

          console.log(
            `SCChart [${uniqueChartId.current}]: Reinitialization successful!`
          );
          appRef.current = app;
          apiRef.current = api;
        } catch (error) {
          console.error(
            `SCChart [${uniqueChartId.current}]: Reinitialization failed:`,
            error
          );
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
      console.log("SCChart: Setting isClient to true");
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient || appRef.current) {
        return;
      }

      console.log(
        `SCChart [${uniqueChartId.current}]: Starting simple initialization`
      );

      const initChart = async () => {
        try {
          setIsLoading(true);
          setInitError(null);

          // Wait a bit for DOM to be ready, with staggered delay for multiple charts
          const delay = 100 + uniqueChartId.current.length * 50; // Stagger by chart ID
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Debug what's in the DOM
          console.log(
            `SCChart [${uniqueChartId.current}]: Searching for container`
          );
          console.log(
            "All elements with data-chart-id:",
            document.querySelectorAll("[data-chart-id]")
          );
          console.log(
            "All trading-chart elements:",
            document.querySelectorAll(".trading-chart")
          );

          // Find container by ID attribute instead of ref
          let container = document.querySelector(
            `[data-chart-id="${uniqueChartId.current}"]`
          ) as HTMLElement;

          if (!container) {
            // Try alternative selectors - find containers without data-chart-id
            const allContainers = document.querySelectorAll(
              ".trading-chart:not([data-chart-id])"
            );
            console.log(
              `SCChart [${uniqueChartId.current}]: Found ${allContainers.length} unused containers`
            );

            if (allContainers.length > 0) {
              const altContainer = allContainers[0] as HTMLElement;
              console.log(
                `SCChart [${uniqueChartId.current}]: Using unused container`
              );
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
          console.error(`SCChart [${uniqueChartId.current}]: Failed:`, error);

          setInitError(`Chart initialization failed: ${errorMessage}`);
          setIsLoading(false);

          if (onError) {
            onError(errorMessage);
          }
        }
      };

      const initializeChart = async (container: HTMLElement) => {
        console.log(
          `SCChart [${uniqueChartId.current}]: Container found, loading library`
        );
        const { createChartContainer, initChartWithApi } = await import(
          "@anssipiirainen/sc-charts"
        );

        if (!initChartWithApi) {
          throw new Error("initChartWithApi is not available");
        }

        console.log(`SCChart [${uniqueChartId.current}]: Creating chart`);
        const chartContainer = createChartContainer();
        chartRef.current = chartContainer;
        container.appendChild(chartContainer as HTMLElement);

        const { app, api } = await initChartWithApi(
          chartContainer,
          firebaseConfig,
          initialState
        );

        if (!app || !api) {
          throw new Error("Invalid app or api returned");
        }

        console.log(`SCChart [${uniqueChartId.current}]: Success!`);
        appRef.current = app;
        apiRef.current = api;

        // Add symbolChange event listener
        if (api.on) {
          // Store the handler reference for cleanup
          symbolChangeHandlerRef.current = (event: any) => {
            console.log(
              `SCChart [${uniqueChartId.current}]: symbolChange event received:`,
              event
            );
            console.log(`  Old symbol: ${event.oldSymbol}`);
            console.log(`  New symbol: ${event.newSymbol}`);
            console.log(`  Refetch: ${event.refetch}`);
          };

          api.on("symbolChange", symbolChangeHandlerRef.current);
          console.log(
            `SCChart [${uniqueChartId.current}]: Added symbolChange event listener`
          );
        } else {
          console.warn(
            `SCChart [${uniqueChartId.current}]: API.on method not available`
          );
        }

        // Debug: Log available API methods
        console.log(
          `SCChart [${uniqueChartId.current}]: Available API methods:`,
          Object.keys(api)
        );
        console.log(`SCChart [${uniqueChartId.current}]: API object:`, api);

        // Debug: Explore the app object for chart control methods
        if (api.app) {
          console.log(
            `SCChart [${uniqueChartId.current}]: App object methods:`,
            Object.keys(api.app)
          );
          console.log(
            `SCChart [${uniqueChartId.current}]: App object:`,
            api.app
          );
        }

        // Debug: Explore the state object
        if (api.state) {
          console.log(
            `SCChart [${uniqueChartId.current}]: State object:`,
            api.state
          );

          // Try to access state properties
          try {
            console.log(
              `SCChart [${uniqueChartId.current}]: State keys:`,
              Object.keys(api.state)
            );
            console.log(
              `SCChart [${uniqueChartId.current}]: Current state.symbol:`,
              api.state.symbol
            );
            console.log(
              `SCChart [${uniqueChartId.current}]: Current state.granularity:`,
              api.state.granularity
            );
          } catch (e) {
            console.log(
              `SCChart [${uniqueChartId.current}]: Could not access state properties:`,
              e
            );
          }
        }

        setIsLoading(false);

        if (onReady) {
          onReady();
        }
      };

      initChart();
    }, [isClient]);

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
