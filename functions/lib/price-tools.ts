// Firestore data access tools
import { Firestore } from "firebase-admin/firestore";
import { marketAPI, PriceCandle } from "./market-api.js";

interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

interface PriceDataArgs {
  symbol: string;
  interval: string;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

interface LatestPriceArgs {
  symbol: string;
}

interface AnalyzePricePointsArgs {
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  type?: "highs" | "lows" | "both";
  count?: number;
}

interface SupportResistanceLevelsArgs {
  symbol?: string;
  granularity?: string;
  startTime?: number;
  endTime?: number;
  maxSupports?: number;
  maxResistances?: number;
}

interface Candle {
  timestamp?: number;
  time?: number;
  t?: number;
  open?: number;
  o?: number;
  high?: number;
  h?: number;
  low?: number;
  l?: number;
  close?: number;
  c?: number;
  volume?: number;
  v?: number;
}

interface NormalizedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const priceTools = {
  definitions: [
    {
      type: "function",
      function: {
        name: "get_price_data",
        description: "Fetch historical price data for analysis",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Trading pair symbol (e.g., BTC-USD, ETH-USD)",
            },
            interval: {
              type: "string",
              enum: [
                "ONE_MINUTE",
                "FIVE_MINUTES",
                "FIFTEEN_MINUTES",
                "THIRTY_MINUTES",
                "ONE_HOUR",
                "TWO_HOURS",
                "SIX_HOURS",
                "ONE_DAY",
              ],
              description: "Time interval for price data",
            },
            limit: {
              type: "number",
              description:
                "Number of candles to fetch (default: 100, max: 500)",
              default: 100,
            },
            startTime: {
              type: "number",
              description: "Optional start timestamp in milliseconds",
            },
            endTime: {
              type: "number",
              description: "Optional end timestamp in milliseconds",
            },
          },
          required: ["symbol", "interval"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_latest_price",
        description: "Get the most recent price for a trading pair",
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
        name: "get_available_symbols",
        description: "Get a list of available trading pairs",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "analyze_price_points",
        description:
          "Analyze price data to find high and low points for trend lines, support and resistance levels",
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
              enum: ["highs", "lows", "both"],
              description:
                "Type of points to find (highs for resistance, lows for support)",
              default: "both",
            },
            count: {
              type: "number",
              description:
                "Number of significant points to return (default: 3)",
              default: 3,
            },
          },
          required: ["symbol", "interval", "startTime", "endTime"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_support_resistance_levels",
        description:
          "Fetch automatically detected support and resistance levels from the market API using historical price data analysis",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Trading pair symbol (default: BTC-USD)",
              default: "BTC-USD",
            },
            granularity: {
              type: "string",
              description: "Time granularity for analysis (default: ONE_HOUR)",
              default: "ONE_HOUR",
            },
            startTime: {
              type: "number",
              description: "Start timestamp in milliseconds (default: 30 days ago)",
            },
            endTime: {
              type: "number",
              description: "End timestamp in milliseconds (default: now)",
            },
            maxSupports: {
              type: "number",
              description: "Maximum number of support levels to return (default: 5)",
              default: 5,
            },
            maxResistances: {
              type: "number",
              description: "Maximum number of resistance levels to return (default: 5)",
              default: 5,
            },
          },
        },
      },
    },
  ] as ToolDefinition[],

  isPriceTool(name: string): boolean {
    return this.definitions.some((def) => def.function.name === name);
  },

  async execute(toolName: string, args: any, db: Firestore): Promise<any> {
    switch (toolName) {
      case "get_price_data":
        return await this.getPriceData(args as PriceDataArgs);
      case "get_latest_price":
        return await this.getLatestPrice(args as LatestPriceArgs);
      case "get_available_symbols":
        return await this.getAvailableSymbols(db);
      case "analyze_price_points":
        return await this.analyzePricePoints(args as AnalyzePricePointsArgs);
      case "get_support_resistance_levels":
        return await this.getSupportResistanceLevels(args as SupportResistanceLevelsArgs);
      default:
        throw new Error(`Unknown Firestore tool: ${toolName}`);
    }
  },

  async getPriceData({
    symbol,
    interval,
    limit = 100,
    startTime,
    endTime,
  }: PriceDataArgs): Promise<any> {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";

      // If no time range provided, calculate a reasonable default
      if (!startTime || !endTime) {
        const now = Date.now();
        endTime = endTime || now;
        // Default to last 7 days worth of data
        startTime = startTime || endTime - 7 * 24 * 60 * 60 * 1000;
      }

      // Build query parameters
      // Ensure timestamps are integers (no decimals)
      const params = new URLSearchParams({
        symbol,
        granularity: interval || "ONE_HOUR",
        start_time: Math.floor(startTime).toString(),
        end_time: Math.floor(endTime).toString(),
        exchange: "coinbase",
      });

      console.log(
        `Fetching price data from API: ${API_BASE_URL}/history?${params}`
      );

      // Fetch from the API
      const response = await fetch(`${API_BASE_URL}/history?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: any = await response.json();

      // The API returns data in a different format, so we need to transform it
      // Assuming the API returns an array of candles
      const candles: Candle[] = data.candles || data || [];

      if (candles.length === 0) {
        return {
          symbol,
          interval,
          candles: [],
          message: "No data available for the specified parameters",
        };
      }

      // Apply limit if specified
      const limitedCandles = candles.slice(0, limit);

      // Calculate some basic statistics
      const high = Math.max(...limitedCandles.map((c) => c.high || c.h || 0));
      const low = Math.min(
        ...limitedCandles.map((c) => c.low || c.l || Number.MAX_VALUE)
      );
      const lastCandle = limitedCandles[limitedCandles.length - 1];
      const firstCandle = limitedCandles[0];
      const lastClose = lastCandle?.close || lastCandle?.c || 0;
      const firstClose = firstCandle?.close || firstCandle?.c || 1;
      const change =
        limitedCandles.length > 1
          ? ((lastClose - firstClose) / firstClose) * 100
          : 0;

      return {
        symbol,
        interval,
        count: limitedCandles.length,
        candles: limitedCandles,
        statistics: {
          high,
          low,
          change: change.toFixed(2) + "%",
          latestPrice: lastClose,
          oldestPrice: firstClose,
        },
      };
    } catch (error: any) {
      console.error("Error fetching price data from API:", error);
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }
  },

  async getLatestPrice({ symbol }: LatestPriceArgs): Promise<any> {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";

      // Get the last hour of data to find the latest price
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Ensure timestamps are integers (no decimals)
      const params = new URLSearchParams({
        symbol,
        granularity: "ONE_MINUTE",
        start_time: Math.floor(oneHourAgo).toString(),
        end_time: Math.floor(now).toString(),
        exchange: "coinbase",
      });

      console.log(
        `Fetching latest price from API: ${API_BASE_URL}/history?${params}`
      );

      const response = await fetch(`${API_BASE_URL}/history?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: any = await response.json();
      const candles: Candle[] = data.candles || data || [];

      if (candles.length === 0) {
        return {
          symbol,
          price: null,
          message: "No price data available for this symbol",
        };
      }

      // Get the most recent candle
      const latestCandle = candles[candles.length - 1];

      return {
        symbol,
        price: latestCandle.close || latestCandle.c,
        timestamp:
          latestCandle.timestamp || latestCandle.time || latestCandle.t,
        open: latestCandle.open || latestCandle.o,
        high: latestCandle.high || latestCandle.h,
        low: latestCandle.low || latestCandle.l,
        close: latestCandle.close || latestCandle.c,
        volume: latestCandle.volume || latestCandle.v,
      };
    } catch (error: any) {
      console.error("Error fetching latest price from API:", error);
      throw new Error(`Failed to fetch latest price: ${error.message}`);
    }
  },

  async getAvailableSymbols(db: Firestore): Promise<any> {
    try {
      const snapshot = await db
        .collection("/exchanges/coinbase/products")
        .listDocuments();

      const symbols = snapshot.map((doc) => doc.id);

      return {
        symbols,
        count: symbols.length,
        exchange: "coinbase",
      };
    } catch (error: any) {
      console.error("Error fetching available symbols:", error);
      throw new Error(`Failed to fetch available symbols: ${error.message}`);
    }
  },

  async analyzePricePoints({
    symbol,
    interval,
    startTime,
    endTime,
    type = "both",
    count = 3,
  }: AnalyzePricePointsArgs): Promise<any> {
    try {
      // Log the query parameters for debugging
      console.log("Analyzing price points:", {
        symbol,
        interval,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        type,
        count,
      });

      // Validate and potentially reduce time range
      const intervalMs = this.getIntervalMilliseconds(interval || "ONE_HOUR");
      const requestedCandles = Math.floor((endTime - startTime) / intervalMs);
      const maxCandles = 200; // Conservative limit to avoid API errors

      let adjustedStartTime = startTime;
      let adjustedEndTime = endTime;

      if (requestedCandles > maxCandles) {
        console.log(
          `Requested ${requestedCandles} candles, but max is ${maxCandles}. Adjusting time range.`
        );
        // Keep the end time, reduce the start time
        adjustedStartTime = endTime - maxCandles * intervalMs;
        console.log(
          `Adjusted time range: ${new Date(
            adjustedStartTime
          ).toISOString()} to ${new Date(adjustedEndTime).toISOString()}`
        );
      }

      // Use MarketAPI which handles batching automatically
      const candles: PriceCandle[] = await marketAPI.fetchPriceData(
        symbol,
        interval || "ONE_HOUR",
        Math.floor(adjustedStartTime),
        Math.floor(adjustedEndTime),
        (message) => console.log(`MarketAPI: ${message}`)
      );

      console.log(`MarketAPI returned ${candles.length} candles`);

      if (candles.length === 0) {
        return {
          symbol,
          interval,
          message: "No data available for the specified time range",
          highs: [],
          lows: [],
        };
      }

      // MarketAPI returns PriceCandle objects, so we can use them directly
      const normalizedCandles: NormalizedCandle[] = candles.map((c) => ({
        timestamp: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
      }));

      // Find local maxima (highs) and minima (lows)
      const highs: Array<{
        timestamp: number;
        price: number;
        candle: NormalizedCandle;
      }> = [];
      const lows: Array<{
        timestamp: number;
        price: number;
        candle: NormalizedCandle;
      }> = [];

      for (let i = 1; i < normalizedCandles.length - 1; i++) {
        const prev = normalizedCandles[i - 1];
        const curr = normalizedCandles[i];
        const next = normalizedCandles[i + 1];

        // Check for local maximum (resistance point)
        if (type === "highs" || type === "both") {
          if (curr.high > prev.high && curr.high >= next.high) {
            highs.push({
              timestamp: curr.timestamp,
              price: curr.high,
              candle: curr,
            });
          }
        }

        // Check for local minimum (support point)
        if (type === "lows" || type === "both") {
          if (curr.low < prev.low && curr.low <= next.low) {
            lows.push({
              timestamp: curr.timestamp,
              price: curr.low,
              candle: curr,
            });
          }
        }
      }

      // Sort and get the most significant points
      const significantHighs = highs
        .sort((a, b) => b.price - a.price)
        .slice(0, count)
        .map((h) => ({
          timestamp: h.timestamp,
          price: h.price,
        }));

      const significantLows = lows
        .sort((a, b) => a.price - b.price)
        .slice(0, count)
        .map((l) => ({
          timestamp: l.timestamp,
          price: l.price,
        }));

      return {
        symbol,
        interval,
        timeRange: {
          start: adjustedStartTime,
          end: adjustedEndTime,
        },
        originalTimeRange: {
          start: startTime,
          end: endTime,
        },
        highs: significantHighs,
        lows: significantLows,
        totalCandles: normalizedCandles.length,
        priceRange: {
          highest: Math.max(...normalizedCandles.map((c) => c.high)),
          lowest: Math.min(...normalizedCandles.map((c) => c.low)),
        },
      };
    } catch (error: any) {
      console.error("Error analyzing price points:", error);
      throw new Error(`Failed to analyze price points: ${error.message}`);
    }
  },

  async getSupportResistanceLevels({
    symbol = "BTC-USD",
    granularity = "ONE_HOUR",
    startTime,
    endTime,
    maxSupports = 5,
    maxResistances = 5,
  }: SupportResistanceLevelsArgs): Promise<any> {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append("symbol", symbol);
      params.append("granularity", granularity);
      
      // Add optional parameters if provided
      if (startTime) {
        params.append("start_time", Math.floor(startTime).toString());
      }
      if (endTime) {
        params.append("end_time", Math.floor(endTime).toString());
      }
      params.append("max_supports", maxSupports.toString());
      params.append("max_resistances", maxResistances.toString());
      
      console.log(
        `Fetching support/resistance levels from API: ${API_BASE_URL}/levels?${params}`
      );
      
      const response = await fetch(`${API_BASE_URL}/levels?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
      
      const data: any = await response.json();
      
      // The API returns data in the format:
      // {
      //   "supports": [...],
      //   "resistances": [...]
      // }
      
      return {
        symbol,
        granularity,
        supports: data.supports || [],
        resistances: data.resistances || [],
        timeRange: {
          start: startTime,
          end: endTime,
        },
      };
    } catch (error: any) {
      console.error("Error fetching support/resistance levels from API:", error);
      throw new Error(`Failed to fetch support/resistance levels: ${error.message}`);
    }
  },

  getIntervalMilliseconds(interval: string): number {
    const intervals: Record<string, number> = {
      ONE_MINUTE: 60 * 1000,
      FIVE_MINUTE: 5 * 60 * 1000,
      FIVE_MINUTES: 5 * 60 * 1000,
      FIFTEEN_MINUTE: 15 * 60 * 1000,
      FIFTEEN_MINUTES: 15 * 60 * 1000,
      THIRTY_MINUTE: 30 * 60 * 1000,
      THIRTY_MINUTES: 30 * 60 * 1000,
      ONE_HOUR: 60 * 60 * 1000,
      TWO_HOUR: 2 * 60 * 60 * 1000,
      TWO_HOURS: 2 * 60 * 60 * 1000,
      FOUR_HOUR: 4 * 60 * 60 * 1000,
      FOUR_HOURS: 4 * 60 * 60 * 1000,
      SIX_HOUR: 6 * 60 * 60 * 1000,
      SIX_HOURS: 6 * 60 * 60 * 1000,
      ONE_DAY: 24 * 60 * 60 * 1000,
    };

    return intervals[interval] || 60 * 60 * 1000; // Default to 1 hour
  },

  formatResult(toolName: string, result: any): string {
    switch (toolName) {
      case "get_price_data":
        if (result.candles.length === 0) {
          return result.message;
        }
        return (
          `Fetched ${result.count} candles for ${result.symbol} (${result.interval}). ` +
          `Price range: $${result.statistics.low.toFixed(
            2
          )} - $${result.statistics.high.toFixed(2)}. ` +
          `Change: ${result.statistics.change}`
        );

      case "get_latest_price":
        if (!result.price) {
          return result.message;
        }
        return `Latest price for ${result.symbol}: $${result.price.toFixed(2)}`;

      case "get_available_symbols":
        return `Found ${result.count} available trading pairs on ${result.exchange}`;

      case "analyze_price_points":
        if (result.message) {
          return result.message;
        }
        let summary = `Analyzed ${result.totalCandles} candles for ${result.symbol}. `;

        // Check if time range was adjusted
        if (
          result.originalTimeRange &&
          (result.timeRange.start !== result.originalTimeRange.start ||
            result.timeRange.end !== result.originalTimeRange.end)
        ) {
          summary += `⚠️ Time range was adjusted to fit API limits. `;
        }

        if (result.highs.length > 0) {
          summary += `Found ${result.highs.length} resistance points. `;
        }
        if (result.lows.length > 0) {
          summary += `Found ${result.lows.length} support points. `;
        }
        summary += `Price range: $${result.priceRange.lowest.toFixed(
          2
        )} - $${result.priceRange.highest.toFixed(2)}`;
        return summary;

      case "get_support_resistance_levels":
        let levelsSummary = `Fetched support and resistance levels for ${result.symbol}. `;
        if (result.supports.length > 0) {
          levelsSummary += `Found ${result.supports.length} support levels. `;
        }
        if (result.resistances.length > 0) {
          levelsSummary += `Found ${result.resistances.length} resistance levels. `;
        }
        if (result.supports.length === 0 && result.resistances.length === 0) {
          levelsSummary = `No support or resistance levels found for ${result.symbol}.`;
        }
        return levelsSummary;

      default:
        return `Completed ${toolName}`;
    }
  },
};
