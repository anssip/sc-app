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

export function useChartCommands(userId: string | undefined, chartApi: any) {
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(
        "[ChartCommands] Snapshot received, changes:",
        snapshot.docChanges().length
      );

      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const commandDoc = change.doc;
          const commandId = commandDoc.id;

          console.log("[ChartCommands] New command detected:", {
            id: commandId,
            type: change.type,
          });

          // Skip if already processed
          if (processedCommands.current.has(commandId)) {
            console.log(
              "[ChartCommands] Skipping already processed command:",
              commandId
            );
            continue;
          }

          processedCommands.current.add(commandId);
          const command = commandDoc.data();

          console.log("[ChartCommands] Processing command:", {
            commandId,
            command: command.command,
            parameters: command.parameters,
          });

          try {
            // Execute the command using the Chart API
            console.log("[ChartCommands] Executing command via Chart API...");
            const result = await executeChartCommand(
              chartApi,
              command.command,
              command.parameters
            );
            console.log("[ChartCommands] Command executed successfully:", {
              commandId,
              command: command.command,
              result,
            });

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
            console.error(
              `[ChartCommands] Failed to execute command ${command.command}:`,
              error
            );

            // Update command status to failed
            await updateDoc(
              doc(db, "users", userId, "chart_commands", commandId),
              {
                status: "failed",
                executedAt: serverTimestamp(),
                error: error instanceof Error ? error.message : "Unknown error",
              }
            );
          }
        }
      }
    });

    return () => {
      unsubscribe();
      processedCommands.current.clear();
    };
  }, [userId, chartApi]);
}

async function executeChartCommand(
  api: any,
  command: string,
  params: any
): Promise<any> {
  console.log("[ExecuteChartCommand] Called with:", {
    command,
    params,
    apiAvailable: !!api,
    apiMethods: api
      ? Object.keys(api).filter((key) => typeof api[key] === "function")
      : [],
  });

  switch (command) {
    case "set_symbol":
      await api.setSymbol(params.symbol);
      return { symbol: params.symbol };

    case "set_granularity":
      await api.setGranularity(params.granularity);
      return { granularity: params.granularity };

    case "show_indicator":
      console.log(
        "[ExecuteChartCommand] show_indicator called with params:",
        params
      );
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
      console.log("[ExecuteChartCommand] Calling api.showIndicator with:", {
        id: params.id,
        name: params.name,
        visible: true,
        params: params.params || {},
      });
      api.showIndicator({
        id: params.id,
        name: params.name,
        visible: true,
        params: params.params || {},
      });
      console.log(
        "[ExecuteChartCommand] api.showIndicator called successfully"
      );
      return { indicator: params.id, visible: true };

    case "hide_indicator":
      console.log(
        "[ExecuteChartCommand] hide_indicator called with params:",
        params
      );
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
      console.log(
        "[ExecuteChartCommand] Calling api.hideIndicator with ID:",
        params.id
      );
      console.log(
        "[ExecuteChartCommand] api.hideIndicator exists?",
        typeof api.hideIndicator
      );
      if (api.hideIndicator) {
        api.hideIndicator(params.id);
        console.log(
          "[ExecuteChartCommand] api.hideIndicator called successfully"
        );
      } else {
        console.error(
          "[ExecuteChartCommand] api.hideIndicator is not available!"
        );
        throw new Error("Chart API hideIndicator method not available");
      }
      return { indicator: params.id, visible: false };

    case "add_trend_line":
      const lineId = api.addTrendLine({
        startPoint: params.start,
        endPoint: params.end,
        color: params.color || "#2962ff",
        lineWidth: params.lineWidth || 2,
        style: params.style || "solid",
        extendLeft: params.extendLeft || false,
        extendRight: params.extendRight || false,
        name: params.name || undefined,
        description: params.description || undefined,
        selected: false,
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

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
