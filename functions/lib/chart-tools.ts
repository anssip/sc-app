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
        name: "add_price_line",
        description:
          "Add a horizontal price line to the chart (ideal for support/resistance levels, price alerts, stop losses, take profits)",
        parameters: {
          type: "object",
          properties: {
            price: {
              type: "number",
              description: "Price level for the horizontal line",
            },
            color: {
              type: "string",
              description: "Line color in hex format",
              default: "#6b7280",
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
            label: {
              type: "object",
              description: "Optional label configuration",
              properties: {
                text: {
                  type: "string",
                  description: "Label text (e.g., 'Support @ $45,000')",
                },
                position: {
                  type: "string",
                  enum: ["left", "right"],
                  description: "Label position",
                  default: "left",
                },
                backgroundColor: {
                  type: "string",
                  description: "Label background color",
                },
                textColor: {
                  type: "string",
                  description: "Label text color",
                  default: "#ffffff",
                },
                fontSize: {
                  type: "number",
                  description: "Label font size in pixels",
                  default: 11,
                },
              },
              required: ["text"],
            },
            draggable: {
              type: "boolean",
              description: "Allow user to drag the line up/down",
              default: false,
            },
            extendLeft: {
              type: "boolean",
              description: "Extend line to the left edge",
              default: true,
            },
            extendRight: {
              type: "boolean",
              description: "Extend line to the right edge",
              default: true,
            },
            showPriceLabel: {
              type: "boolean",
              description: "Show price on Y-axis",
              default: true,
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
            metadata: {
              type: "object",
              description: "Store custom data (e.g., order ID, level info)",
            },
            lastTest: {
              type: "number",
              description:
                "Unix timestamp in milliseconds of when this level was last tested (for browser timezone conversion)",
            },
          },
          required: ["price"],
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
        name: "draw_horizontal_line_at_price",
        description:
          "Draw a horizontal trend line at a specific price level (current price, recent high/low, or custom price)",
        parameters: {
          type: "object",
          properties: {
            priceType: {
              type: "string",
              enum: ["current", "high", "low", "specific"],
              description:
                "Type of price to use: 'current' for latest price, 'high' for recent high, 'low' for recent low, 'specific' for custom price",
            },
            price: {
              type: "number",
              description:
                "Specific price value (required only when priceType is 'specific')",
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
              default: true,
            },
            extendRight: {
              type: "boolean",
              description: "Extend line to the right",
              default: true,
            },
            name: {
              type: "string",
              description: "Name/label for the trend line",
            },
            opacity: {
              type: "number",
              description: "Line opacity (0.0 to 1.0)",
              default: 0.8,
            },
          },
          required: ["priceType"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "visualize_divergences",
        description:
          "Visualize detected divergences by drawing trend lines on both the price chart and indicator panels. This tool should be called immediately after detecting divergences to make them visually clear on the chart.",
        parameters: {
          type: "object",
          properties: {
            divergences: {
              type: "array",
              description: "Array of divergence objects to visualize",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "bullish",
                      "bearish",
                      "hidden_bullish",
                      "hidden_bearish",
                    ],
                    description: "Type of divergence",
                  },
                  indicator: {
                    type: "string",
                    description: "Indicator name (e.g., RSI, MACD, volume)",
                  },
                  startPoint: {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "number",
                        description: "Start timestamp in milliseconds",
                      },
                      price: {
                        type: "number",
                        description: "Price at start point",
                      },
                      indicatorValue: {
                        type: "number",
                        description: "Indicator value at start point",
                      },
                    },
                    required: ["timestamp", "price", "indicatorValue"],
                  },
                  endPoint: {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "number",
                        description: "End timestamp in milliseconds",
                      },
                      price: {
                        type: "number",
                        description: "Price at end point",
                      },
                      indicatorValue: {
                        type: "number",
                        description: "Indicator value at end point",
                      },
                    },
                    required: ["timestamp", "price", "indicatorValue"],
                  },
                  strength: {
                    type: "number",
                    description: "Divergence strength (0-100)",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level (0-100)",
                  },
                  description: {
                    type: "string",
                    description: "Text description of the divergence",
                  },
                },
                required: ["type", "indicator", "startPoint", "endPoint"],
              },
            },
            drawOnPrice: {
              type: "boolean",
              description:
                "Whether to draw trend lines on the price chart (default: true)",
              default: true,
            },
            drawOnIndicator: {
              type: "boolean",
              description:
                "Whether to draw trend lines on indicator panels (default: true)",
              default: true,
            },
            bullishColor: {
              type: "string",
              description:
                "Color for bullish divergence lines (default: #10b981)",
              default: "#10b981",
            },
            bearishColor: {
              type: "string",
              description:
                "Color for bearish divergence lines (default: #ef4444)",
              default: "#ef4444",
            },
            showLabels: {
              type: "boolean",
              description:
                "Whether to add labels to the trend lines (default: true)",
              default: true,
            },
          },
          required: ["divergences"],
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
      case "add_price_line":
        return `✓ Drew price line at $${args.price}`;
      case "draw_horizontal_line_at_price":
        const priceTypeLabel =
          args.priceType === "current"
            ? "current price"
            : args.priceType === "high"
            ? "recent high"
            : args.priceType === "low"
            ? "recent low"
            : `$${args.price}`;
        return `✓ Drew horizontal line at ${priceTypeLabel}`;
      case "draw_trend_line_from_analysis":
        return `✓ Analyzed price data using AI and drew ${args.type} trend line`;
      case "visualize_divergences":
        const divCount = args.divergences?.length || 0;
        return `✓ Visualized ${divCount} divergence${
          divCount !== 1 ? "s" : ""
        } with trend lines`;
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
