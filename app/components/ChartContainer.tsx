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
  const { updateChart, saveChart, isLoading: chartsLoading } = useCharts();
  const { indicators: availableIndicators = [], isLoading: indicatorsLoading } =
    useIndicators(db);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSettingsRef = useRef<ChartSettings | null>(null);

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
            console.log(
              "ChartContainer: Skipping persistence - repository still loading"
            );
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
        } catch (error) {
          console.error(
            "Failed to persist settings change to repository:",
            error
          );
        }
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
      console.log(
        "ChartContainer: Repository ready, retrying pending settings save"
      );
      const pendingSettings = pendingSettingsRef.current;
      pendingSettingsRef.current = null;
      handleSettingsChange(pendingSettings, config.id);
    }
  }, [chartsLoading, config.id, handleSettingsChange]);

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
  const { indicators: availableIndicators = [], isLoading: indicatorsLoading } =
    useIndicators(db);
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
    color: '#3b82f6',
    style: 'solid' as 'solid' | 'dashed' | 'dotted',
    lineWidth: 2,
    extendLeft: false,
    extendRight: false,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SCChartRef>(null);
  const { settings } = useChartSettings(config.id);
  const { user } = useAuth();

  // Load trend lines when layout and chart are available
  useEffect(() => {
    const loadTrendLines = async () => {
      if (!layoutId || !config.id || !user?.email || trendLinesLoaded) return;

      try {
        const repository = getRepository(user.email);
        await repository.initialize();
        const loadedTrendLines = await repository.getTrendLines(
          layoutId,
          config.id
        );
        console.log(
          `📊 ChartContainer: Loaded ${loadedTrendLines.length} trend lines from Firestore for chart ${config.id}:`,
          loadedTrendLines
        );

        // Log detailed structure of each loaded trend line
        loadedTrendLines.forEach((line, index) => {
          console.log(
            `📊 ChartContainer: Loaded trend line ${index + 1} structure:`,
            {
              id: line.id,
              hasStartPoint: !!line.startPoint,
              hasEndPoint: !!line.endPoint,
              startPointTimestamp: line.startPoint?.timestamp,
              startPointPrice: line.startPoint?.price,
              endPointTimestamp: line.endPoint?.timestamp,
              endPointPrice: line.endPoint?.price,
              color: line.color,
              lineWidth: line.lineWidth,
              style: line.style,
              fullStructure: line,
            }
          );
        });

        setTrendLines(loadedTrendLines);
        setTrendLinesLoaded(true);

        // If chart API is already available, add trend lines immediately
        if (chartRef.current?.api && loadedTrendLines.length > 0) {
          const api = chartRef.current.api;
          console.log(
            `📊 ChartContainer: Chart API is ready, adding ${loadedTrendLines.length} trend lines immediately`
          );

          loadedTrendLines.forEach((trendLine) => {
            try {
              console.log(
                `📊 ChartContainer: Adding trend line to chart via API:`,
                trendLine
              );
              const result = api.addTrendLine?.(trendLine);
              console.log(`📊 ChartContainer: Add trend line result:`, result);
            } catch (error) {
              console.error(`Failed to add trend line ${trendLine.id}:`, error);
            }
          });

          // Verify trend lines were added
          setTimeout(() => {
            const currentTrendLines = api.getTrendLines?.();
            console.log(
              `📊 ChartContainer: Verification - trend lines in chart after adding:`,
              currentTrendLines
            );
          }, 500);
        }
      } catch (error) {
        console.error("Failed to load trend lines:", error);
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

  console.log(
    `📊 ChartContainer: Passing initialState to SCChart for chart ${config.id}:`,
    {
      symbol: initialState.symbol,
      granularity: initialState.granularity,
      indicatorCount: initialState.indicators.length,
      trendLineCount: initialState.trendLines.length,
      trendLines: initialState.trendLines,
    }
  );

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

  // Detect if iOS
  const isIOS = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  }, []);

  // Detect if running as PWA (standalone mode)
  const isPWA = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  // Detect if iPhone specifically (not iPad)
  const isIPhone = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
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

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden relative"
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
      />

      {/* Symbol Manager Modal */}
      <SymbolManager
        isOpen={isSymbolManagerOpen}
        onClose={() => setIsSymbolManagerOpen(false)}
        layoutId={layoutId}
      />

      {/* Chart Content */}
      <div className="flex-1 relative">
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
                  console.log(
                    `📊 ChartContainer: Chart ready, checking for addTrendLine API...`
                  );
                  console.log(
                    `📊 ChartContainer: api.addTrendLine exists:`,
                    !!api.addTrendLine
                  );
                  console.log(
                    `📊 ChartContainer: Available API methods:`,
                    Object.keys(api)
                  );

                  if (api.addTrendLine) {
                    console.log(
                      `📊 ChartContainer: Adding ${trendLines.length} loaded trend lines to chart after ready`
                    );
                    trendLines.forEach((trendLine) => {
                      console.log(
                        `📊 ChartContainer: Adding trend line to chart:`,
                        JSON.stringify(trendLine, null, 2)
                      );
                      try {
                        // Try to add with ID first, if that fails, add without ID
                        const result = api.addTrendLine(trendLine);
                        console.log(
                          `📊 ChartContainer: Successfully added trend line, result:`,
                          result
                        );
                        // Update previousTrendLines to include the loaded ones
                        previousTrendLines.push(trendLine);
                      } catch (error) {
                        console.error(
                          `Failed to add trend line ${trendLine.id}:`,
                          error
                        );
                        // Try without ID if adding with ID failed
                        try {
                          const { id, ...trendLineWithoutId } = trendLine;
                          const newId = api.addTrendLine(trendLineWithoutId);
                          console.log(`Added trend line with new ID: ${newId}`);
                        } catch (error2) {
                          console.error(
                            `Failed to add trend line even without ID:`,
                            error2
                          );
                        }
                      }
                    });

                    // Verify trend lines were added
                    setTimeout(() => {
                      const currentTrendLines = api.getTrendLines?.();
                      console.log(
                        `📊 ChartContainer: Verification - trend lines in chart after adding:`,
                        currentTrendLines
                      );
                    }, 1000);
                  } else {
                    console.error(
                      `📊 ChartContainer: addTrendLine API method not available!`
                    );
                  }
                } else {
                  console.log(
                    `📊 ChartContainer: Chart ready but no trend lines to add yet (trendLines.length = ${trendLines.length}, trendLinesLoaded = ${trendLinesLoaded})`
                  );
                }

                // Set up trend line selection event listeners
                if (api.on) {
                  // Listen for trend line selection
                  api.on("trend-line-selected", (event: any) => {
                    console.log("Trend line selected:", event);
                    setSelectedTrendLineId(event.trendLineId);
                    setSelectedTrendLine(event.trendLine);
                  });

                  // Listen for trend line deselection
                  api.on("trend-line-deselected", () => {
                    console.log("Trend line deselected");
                    setSelectedTrendLineId(null);
                    setSelectedTrendLine(null);
                  });

                  // Listen for trend line deletion (to clear selection if deleted line was selected)
                  api.on("trend-line-deleted", (event: any) => {
                    console.log("Trend line deleted:", event);
                    if (event.trendLineId === selectedTrendLineId) {
                      setSelectedTrendLineId(null);
                      setSelectedTrendLine(null);
                    }
                  });
                }

                // Periodically check for trend line changes and persist them
                const checkAndSaveTrendLines = async () => {
                  try {
                    const currentTrendLines = api.getTrendLines?.() || [];

                    // Check if trend lines have changed
                    if (
                      JSON.stringify(currentTrendLines) !==
                      JSON.stringify(previousTrendLines)
                    ) {
                      console.log(
                        "📊 ChartContainer: Current trend lines from API:",
                        currentTrendLines
                      );
                      const repository = getRepository(user.email);
                      await repository.initialize();

                      // Save all trend lines (simple approach - replace all)
                      for (const trendLine of currentTrendLines) {
                        console.log(
                          "📊 ChartContainer: Saving trend line structure:",
                          {
                            id: trendLine.id,
                            hasStartPoint: !!trendLine.startPoint,
                            hasEndPoint: !!trendLine.endPoint,
                            startPoint: trendLine.startPoint,
                            endPoint: trendLine.endPoint,
                            fullStructure: trendLine,
                          }
                        );
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
                      console.log(
                        "Trend lines synchronized:",
                        currentTrendLines.length
                      );
                    }
                  } catch (error) {
                    console.error("Failed to synchronize trend lines:", error);
                  }
                };

                // Check for changes every 2 seconds
                const intervalId = setInterval(checkAndSaveTrendLines, 2000);

                // Listen for trend line deletions (this event is documented)
                api.on?.("trend-line-deleted", async (event: any) => {
                  if (event.trendLineId) {
                    try {
                      const repository = getRepository(user.email);
                      await repository.initialize();
                      await repository.deleteTrendLine(
                        layoutId,
                        chartId,
                        event.trendLineId
                      );
                      console.log("Trend line deleted:", event.trendLineId);

                      // Update the previous trend lines cache
                      previousTrendLines = previousTrendLines.filter(
                        (line) => line.id !== event.trendLineId
                      );
                    } catch (error) {
                      console.error("Failed to delete trend line:", error);
                    }
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
