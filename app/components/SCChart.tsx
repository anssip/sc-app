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
}

export interface SCChartRef {
  setSymbol: (symbol: string) => Promise<void>;
  setGranularity: (granularity: Granularity) => Promise<void>;
  getSymbol: () => string;
  getGranularity: () => Granularity;
  api: ChartApi | null;
}

export const SCChart = forwardRef<SCChartRef, SCChartProps>(
  ({ firestore, initialState, className, style, onReady, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const appRef = useRef<any>(null);
    const apiRef = useRef<ChartApi | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);



    useEffect(() => {
      setIsClient(true);
    }, []);

    useImperativeHandle(ref, () => ({
      setSymbol: async (symbol: string) => {
        if (apiRef.current) {
          await apiRef.current.setSymbol(symbol);
        }
      },
      setGranularity: async (granularity: Granularity) => {
        if (apiRef.current) {
          await apiRef.current.setGranularity(granularity);
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

    useEffect(() => {
      console.log("SCChart: Setting isClient to true");
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient || appRef.current) {
        return;
      }

      loadChart();
    }, [isClient]);

    const loadChart = async () => {
      try {
        setIsLoading(true);
        setInitError(null);

        // Find the container element directly instead of using ref
        const containers = document.querySelectorAll('.trading-chart');
        const container = containers[containers.length - 1] as HTMLElement;
        
        if (!container) {
          throw new Error("Could not find chart container element");
        }

        const { createChartContainer, initChartWithApi } = await import("@anssipiirainen/sc-charts");
        
        if (!initChartWithApi) {
          throw new Error("initChartWithApi is not available in the sc-charts library");
        }

        // Create and append chart container
        const chartContainer = createChartContainer();
        chartRef.current = chartContainer;
        container.appendChild(chartContainer as HTMLElement);

        // Initialize the chart with API using Firebase config (recommended approach)
        const { app, api } = await initChartWithApi(
          chartContainer,
          firebaseConfig,
          initialState
        );
        
        if (!app || !api) {
          throw new Error("Chart initialization returned invalid app or api instance");
        }

        appRef.current = app;
        apiRef.current = api;
        setIsLoading(false);
        
        // Call onReady callback if provided
        if (onReady) {
          onReady();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("SCChart: Chart initialization failed:", error);
        
        // Provide specific error messages based on the new Firebase usage patterns
        if (errorMessage.includes("Firebase config")) {
          setInitError("Invalid Firebase configuration - check your config object");
        } else if (errorMessage.includes("Firestore")) {
          setInitError("Firestore initialization failed - check Firebase project settings");
        } else {
          setInitError(`Chart initialization failed: ${errorMessage}`);
        }
        
        setIsLoading(false);
        
        // Call onError callback if provided
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (apiRef.current && apiRef.current.dispose) {
          apiRef.current.dispose();
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

    return <div ref={containerRef} className={className} style={style} />;
  }
);

SCChart.displayName = "SCChart";
