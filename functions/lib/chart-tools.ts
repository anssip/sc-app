// Chart tool definitions based on CHART_API_REFERENCE.md

interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export const chartTools = {
  definitions: [
    {
      type: "function",
      function: {
        name: "set_symbol",
        description: "Change the trading pair symbol on the chart",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Trading pair symbol (e.g., BTC-USD, ETH-USD)",
            },
          },
          required: ["symbol"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "set_granularity",
        description: "Change the chart timeframe/granularity",
        parameters: {
          type: "object",
          properties: {
            granularity: {
              type: "string",
              enum: [
                "ONE_MINUTE",
                "FIVE_MINUTE",
                "FIFTEEN_MINUTE",
                "THIRTY_MINUTE",
                "ONE_HOUR",
                "TWO_HOUR",
                "SIX_HOUR",
                "ONE_DAY",
              ],
              description: "Chart timeframe",
            },
          },
          required: ["granularity"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "show_indicator",
        description: "Display a technical indicator on the chart",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: [
                "volume",
                "rsi",
                "macd",
                "bollinger-bands",
                "moving-averages",
                "atr",
                "stochastic",
              ],
              description: "Indicator identifier",
            },
            name: {
              type: "string",
              description: "Display name for the indicator",
            },
            params: {
              type: "object",
              description:
                "Indicator-specific parameters (e.g., period for RSI)",
            },
          },
          required: ["id", "name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "hide_indicator",
        description: "Hide a technical indicator from the chart",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: [
                "volume",
                "rsi",
                "macd",
                "bollinger-bands",
                "moving-averages",
                "atr",
                "stochastic",
              ],
              description:
                "Indicator identifier to hide (must match a currently shown indicator)",
            },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_trend_line",
        description: "Draw a trend line on the chart",
        parameters: {
          type: "object",
          properties: {
            start: {
              type: "object",
              properties: {
                timestamp: {
                  type: "number",
                  description: "Start point timestamp in milliseconds",
                },
                price: { type: "number", description: "Start point price" },
              },
              required: ["timestamp", "price"],
            },
            end: {
              type: "object",
              properties: {
                timestamp: {
                  type: "number",
                  description: "End point timestamp in milliseconds",
                },
                price: { type: "number", description: "End point price" },
              },
              required: ["timestamp", "price"],
            },
            color: {
              type: "string",
              description: "Line color in hex format",
              default: "#2962ff",
            },
            lineWidth: {
              type: "number",
              description: "Line width in pixels",
              default: 2,
            },
            style: {
              type: "string",
              enum: ["solid", "dashed", "dotted"],
              default: "solid",
            },
            extendLeft: {
              type: "boolean",
              description: "Extend line to the left",
              default: false,
            },
            extendRight: {
              type: "boolean",
              description: "Extend line to the right",
              default: false,
            },
            name: {
              type: "string",
              description: "Name/label for the trend line",
            },
            description: {
              type: "string",
              description: "Detailed description of the trend line",
            },
            levelType: {
              type: "string",
              enum: ["spike", "swing", "horizontal"],
              description:
                "Type of support/resistance level (spike = extreme reversal, swing = regular reversal, horizontal = consolidation)",
            },
            opacity: {
              type: "number",
              description: "Opacity value (0.0 to 1.0)",
              minimum: 0,
              maximum: 1,
            },
            markers: {
              type: "object",
              description: "Optional markers along the line",
              properties: {
                enabled: {
                  type: "boolean",
                  description: "Enable markers",
                },
                symbol: {
                  type: "string",
                  enum: ["diamond", "circle", "square", "triangle"],
                  description: "Marker symbol type",
                },
                size: {
                  type: "number",
                  description: "Marker size in pixels",
                },
                spacing: {
                  type: "number",
                  description: "Spacing between markers in pixels",
                },
                color: {
                  type: "string",
                  description: "Marker color (defaults to line color)",
                },
              },
              required: ["enabled", "symbol", "size", "spacing"],
            },
            zIndex: {
              type: "number",
              description: "Z-index for layering (higher = on top)",
            },
            animation: {
              type: "object",
              description:
                "Optional animation configuration (e.g., for spike levels)",
              properties: {
                type: {
                  type: "string",
                  enum: ["pulse"],
                  description:
                    "Animation type (currently only pulse is supported)",
                },
                duration: {
                  type: "number",
                  description:
                    "Duration of one animation cycle in milliseconds",
                  default: 2000,
                },
                intensity: {
                  type: "number",
                  description: "Intensity of the animation (0.0 to 1.0)",
                  default: 0.3,
                  minimum: 0,
                  maximum: 1,
                },
                enabled: {
                  type: "boolean",
                  description: "Whether the animation is enabled",
                  default: true,
                },
              },
            },
            lastTest: {
              type: "number",
              description:
                "Unix timestamp in milliseconds of when this level was last tested (for browser timezone conversion)",
            },
          },
          required: ["start", "end"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "remove_trend_line",
        description: "Remove a trend line from the chart",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Trend line ID to remove",
            },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "clear_trend_lines",
        description: "Remove all trend lines from the chart",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "set_time_range",
        description: "Adjust the visible time range on the chart",
        parameters: {
          type: "object",
          properties: {
            start: {
              type: "number",
              description: "Start timestamp in milliseconds",
            },
            end: {
              type: "number",
              description: "End timestamp in milliseconds",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "set_price_range",
        description: "Adjust the visible price range on the chart",
        parameters: {
          type: "object",
          properties: {
            min: {
              type: "number",
              description: "Minimum price to display",
            },
            max: {
              type: "number",
              description: "Maximum price to display",
            },
          },
          required: ["min", "max"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "enter_fullscreen",
        description: "Enter fullscreen mode",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "exit_fullscreen",
        description: "Exit fullscreen mode",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "activate_trend_line_tool",
        description: "Activate the trend line drawing tool for manual drawing",
        parameters: {
          type: "object",
          properties: {
            color: {
              type: "string",
              description: "Default line color",
              default: "#2962ff",
            },
            lineWidth: {
              type: "number",
              description: "Default line width",
              default: 2,
            },
            style: {
              type: "string",
              enum: ["solid", "dashed", "dotted"],
              default: "solid",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "draw_trend_line_from_analysis",
        description:
          "Analyze price data using AI and automatically draw a trend line based on significant price points",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Trading pair symbol (e.g., BTC-USD, ETH-USD)",
            },
            interval: {
              type: "string",
              description: "Time interval for price data",
            },
            startTime: {
              type: "number",
              description: "Start timestamp in milliseconds",
            },
            endTime: {
              type: "number",
              description: "End timestamp in milliseconds",
            },
            type: {
              type: "string",
              enum: ["resistance", "support"],
              description:
                "Type of trend line (resistance uses highs, support uses lows)",
            },
            count: {
              type: "number",
              description:
                "Number of significant points to analyze (default: 2)",
              default: 2,
            },
            color: {
              type: "string",
              description:
                "Line color in hex format (optional - defaults to red for resistance, green for support)",
            },
            lineWidth: {
              type: "number",
              description: "Line width in pixels",
              default: 2,
            },
            style: {
              type: "string",
              enum: ["solid", "dashed", "dotted"],
              default: "solid",
            },
            extendLeft: {
              type: "boolean",
              description: "Extend line to the left",
              default: false,
            },
            extendRight: {
              type: "boolean",
              description: "Extend line to the right",
              default: false,
            },
          },
          required: ["symbol", "interval", "startTime", "endTime", "type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "fetch_support_resistance_levels",
        description:
          "Fetch and draw support and resistance levels from the market API based on historical price analysis",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Trading pair symbol (e.g., BTC-USD, ETH-USD)",
            },
            granularity: {
              type: "string",
              description: "Time granularity for analysis",
            },
            startTime: {
              type: "number",
              description: "Start timestamp in milliseconds",
            },
            endTime: {
              type: "number",
              description: "End timestamp in milliseconds",
            },
            maxSupports: {
              type: "number",
              description:
                "Maximum number of support levels to draw (default: 3)",
              default: 3,
            },
            maxResistances: {
              type: "number",
              description:
                "Maximum number of resistance levels to draw (default: 3)",
              default: 3,
            },
            supportColor: {
              type: "string",
              description: "Color for support lines (default: green)",
              default: "#4caf50",
            },
            resistanceColor: {
              type: "string",
              description: "Color for resistance lines (default: red)",
              default: "#ff5252",
            },
          },
          required: ["symbol", "granularity", "startTime", "endTime"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "highlight_patterns",
        description: "Highlight detected candlestick patterns on the chart",
        parameters: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              description: "Array of pattern highlights to display",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Unique identifier for the pattern",
                  },
                  type: {
                    type: "string",
                    description: "Pattern marker type",
                    enum: ["pattern"],
                  },
                  patternType: {
                    type: "string",
                    description: "Type of candlestick pattern",
                  },
                  name: {
                    type: "string",
                    description: "Display name for the pattern",
                  },
                  description: {
                    type: "string",
                    description: "Detailed description of the pattern",
                  },
                  candleTimestamps: {
                    type: "array",
                    description:
                      "Array of timestamps for candles in the pattern",
                    items: {
                      type: "number",
                    },
                  },
                  significance: {
                    type: "string",
                    enum: ["low", "medium", "high", "very high", "effect"],
                    description: "Pattern significance level",
                  },
                  color: {
                    type: "string",
                    description:
                      "Highlight color (optional, defaults based on pattern type)",
                  },
                  style: {
                    type: "string",
                    enum: ["outline", "fill", "both"],
                    description: "Highlight style",
                    default: "outline",
                  },
                  nearLevel: {
                    type: "object",
                    description:
                      "Information about nearby support/resistance level",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["support", "resistance"],
                      },
                      price: {
                        type: "number",
                      },
                      distance: {
                        type: "number",
                        description: "Percentage distance from the level",
                      },
                    },
                  },
                },
                required: [
                  "id",
                  "type",
                  "patternType",
                  "name",
                  "description",
                  "candleTimestamps",
                  "significance",
                ],
              },
            },
          },
          required: ["patterns"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "pulse_wave",
        description: "Start an animated pulsating wave effect on the chart",
        parameters: {
          type: "object",
          properties: {
            speed: {
              type: "number",
              description: "Speed of wave movement (1-50, default: 5)",
              minimum: 1,
              maximum: 50,
              default: 5,
            },
            color: {
              type: "string",
              description: "Hex color for the wave",
              default: "#ec4899",
            },
            numCandles: {
              type: "number",
              description: "Number of candles in the wave width",
              minimum: 5,
              default: 20,
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "stop_pulse_wave",
        description: "Stop the currently running pulse wave animation",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "clear_pattern_highlights",
        description: "Remove all pattern highlights from the chart",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "calculate_average_volume",
        description:
          "Calculate average volume and volume statistics from the visible candles on the chart",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
  ] as ToolDefinition[],

  isChartTool(name: string): boolean {
    return this.definitions.some((def) => def.function.name === name);
  },

  getConfirmationMessage(toolName: string, args: any): string {
    switch (toolName) {
      case "set_symbol":
        return `✓ Changed symbol to ${args.symbol}`;
      case "set_granularity":
        return `✓ Set timeframe to ${args.granularity
          .toLowerCase()
          .replace("_", " ")}`;
      case "show_indicator":
        return `✓ Added ${args.name} indicator`;
      case "hide_indicator":
        return `✓ Removed ${args.id.replace(/-/g, " ")} indicator`;
      case "add_trend_line":
        return `✓ Drew trend line`;
      case "draw_trend_line_from_analysis":
        return `✓ Analyzed price data using AI and drew ${args.type} trend line`;
      case "fetch_support_resistance_levels":
        return `✓ Fetched and drew support/resistance levels from market data`;
      case "remove_trend_line":
        return `✓ Removed trend line`;
      case "clear_trend_lines":
        return `✓ Cleared all trend lines`;
      case "set_time_range":
        return `✓ Adjusted time range`;
      case "set_price_range":
        return `✓ Adjusted price range`;
      case "enter_fullscreen":
        return `✓ Entered fullscreen mode`;
      case "exit_fullscreen":
        return `✓ Exited fullscreen mode`;
      case "get_chart_state":
        return `✓ Retrieved chart state`;
      case "activate_trend_line_tool":
        return `✓ Trend line tool activated`;
      case "get_candles":
        return `✓ Fetched candle data`;
      case "highlight_patterns":
        const count = args.patterns?.length || 0;
        return `✓ Highlighted ${count} pattern${
          count !== 1 ? "s" : ""
        } on the chart`;
      case "pulse_wave":
        return `✓ Started pattern scanning animation`;
      case "stop_pulse_wave":
        return `✓ Stopped scanning animation`;
      case "clear_pattern_highlights":
        return `✓ Cleared pattern highlights`;
      case "calculate_average_volume":
        return `✓ Calculated volume statistics`;
      default:
        return `✓ Executed ${toolName}`;
    }
  },
};
