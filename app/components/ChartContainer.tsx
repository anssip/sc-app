import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { SCChart, SCChartRef } from "./SCChart";
import { ChartHeader } from "./ChartHeader";
import { ChartLineToolbar } from "./ChartLineToolbar";
import { SymbolManager } from "./SymbolManager";
import { db } from "~/lib/firebase";
import { useCharts } from "~/hooks/useRepository";
import { useIndicators } from "~/hooks/useIndicators";
import { getRepository } from "~/services/repository";
import { useAuth } from "~/lib/auth-context";
import type { TrendLine } from "~/types";
import {
  ChartSettingsProvider,
  useChartSettings,
  type ChartSettings,
  type IndicatorConfig,
} from "~/contexts/ChartSettingsContext";
import { useActiveChart } from "~/contexts/ActiveChartContext";
import type { Granularity } from "@anssip/rs-charts";

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
  onApiReady?: (api: any) => void;
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
  onApiReady,
}) => {
  const { updateChart, saveChart, isLoading: chartsLoading } = useCharts();
  const { indicators: availableIndicators = [], isLoading: indicatorsLoading } =
    useIndicators(db);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSettingsRef = useRef<ChartSettings | null>(null);

  // Memoize the settings change handler to prevent recreation on every render
  const handleSettingsChange = useCallback(
    async (settings: ChartSettings, chartId?: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the persistence to prevent rapid updates
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Convert rich IndicatorConfig objects to simple indicator ID strings
          const indicatorIds = settings.indicators
            .filter((indicator) => indicator.visible)
            .map((indicator) => indicator.id);

          // Update the config through the callback
          const updatedConfig = {
            ...config,
            symbol: settings.symbol,
            granularity: settings.granularity,
            indicators: indicatorIds,
          };

          if (onConfigUpdate) {
            onConfigUpdate(updatedConfig);
          }

          // Skip persistence if charts are still loading (repository not ready)
          if (chartsLoading) {
            // Store the pending settings to retry later
            pendingSettingsRef.current = settings;
            return;
          }

          // Persist to repository (chart-specific persistence)
          // Don't trigger layout auto-save as this is a chart data change, not structural
          try {
            const result = await updateChart(
              config.id,
              {
                symbol: settings.symbol,
                granularity: settings.granularity,
                indicators: indicatorIds,
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
                  indicators: indicatorIds,
                },
                layoutId
              );
            } else {
              throw updateError;
            }
          }
        } catch (error) {}
      }, 500); // Wait 500ms before persisting
    },
    [config, onConfigUpdate, chartsLoading, updateChart, saveChart, layoutId]
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Retry pending settings when repository becomes ready
  useEffect(() => {
    if (!chartsLoading && pendingSettingsRef.current) {
      const pendingSettings = pendingSettingsRef.current;
      pendingSettingsRef.current = null;
      handleSettingsChange(pendingSettings, config.id);
    }
  }, [chartsLoading, config.id, handleSettingsChange]);

  // Memoize initial settings to prevent recreation on every render
  const initialSettings = useMemo(() => {
    // Don't process indicators while still loading - wait for them to be available
    if (indicatorsLoading || availableIndicators.length === 0) {
      return {
        symbol: config.symbol,
        granularity: config.granularity,
        indicators: [],
      };
    }

    // Convert indicator IDs from config to full IndicatorConfig objects
    const indicatorConfigs: IndicatorConfig[] = (config.indicators || [])
      .map((indicatorId: string) => {
        const availableIndicator = availableIndicators.find(
          (ind) => ind.id === indicatorId
        );
        if (availableIndicator) {
          return {
            ...availableIndicator,
            visible: true, // Mark as visible since it's in the saved config
          };
        } else {
          // Create a fallback indicator config if not found in available indicators
          return {
            id: indicatorId,
            name: indicatorId.toUpperCase(),
            display: "Bottom",
            visible: true,
            params: {},
            scale: "Value",
            className: "MarketIndicator",
          };
        }
      })
      .filter(Boolean);

    return {
      symbol: config.symbol,
      granularity: config.granularity,
      indicators: indicatorConfigs,
    };
  }, [
    config.symbol,
    config.granularity,
    config.indicators,
    availableIndicators,
    indicatorsLoading,
  ]);

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
        onApiReady={onApiReady}
      />
    </ChartSettingsProvider>
  );
};

const ChartContainerInner: React.FC<ChartContainerProps> = ({
  config,
  layoutId,
  onRemove,
  onConfigUpdate,
  onApiReady,
}) => {
  const { updateChart, saveChart } = useCharts();
  const { indicators: availableIndicators = [], isLoading: indicatorsLoading } =
    useIndicators(db);
  const {
    activeChartId,
    setActiveChart,
    registerChartApi,
    unregisterChartApi,
  } = useActiveChart();
  const unregisterRef = useRef(unregisterChartApi);
  unregisterRef.current = unregisterChartApi;
  const [chartError, setChartError] = useState<string | null>(null);
  const [isChangingSymbol, setIsChangingSymbol] = useState(false);
  const [isChangingGranularity, setIsChangingGranularity] = useState(false);
  const [isSymbolManagerOpen, setIsSymbolManagerOpen] = useState(false);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const [trendLinesLoaded, setTrendLinesLoaded] = useState(false);
  const [selectedTrendLine, setSelectedTrendLine] = useState<TrendLine | null>(
    null
  );
  const [selectedTrendLineId, setSelectedTrendLineId] = useState<string | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTrendLineToolActive, setIsTrendLineToolActive] = useState(false);
  const [defaultTrendLineSettings, setDefaultTrendLineSettings] = useState({
    color: "#3b82f6",
    style: "solid" as "solid" | "dashed" | "dotted",
    lineWidth: 2,
    extendLeft: false,
    extendRight: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SCChartRef>(null);
  const { settings } = useChartSettings(config.id);
  const { user } = useAuth();
  const isActive = activeChartId === config.id;

  // Update ActiveChartContext registration when settings change
  useEffect(() => {
    if (chartRef.current) {
      registerChartApi(
        config.id,
        chartRef.current,
        settings.symbol,
        settings.granularity
      );
    }
  }, [config.id, settings.symbol, settings.granularity, registerChartApi]);

  // Load trend lines when layout and chart are available
  useEffect(() => {
    const loadTrendLines = async () => {
      // Skip loading trend lines for anonymous users or when already loaded
      if (!layoutId || !config.id || !user?.email || trendLinesLoaded) return;

      try {
        const repository = getRepository(user.email);
        await repository.initialize();
        const loadedTrendLines = await repository.getTrendLines(
          layoutId,
          config.id
        );
        // Log detailed structure of each loaded trend line
        loadedTrendLines.forEach((line, index) => {});

        setTrendLines(loadedTrendLines);
        setTrendLinesLoaded(true);

        // If chart API is already available, add trend lines immediately
        if (chartRef.current?.api && loadedTrendLines.length > 0) {
          const api = chartRef.current.api;
          loadedTrendLines.forEach((trendLine) => {
            try {
              const result = api.addTrendLine?.(trendLine);
            } catch (error) {}
          });

          // Verify trend lines were added
          setTimeout(() => {
            const currentTrendLines = api.getTrendLines?.();
          }, 500);
        }
      } catch (error) {
        setTrendLinesLoaded(true); // Mark as loaded even on error to prevent infinite retries
      }
    };

    loadTrendLines();
  }, [layoutId, config.id, user?.email, trendLinesLoaded]);

  // Create initial state with current trend lines (will be empty initially)
  const initialState = useMemo(
    () => ({
      symbol: config.symbol,
      granularity: config.granularity,
      indicators: config.indicators || [],
      trendLines: trendLines, // Include loaded trend lines
    }),
    [config.symbol, config.granularity, config.indicators, trendLines]
  );

  // Dummy handlers for split functionality (to be implemented later)
  const handleSplitHorizontal = () => {
    // TODO: Implement split functionality
  };

  const handleSplitVertical = () => {
    // TODO: Implement split functionality
  };

  const handleAddChart = () => {
    // TODO: Implement add chart functionality
  };

  // Detect if iOS
  const isIOS = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  }, []);

  // Detect if running as PWA (standalone mode)
  const isPWA = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  // Detect if iPhone specifically (not iPad)
  const isIPhone = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return /iPhone/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Handle fullscreen toggle for individual chart
  const handleToggleFullscreen = useCallback(() => {
    if (isIOS) {
      // iOS-specific fullscreen handling
      if (!isFullscreen) {
        // Enter fullscreen on iOS
        setIsFullscreen(true);

        // Add fullscreen styles to container
        if (containerRef.current) {
          containerRef.current.style.position = "fixed";
          containerRef.current.style.left = "0";
          containerRef.current.style.right = "0";
          containerRef.current.style.zIndex = "9999";
          containerRef.current.style.width = "100vw";

          // For iPhone in PWA mode, add top and bottom padding to account for notch and home indicator
          if (isIPhone && isPWA) {
            containerRef.current.style.top = "44px"; // Standard iPhone notch safe area
            containerRef.current.style.bottom = "20px"; // Home indicator safe area (same as pb-5)
            containerRef.current.style.height = "calc(100vh - 64px)"; // Total: 44px top + 20px bottom
          } else {
            containerRef.current.style.top = "0";
            containerRef.current.style.bottom = "0";
            containerRef.current.style.height = "100vh";
          }
        }

        // Scroll to hide address bar (for non-PWA mode)
        window.scrollTo(0, 1);
      } else {
        // Exit fullscreen on iOS
        setIsFullscreen(false);

        // Remove fullscreen styles
        if (containerRef.current) {
          containerRef.current.style.position = "";
          containerRef.current.style.top = "";
          containerRef.current.style.left = "";
          containerRef.current.style.right = "";
          containerRef.current.style.bottom = "";
          containerRef.current.style.zIndex = "";
          containerRef.current.style.width = "";
          containerRef.current.style.height = "";
        }

        // Scroll back to top
        window.scrollTo(0, 0);
      }
    } else {
      // Standard fullscreen for non-iOS devices
      if (!isFullscreen) {
        // Enter fullscreen
        setIsFullscreen(true);

        // Add fullscreen styles to container
        if (containerRef.current) {
          containerRef.current.style.position = "fixed";
          containerRef.current.style.top = "0";
          containerRef.current.style.left = "0";
          containerRef.current.style.right = "0";
          containerRef.current.style.bottom = "0";
          containerRef.current.style.zIndex = "9999";
          containerRef.current.style.width = "100vw";
          containerRef.current.style.height = "100vh";
        }
      } else {
        // Exit fullscreen
        setIsFullscreen(false);

        // Remove fullscreen styles
        if (containerRef.current) {
          containerRef.current.style.position = "";
          containerRef.current.style.top = "";
          containerRef.current.style.left = "";
          containerRef.current.style.right = "";
          containerRef.current.style.bottom = "";
          containerRef.current.style.zIndex = "";
          containerRef.current.style.width = "";
          containerRef.current.style.height = "";
        }
      }
    }

    // Trigger resize event for chart to recalculate
    window.dispatchEvent(new Event("resize"));
  }, [isFullscreen, isIOS, isIPhone, isPWA]);

  // Handler for updating trend line settings
  const handleUpdateTrendLineSettings = useCallback(
    (settings: Partial<any>) => {
      if (!selectedTrendLineId || !chartRef.current?.api) return;

      const api = chartRef.current.api;

      // Map our settings to the API's expected format
      const updates: any = {};
      if (settings.color !== undefined) updates.color = settings.color;
      if (settings.style !== undefined) updates.style = settings.style;
      if (settings.thickness !== undefined)
        updates.lineWidth = settings.thickness;
      if (settings.extendLeft !== undefined)
        updates.extendLeft = settings.extendLeft;
      if (settings.extendRight !== undefined)
        updates.extendRight = settings.extendRight;

      // Update via Chart API
      api.updateTrendLineSettings?.(selectedTrendLineId, updates);

      // Update local state
      if (selectedTrendLine) {
        setSelectedTrendLine({
          ...selectedTrendLine,
          ...updates,
        });
      }
    },
    [selectedTrendLineId, selectedTrendLine]
  );

  // Handler for deleting selected trend line
  const handleDeleteTrendLine = useCallback(() => {
    if (!selectedTrendLineId || !chartRef.current?.api) return;

    const api = chartRef.current.api;
    api.removeTrendLine?.(selectedTrendLineId);

    // Clear selection
    setSelectedTrendLine(null);
    setSelectedTrendLineId(null);
  }, [selectedTrendLineId]);

  // Handler for activating/deactivating trend line tool
  const handleActivateTrendLineTool = useCallback(() => {
    if (!chartRef.current?.api) return;

    const api = chartRef.current.api;

    if (isTrendLineToolActive) {
      // Deactivate the tool
      api.deactivateTrendLineTool?.();
      setIsTrendLineToolActive(false);

      // Deselect all trend lines when closing the tool
      api.deselectAllTrendLines?.();
      setSelectedTrendLineId(null);
      setSelectedTrendLine(null);
    } else {
      // Activate the tool with default settings
      api.activateTrendLineTool?.({
        color: defaultTrendLineSettings.color,
        lineWidth: defaultTrendLineSettings.lineWidth,
        style: defaultTrendLineSettings.style,
        extendLeft: defaultTrendLineSettings.extendLeft,
        extendRight: defaultTrendLineSettings.extendRight,
      });
      setIsTrendLineToolActive(true);
    }
  }, [isTrendLineToolActive, defaultTrendLineSettings]);

  // Handler for deactivating trend line tool (called from close button)
  const handleDeactivateTrendLineTool = useCallback(() => {
    if (!chartRef.current?.api) return;

    const api = chartRef.current.api;
    api.deactivateTrendLineTool?.();
    setIsTrendLineToolActive(false);

    // Deselect all trend lines when closing the tool
    api.deselectAllTrendLines?.();
    setSelectedTrendLineId(null);
    setSelectedTrendLine(null);
  }, []);

  // Update trend line tool defaults when settings change
  useEffect(() => {
    if (!chartRef.current?.api || !isTrendLineToolActive) return;

    const api = chartRef.current.api;
    // Update the defaults for new trend lines when user changes settings
    api.setTrendLineDefaults?.({
      color: defaultTrendLineSettings.color,
      lineWidth: defaultTrendLineSettings.lineWidth,
      style: defaultTrendLineSettings.style,
      extendLeft: defaultTrendLineSettings.extendLeft,
      extendRight: defaultTrendLineSettings.extendRight,
    });
  }, [defaultTrendLineSettings, isTrendLineToolActive]);

  // Unregister chart API on unmount only
  useEffect(() => {
    const chartId = config.id;
    return () => {
      // Use the ref to ensure we have the latest unregister function
      unregisterRef.current(chartId);
    };
  }, [config.id]);

  // Handle click to activate chart - memoized to prevent recreation
  const handleChartActivation = useCallback(
    (e: React.MouseEvent) => {
      // Activate chart when clicking anywhere on it (if inactive)
      if (!isActive) {
        setActiveChart(config.id);
        // Stop propagation to prevent bubbling
        e.stopPropagation();
      }
    },
    [isActive, config.id, setActiveChart]
  );

  // Memoize the onApiReady handler to prevent SCChart re-renders
  const handleApiReady = useCallback(
    (api: any) => {
      // Register the SCChart ref (which has wrapper methods) with the ActiveChartContext
      // We need to wait a tick for the ref to be fully set up
      setTimeout(() => {
        if (chartRef.current) {
          registerChartApi(
            config.id,
            chartRef.current,
            settings.symbol,
            settings.granularity
          );
        }
      }, 0);

      // Also call the original onApiReady if provided
      if (onApiReady) {
        onApiReady(api);
      }
    },
    [
      config.id,
      settings.symbol,
      settings.granularity,
      registerChartApi,
      onApiReady,
    ]
  );

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col rounded-lg overflow-hidden relative transition-all duration-200 ${
        isActive
          ? "border-2 border-green-500/50 shadow-lg shadow-green-500/20"
          : "cursor-pointer"
      }`}
      onClick={handleChartActivation}
    >
      <ChartHeader
        chartId={config.id}
        chartApiRef={chartRef}
        isChangingSymbol={isChangingSymbol}
        isChangingGranularity={isChangingGranularity}
        onDelete={onRemove}
        onSplitHorizontal={handleSplitHorizontal}
        onSplitVertical={handleSplitVertical}
        onOpenSymbolManager={() => setIsSymbolManagerOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        layoutId={layoutId}
        isTrendLineToolActive={isTrendLineToolActive}
        onToggleTrendLineTool={handleActivateTrendLineTool}
        isActive={isActive}
      />

      {/* Symbol Manager Modal */}
      <SymbolManager
        isOpen={isSymbolManagerOpen}
        onClose={() => setIsSymbolManagerOpen(false)}
        layoutId={layoutId}
      />

      {/* Chart Content - disable interactions when inactive */}
      <div
        className={`flex-1 relative ${!isActive ? "pointer-events-none" : ""}`}
      >
        {/* Trend Line Toolbar */}
        <ChartLineToolbar
          trendLine={selectedTrendLine}
          onUpdateSettings={handleUpdateTrendLineSettings}
          onDelete={handleDeleteTrendLine}
          isVisible={isTrendLineToolActive || !!selectedTrendLine}
          onClose={handleDeactivateTrendLineTool}
          defaultSettings={defaultTrendLineSettings}
          onDefaultSettingsChange={setDefaultTrendLineSettings}
        />
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
            onApiReady={handleApiReady}
            chartId={config.id}
            onReady={() => {
              // Set up trend line event listeners when chart is ready
              if (
                chartRef.current?.api &&
                layoutId &&
                config.id &&
                user?.email
              ) {
                const api = chartRef.current.api;
                let previousTrendLines: TrendLine[] = [];
                const chartId = config.id;

                // Add loaded trend lines to the chart after it's ready (if they're already loaded)
                if (trendLines.length > 0 && trendLinesLoaded) {
                  if (api.addTrendLine) {
                    trendLines.forEach((trendLine) => {
                      try {
                        // Try to add with ID first, if that fails, add without ID
                        const result = api.addTrendLine(trendLine);
                        // Update previousTrendLines to include the loaded ones
                        previousTrendLines.push(trendLine);
                      } catch (error) {
                        // Try without ID if adding with ID failed
                        try {
                          const { id, ...trendLineWithoutId } = trendLine;
                          const newId = api.addTrendLine(trendLineWithoutId);
                        } catch (error2) {}
                      }
                    });

                    // Verify trend lines were added
                    setTimeout(() => {
                      const currentTrendLines = api.getTrendLines?.();
                    }, 1000);
                  } else {
                  }
                } else {
                }

                // Set up trend line selection event listeners
                if (api.on) {
                  // Listen for trend line selection
                  api.on("trend-line-selected", (event: any) => {
                    setSelectedTrendLineId(event.trendLineId);
                    setSelectedTrendLine(event.trendLine);
                  });

                  // Listen for trend line deselection
                  api.on("trend-line-deselected", () => {
                    setSelectedTrendLineId(null);
                    setSelectedTrendLine(null);
                  });

                  // Listen for trend line deletion (to clear selection if deleted line was selected)
                  api.on("trend-line-deleted", (event: any) => {
                    if (event.trendLineId === selectedTrendLineId) {
                      setSelectedTrendLineId(null);
                      setSelectedTrendLine(null);
                    }
                  });
                }

                // Periodically check for trend line changes and persist them
                const checkAndSaveTrendLines = async () => {
                  try {
                    const rawTrendLines = api.getTrendLines?.() || [];

                    // Convert to array first to avoid proxy issues, then process
                    const currentTrendLines = [];

                    for (let i = 0; i < rawTrendLines.length; i++) {
                      try {
                        // Access the proxy object carefully
                        const line = rawTrendLines[i];

                        // Build a clean object without touching proxy internals
                        const cleanLine: any = {};

                        // Safely extract id
                        try {
                          cleanLine.id = String(
                            line.id ||
                              `trend-line-${Date.now()}-${Math.random()}`
                          );
                        } catch {
                          cleanLine.id = `trend-line-${Date.now()}-${Math.random()}`;
                        }

                        // Safely extract startPoint
                        try {
                          if (line.startPoint) {
                            const sp = line.startPoint;
                            // Check for both timestamp and time properties (library might use either)
                            const timeValue =
                              sp.timestamp !== undefined
                                ? sp.timestamp
                                : sp.time;
                            const priceValue =
                              sp.price !== undefined ? sp.price : sp.value;

                            if (
                              timeValue !== undefined &&
                              priceValue !== undefined
                            ) {
                              cleanLine.startPoint = {
                                timestamp: Number(timeValue),
                                price: Number(priceValue),
                              };
                            }
                          }
                        } catch (e) {}

                        // Safely extract endPoint
                        try {
                          if (line.endPoint) {
                            const ep = line.endPoint;
                            // Check for both timestamp and time properties (library might use either)
                            const timeValue =
                              ep.timestamp !== undefined
                                ? ep.timestamp
                                : ep.time;
                            const priceValue =
                              ep.price !== undefined ? ep.price : ep.value;

                            if (
                              timeValue !== undefined &&
                              priceValue !== undefined
                            ) {
                              cleanLine.endPoint = {
                                timestamp: Number(timeValue),
                                price: Number(priceValue),
                              };
                            }
                          }
                        } catch (e) {}

                        // Safely extract style (line style like solid/dashed/dotted)
                        try {
                          // Check if there's a direct style property (string)
                          if (typeof line.style === "string") {
                            cleanLine.style = line.style;
                          }
                          // Check if style is nested in an object with a style property
                          else if (line.style?.style !== undefined) {
                            // Convert numeric style to string if needed
                            const styleNum = Number(line.style.style);
                            if (styleNum === 0) cleanLine.style = "solid";
                            else if (styleNum === 1) cleanLine.style = "dotted";
                            else if (styleNum === 2) cleanLine.style = "dashed";
                            else cleanLine.style = "solid";
                          }
                          // Default to solid if no style found
                          else {
                            cleanLine.style = "solid";
                          }
                        } catch (e) {
                          cleanLine.style = "solid";
                        }

                        // Safely extract extend
                        try {
                          if (line.extend) {
                            cleanLine.extend = {
                              left: Boolean(line.extend.left),
                              right: Boolean(line.extend.right),
                            };
                          }
                        } catch (e) {}

                        // Safely extract text
                        try {
                          if (line.text !== undefined && line.text !== null) {
                            cleanLine.text = String(line.text);
                          }
                        } catch (e) {}

                        // Safely extract name
                        try {
                          if (line.name !== undefined && line.name !== null) {
                            cleanLine.name = String(line.name);
                          }
                        } catch (e) {}

                        // Safely extract description
                        try {
                          if (
                            line.description !== undefined &&
                            line.description !== null
                          ) {
                            cleanLine.description = String(line.description);
                          }
                        } catch (e) {}

                        // Safely extract color (separate from style)
                        try {
                          if (line.color !== undefined && line.color !== null) {
                            cleanLine.color = String(line.color);
                          } else if (line.style?.color) {
                            cleanLine.color = String(line.style.color);
                          }
                        } catch (e) {}

                        // Safely extract lineWidth (separate from style)
                        try {
                          if (
                            line.lineWidth !== undefined &&
                            line.lineWidth !== null
                          ) {
                            cleanLine.lineWidth = Number(line.lineWidth);
                          } else if (line.style?.width !== undefined) {
                            cleanLine.lineWidth = Number(line.style.width);
                          }
                        } catch (e) {}

                        // Safely extract extendLeft and extendRight (from extend or direct properties)
                        try {
                          if (line.extendLeft !== undefined) {
                            cleanLine.extendLeft = Boolean(line.extendLeft);
                          } else if (line.extend?.left !== undefined) {
                            cleanLine.extendLeft = Boolean(line.extend.left);
                          }
                        } catch (e) {}

                        try {
                          if (line.extendRight !== undefined) {
                            cleanLine.extendRight = Boolean(line.extendRight);
                          } else if (line.extend?.right !== undefined) {
                            cleanLine.extendRight = Boolean(line.extend.right);
                          }
                        } catch (e) {}

                        currentTrendLines.push(cleanLine);
                      } catch (lineError) {}
                    }

                    // Check if trend lines have changed
                    if (
                      JSON.stringify(currentTrendLines) !==
                      JSON.stringify(previousTrendLines)
                    ) {
                      // Skip saving trend lines for anonymous users
                      if (!user?.email) {
                        return;
                      }

                      const repository = getRepository(user.email);
                      await repository.initialize();

                      // Save all trend lines (simple approach - replace all)
                      for (const trendLine of currentTrendLines) {
                        await repository.saveTrendLine(
                          layoutId,
                          chartId,
                          trendLine
                        );
                      }

                      // Remove deleted trend lines
                      for (const prevLine of previousTrendLines) {
                        if (
                          !currentTrendLines.find(
                            (line: TrendLine) => line.id === prevLine.id
                          )
                        ) {
                          await repository.deleteTrendLine(
                            layoutId,
                            chartId,
                            prevLine.id
                          );
                        }
                      }

                      previousTrendLines = [...currentTrendLines];
                    }
                  } catch (error) {}
                };

                // Check for changes every 2 seconds
                const intervalId = setInterval(checkAndSaveTrendLines, 2000);

                // Listen for trend line deletions (this event is documented)
                api.on?.("trend-line-deleted", async (event: any) => {
                  if (event.trendLineId) {
                    try {
                      // Skip deleting trend lines for anonymous users
                      if (!user?.email) {
                        return;
                      }

                      const repository = getRepository(user.email);
                      await repository.initialize();
                      await repository.deleteTrendLine(
                        layoutId,
                        chartId,
                        event.trendLineId
                      );
                      // Update the previous trend lines cache
                      previousTrendLines = previousTrendLines.filter(
                        (line) => line.id !== event.trendLineId
                      );
                    } catch (error) {}
                  }
                });

                // Clean up interval on unmount
                return () => {
                  clearInterval(intervalId);
                };
              }
            }}
            onError={(error) => setChartError(error)}
          />
        )}
      </div>
    </div>
  );
};
