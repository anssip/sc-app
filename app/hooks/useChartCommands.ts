import { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useChartCommands(
  userId: string | undefined,
  chartApi: any,
  activeChartId?: string | null
) {
  const processedCommands = useRef(new Set<string>());

  useEffect(() => {
    if (!userId || !chartApi) return;

    // Subscribe to pending commands
    const commandsRef = collection(db, "users", userId, "chart_commands");
    const q = query(
      commandsRef,
      where("status", "==", "pending"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const commandDoc = change.doc;
            const commandId = commandDoc.id;

            // Skip if already processed
            if (processedCommands.current.has(commandId)) {
              continue;
            }

            processedCommands.current.add(commandId);
            const command = commandDoc.data();

            // Check if command has a target chart ID and if it matches the active chart
            if (
              command.targetChartId &&
              command.targetChartId !== activeChartId
            ) {
              continue;
            }

            try {
              // Execute the command using the Chart API
              const result = await executeChartCommand(
                chartApi,
                command.command,
                command.parameters
              );
              // Update command status to executed
              await updateDoc(
                doc(db, "users", userId, "chart_commands", commandId),
                {
                  status: "executed",
                  executedAt: serverTimestamp(),
                  result: result || null,
                }
              );
            } catch (error) {
              // Update command status to failed
              await updateDoc(
                doc(db, "users", userId, "chart_commands", commandId),
                {
                  status: "failed",
                  executedAt: serverTimestamp(),
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              );
            }
          }
        }
      },
      (error) => {
        // Don't throw - just log the error to prevent uncaught promise rejections
      }
    );

    return () => {
      unsubscribe();
      processedCommands.current.clear();
    };
  }, [userId, chartApi, activeChartId]);
}

async function executeChartCommand(
  apiWrapper: any,
  command: string,
  params: any
): Promise<any> {
  // The actual ChartApi is nested in the api property
  const api = apiWrapper.api || apiWrapper;

  switch (command) {
    case "set_symbol":
      await api.setSymbol(params.symbol);
      return { symbol: params.symbol };

    case "set_granularity":
      // Use the wrapper's setGranularity method if available (for SCChart), otherwise use the api's method
      if (apiWrapper.setGranularity) {
        await apiWrapper.setGranularity(params.granularity);
      } else if (api.setGranularity) {
        await api.setGranularity(params.granularity);
      }
      return { granularity: params.granularity };

    case "show_indicator":
      if (!params.id || !params.name) {
        throw new Error(
          "Indicator ID and name are required for show_indicator command"
        );
      }
      // Validate indicator ID (indicators use kebab-case)
      const validIndicatorIds = [
        "volume",
        "rsi",
        "macd",
        "bollinger-bands",
        "moving-averages",
        "atr",
        "stochastic",
      ];
      if (!validIndicatorIds.includes(params.id)) {
        throw new Error(
          `Invalid indicator ID: ${
            params.id
          }. Valid IDs are: ${validIndicatorIds.join(", ")}`
        );
      }

      if (!api.showIndicator) {
        throw new Error(`api.showIndicator is not a function`);
      }

      api.showIndicator({
        id: params.id,
        name: params.name,
        visible: true,
        params: params.params || {},
      });
      return { indicator: params.id, visible: true };

    case "hide_indicator":
      if (!params.id) {
        throw new Error("Indicator ID is required for hide_indicator command");
      }
      // Validate indicator ID (indicators use kebab-case)
      const validIndicators = [
        "volume",
        "rsi",
        "macd",
        "bollinger-bands",
        "moving-averages",
        "atr",
        "stochastic",
      ];
      if (!validIndicators.includes(params.id)) {
        throw new Error(
          `Invalid indicator ID: ${
            params.id
          }. Valid IDs are: ${validIndicators.join(", ")}`
        );
      }
      if (api.hideIndicator) {
        api.hideIndicator(params.id);
      } else {
        throw new Error("Chart API hideIndicator method not available");
      }
      return { indicator: params.id, visible: false };

    case "add_trend_line":
      // Format description with local timezone if lastTest is provided
      let description = params.description || undefined;
      if (params.lastTest) {
        const date = new Date(params.lastTest);
        const localDateStr = date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });

        // Append local time to description
        if (description) {
          description += ` | Last tested: ${localDateStr}`;
        } else {
          description = `Last tested: ${localDateStr}`;
        }
      }

      const lineId = api.addTrendLine({
        startPoint: params.start,
        endPoint: params.end,
        color: params.color || "#2962ff",
        lineWidth: params.lineWidth || 2,
        style: params.style || "solid",
        extendLeft: params.extendLeft || false,
        extendRight: params.extendRight || false,
        name: params.name || undefined,
        description: description,
        selected: false,
        // New properties for support/resistance visualization
        levelType: params.levelType || undefined,
        opacity: params.opacity || undefined,
        markers: params.markers || undefined,
        zIndex: params.zIndex || undefined,
        animation: params.animation || undefined,
      });
      return { trendLineId: lineId };

    case "remove_trend_line":
      api.removeTrendLine(params.id);
      return { removed: params.id };

    case "clear_trend_lines":
      api.clearTrendLines();
      return { cleared: true };

    case "set_time_range":
      api.setTimeRange({
        start: params.start,
        end: params.end,
      });
      return { timeRange: { start: params.start, end: params.end } };

    case "set_price_range":
      api.setPriceRange({
        min: params.min,
        max: params.max,
      });
      return { priceRange: { min: params.min, max: params.max } };

    case "enter_fullscreen":
      await api.enterFullscreen();
      return { fullscreen: true };

    case "exit_fullscreen":
      await api.exitFullscreen();
      return { fullscreen: false };

    case "get_chart_state":
      const state = api.getState();
      return {
        symbol: state.symbol,
        granularity: state.granularity,
        indicators: api.getVisibleIndicators(),
        trendLines: api.getTrendLines(),
        timeRange: api.getTimeRange(),
        priceRange: api.getPriceRange(),
      };

    case "activate_trend_line_tool":
      api.activateTrendLineTool({
        color: params.color,
        lineWidth: params.lineWidth,
        style: params.style,
      });
      return { toolActive: true };

    case "get_candles":
      // This is a data fetch operation, handled server-side
      // Just acknowledge it was requested
      return { requested: true };

    case "highlight_patterns":
      if (!params.patterns || !Array.isArray(params.patterns)) {
        throw new Error(
          "Patterns array is required for highlight_patterns command"
        );
      }
      if (api.highlightPatterns) {
        api.highlightPatterns(params.patterns);
      } else {
        throw new Error("Chart API highlightPatterns method not available");
      }
      return { highlighted: params.patterns.length };

    case "pulse_wave":
      if (api.pulseWave) {
        api.pulseWave({
          speed: params.speed,
          color: params.color,
          numCandles: params.numCandles,
        });
      } else {
        throw new Error("Chart API pulseWave method not available");
      }
      return { pulseStarted: true };

    case "stop_pulse_wave":
      if (api.stopPulseWave) {
        api.stopPulseWave();
      } else {
        throw new Error("Chart API stopPulseWave method not available");
      }
      return { pulseStopped: true };

    case "clear_pattern_highlights":
      if (api.clearPatternHighlights) {
        api.clearPatternHighlights();
      } else {
        throw new Error(
          "Chart API clearPatternHighlights method not available"
        );
      }
      return { cleared: true };

    case "visualize_divergences":
      if (!params.divergences || !Array.isArray(params.divergences)) {
        throw new Error(
          "Divergences array is required for visualize_divergences command"
        );
      }

      const drawOnPrice = params.drawOnPrice !== false; // Default true
      const drawOnIndicator = params.drawOnIndicator !== false; // Default true
      const bullishColor = params.bullishColor || "#10b981";
      const bearishColor = params.bearishColor || "#ef4444";
      const showLabels = params.showLabels !== false; // Default true

      const drawnLines: string[] = [];

      for (const divergence of params.divergences) {
        // Determine color based on divergence type
        const isBullish = divergence.type === "bullish" || divergence.type === "hidden_bullish";
        const color = isBullish ? bullishColor : bearishColor;

        // Determine line style (dashed for hidden divergences)
        const isHidden = divergence.type?.includes("hidden");
        const style = isHidden ? "dashed" : "solid";

        // Calculate line width based on confidence (higher confidence = thicker line)
        const confidence = divergence.confidence || 50;
        const lineWidth = confidence > 75 ? 3 : 2;

        // Create label for the trend line
        let label = "";
        if (showLabels) {
          const typeLabel = divergence.type?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          label = `${typeLabel} ${divergence.indicator?.toUpperCase()} Divergence`;
          if (divergence.confidence) {
            label += ` (${Math.round(divergence.confidence)}% confidence)`;
          }
        }

        // Draw trend line on price chart
        if (drawOnPrice && divergence.startPoint && divergence.endPoint) {
          const priceLineId = api.addTrendLine({
            startPoint: {
              timestamp: divergence.startPoint.timestamp,
              price: divergence.startPoint.price
            },
            endPoint: {
              timestamp: divergence.endPoint.timestamp,
              price: divergence.endPoint.price
            },
            color: color,
            lineWidth: lineWidth,
            style: style,
            extendLeft: false,
            extendRight: false,
            name: label || `${divergence.type} divergence`,
            description: divergence.description || `${divergence.indicator} divergence detected`,
            selected: false,
            opacity: isHidden ? 0.7 : 1
          });
          drawnLines.push(priceLineId);
        }

        // Note: Drawing on indicator panels would require additional API methods
        // to draw lines on specific indicator panels, which may not be available
        // in the current chart implementation. The price trend lines should be
        // sufficient to visualize the divergences.
      }

      return {
        visualized: params.divergences.length,
        linesDrawn: drawnLines.length,
        lineIds: drawnLines
      };

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
