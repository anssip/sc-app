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
  ({ firestore, initialState, className, style, onReady, onError, chartId }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const appRef = useRef<any>(null);
    const apiRef = useRef<ChartApi | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    const uniqueChartId = useRef(chartId || `chart-${Math.random().toString(36).substr(2, 9)}`);



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

      console.log(`SCChart [${uniqueChartId.current}]: Starting simple initialization`);
      
      const initChart = async () => {
        try {
          setIsLoading(true);
          setInitError(null);

          // Wait a bit for DOM to be ready, with staggered delay for multiple charts
          const delay = 100 + (uniqueChartId.current.length * 50); // Stagger by chart ID
          await new Promise(resolve => setTimeout(resolve, delay));

          // Debug what's in the DOM
          console.log(`SCChart [${uniqueChartId.current}]: Searching for container`);
          console.log('All elements with data-chart-id:', document.querySelectorAll('[data-chart-id]'));
          console.log('All trading-chart elements:', document.querySelectorAll('.trading-chart'));
          
          // Find container by ID attribute instead of ref
          let container = document.querySelector(`[data-chart-id="${uniqueChartId.current}"]`) as HTMLElement;
          
          if (!container) {
            // Try alternative selectors - find containers without data-chart-id
            const allContainers = document.querySelectorAll('.trading-chart:not([data-chart-id])');
            console.log(`SCChart [${uniqueChartId.current}]: Found ${allContainers.length} unused containers`);
            
            if (allContainers.length > 0) {
              const altContainer = allContainers[0] as HTMLElement;
              console.log(`SCChart [${uniqueChartId.current}]: Using unused container`);
              altContainer.setAttribute('data-chart-id', uniqueChartId.current);
              container = altContainer;
            } else {
              throw new Error(`Container not found: ${uniqueChartId.current}`);
            }
          }

          await initializeChart(container);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`SCChart [${uniqueChartId.current}]: Failed:`, error);
          
          setInitError(`Chart initialization failed: ${errorMessage}`);
          setIsLoading(false);
          
          if (onError) {
            onError(errorMessage);
          }
        }
      };

      const initializeChart = async (container: HTMLElement) => {
        console.log(`SCChart [${uniqueChartId.current}]: Container found, loading library`);
        const { createChartContainer, initChartWithApi } = await import("@anssipiirainen/sc-charts");
        
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
        setIsLoading(false);
        
        if (onReady) {
          onReady();
        }
      };

      initChart();
    }, [isClient, initialState, onReady, onError]);



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
