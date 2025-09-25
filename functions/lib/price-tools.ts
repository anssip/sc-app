// Firestore data access tools
import { Firestore } from "firebase-admin/firestore";
import { marketAPI, PriceCandle } from "./market-api.js";
import {
  PatternDetector,
  Candle as PatternCandle,
} from "./pattern-detection.js";

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

interface AnalyzeCandlestickPatternsArgs {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  patterns?: string[]; // specific patterns to detect or ["all"]
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
              description:
                "Start timestamp in milliseconds (default: 30 days ago)",
            },
            endTime: {
              type: "number",
              description: "End timestamp in milliseconds (default: now)",
            },
            maxSupports: {
              type: "number",
              description:
                "Maximum number of support levels to return (default: 5)",
              default: 5,
            },
            maxResistances: {
              type: "number",
              description:
                "Maximum number of resistance levels to return (default: 5)",
              default: 5,
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "analyze_candlestick_patterns",
        description:
          "Analyze candlestick data to identify patterns like doji, hammer, shooting star, engulfing patterns, etc. Returns detailed pattern analysis with timestamps and significance.",
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
              description: "Time interval for candle data",
            },
            startTime: {
              type: "number",
              description: "Start timestamp in milliseconds",
            },
            endTime: {
              type: "number",
              description: "End timestamp in milliseconds",
            },
            patterns: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "doji",
                  "hammer",
                  "shooting_star",
                  "engulfing",
                  "morning_star",
                  "evening_star",
                  "all",
                ],
              },
              description:
                "Specific patterns to detect. Use ['all'] to detect all patterns",
              default: ["all"],
            },
          },
          required: ["symbol", "interval"],
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
        return await this.getSupportResistanceLevels(
          args as SupportResistanceLevelsArgs
        );
      case "analyze_candlestick_patterns":
        return await this.analyzeCandlestickPatterns(
          args as AnalyzeCandlestickPatternsArgs,
          db
        );
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

      // Add optional parameters if provided - timestamps are already in UTC milliseconds
      if (startTime) {
        const startTimeInt = Math.floor(startTime);
        params.append("start_time", startTimeInt.toString());
        console.log(
          `Start time: ${startTimeInt} (${new Date(
            startTimeInt
          ).toISOString()})`
        );
      }
      if (endTime) {
        const endTimeInt = Math.floor(endTime);
        params.append("end_time", endTimeInt.toString());
        console.log(
          `End time: ${endTimeInt} (${new Date(endTimeInt).toISOString()})`
        );
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
      console.error(
        "Error fetching support/resistance levels from API:",
        error
      );
      throw new Error(
        `Failed to fetch support/resistance levels: ${error.message}`
      );
    }
  },

  async analyzeCandlestickPatterns(
    {
      symbol,
      interval,
      startTime,
      endTime,
      patterns: _patterns = ["all"],
    }: AnalyzeCandlestickPatternsArgs,
    _db: Firestore
  ): Promise<any> {
    try {
      // Calculate time range if not provided
      if (!startTime || !endTime) {
        endTime = endTime || Date.now();
        const intervalMs = this.getIntervalMilliseconds(interval);
        // Default to 100 candles worth of time
        startTime = startTime || endTime - intervalMs * 100;
      }

      // Fetch candle data
      const candleData = await this.getPriceData({
        symbol,
        interval,
        startTime,
        endTime,
      });

      if (!candleData.candles || candleData.candles.length === 0) {
        return {
          symbol,
          interval,
          patterns: [],
          summary: "No candle data available for pattern analysis",
          totalCandles: 0,
        };
      }

      // Convert candles to PatternCandle format
      const patternCandles: PatternCandle[] = candleData.candles.map(
        (c: any) => {
          const normalized = this.normalizeCandle(c);
          return {
            timestamp: normalized.timestamp,
            open: normalized.open,
            high: normalized.high,
            low: normalized.low,
            close: normalized.close,
            volume: normalized.volume,
          };
        }
      );

      // Fetch support/resistance levels to enhance pattern detection
      let supports: number[] = [];
      let resistances: number[] = [];

      try {
        console.log(`Fetching support/resistance levels for ${symbol}...`);
        const levelsData = await this.getSupportResistanceLevels({
          symbol,
          granularity: interval,
          startTime,
          endTime,
        });

        // Extract price values from support/resistance objects
        supports = (levelsData.supports || [])
          .map((s: any) => (typeof s === "number" ? s : s.price))
          .filter((p: number) => p > 0);
        resistances = (levelsData.resistances || [])
          .map((r: any) => (typeof r === "number" ? r : r.price))
          .filter((p: number) => p > 0);
        console.log(
          `Found ${supports.length} support and ${resistances.length} resistance levels`
        );
      } catch (levelError) {
        console.log(
          "Could not fetch support/resistance levels, continuing without them:",
          levelError
        );
      }

      // Use PatternDetector with stricter configuration
      const detector = new PatternDetector({
        minVolumeRatio: 1.5, // Require 50% above average volume (up from 20%)
        minSignificance: 0.8, // Filter out low significance patterns (up from 0.5)
        levelProximityThreshold: 0.005, // Within 0.5% of support/resistance (down from 1%)
        supportBoost: 1.5, // 50% boost at support levels (down from 100%)
        resistanceBoost: 1.5, // 50% boost at resistance levels (down from 100%)
      });

      const detectedPatterns = await detector.detectPatterns(
        patternCandles,
        supports,
        resistances
      );

      // Calculate average volume for reference
      const avgVolume =
        patternCandles.reduce((sum, c) => sum + (c.volume || 0), 0) /
        patternCandles.length;

      // Convert patterns to the expected format with additional metadata
      const formattedPatterns = detectedPatterns.map((pattern) => {
        // Convert camelCase to snake_case properly
        const snakeType = pattern.type.replace(
          /([A-Z])/g,
          (_match, p1, offset) => {
            // Don't add underscore at the beginning
            return offset > 0 ? `_${p1.toLowerCase()}` : p1.toLowerCase();
          }
        );

        // Create a proper display name
        const displayName = pattern.type
          .replace(/([A-Z])/g, " $1")
          .trim()
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

        return {
          type: snakeType,
          name: displayName,
          timestamp: pattern.candleTimestamps[0],
          candleTimestamps: pattern.candleTimestamps,
          price:
            patternCandles.find(
              (c) => c.timestamp === pattern.candleTimestamps[0]
            )?.close || 0,
          volume: pattern.volume,
          significance:
            pattern.significance >= 1.5
              ? "very high"
              : pattern.significance >= 1.0
              ? "high"
              : pattern.significance >= 0.7
              ? "medium"
              : "low",
          description: pattern.description,
          nearLevel: pattern.nearLevel,
        };
      });

      // Generate pattern counts
      const patternCounts: Record<string, number> = {};
      formattedPatterns.forEach((p) => {
        patternCounts[p.type] = (patternCounts[p.type] || 0) + 1;
      });

      // Generate summary
      let summary = `Analyzed ${patternCandles.length} candles for ${symbol} (${interval}). `;
      if (formattedPatterns.length > 0) {
        summary += `Found ${formattedPatterns.length} high-quality patterns`;

        // Add support/resistance context
        if (supports.length > 0 || resistances.length > 0) {
          const patternsAtLevels = formattedPatterns.filter(
            (p) => p.nearLevel
          ).length;
          if (patternsAtLevels > 0) {
            summary += ` (${patternsAtLevels} at key support/resistance levels)`;
          }
        }

        summary += `: `;
        summary += Object.entries(patternCounts)
          .map(([pattern, count]) => `${count} ${pattern.replace(/_/g, " ")}`)
          .join(", ");

        // Highlight very high significance patterns
        const veryHighSigPatterns = formattedPatterns.filter(
          (p) => p.significance === "very high"
        );
        if (veryHighSigPatterns.length > 0) {
          summary += `. ${veryHighSigPatterns.length} very high-significance pattern(s) at key levels.`;
        }
      } else {
        summary += "No significant patterns detected in the specified range.";
      }

      return {
        symbol,
        interval,
        timeRange: {
          start: startTime,
          end: endTime,
        },
        totalCandles: patternCandles.length,
        patterns: formattedPatterns,
        patternCounts,
        avgVolume,
        supports: supports.slice(0, 5), // Include top 5 support levels
        resistances: resistances.slice(0, 5), // Include top 5 resistance levels
        summary,
      };
    } catch (error: any) {
      console.error("Error analyzing candlestick patterns:", error);
      return {
        symbol,
        interval,
        patterns: [],
        summary: `Failed to analyze patterns: ${error.message}`,
        error: error.message,
      };
    }
  },

  normalizeCandle(candle: Candle): NormalizedCandle {
    return {
      timestamp: candle.timestamp || candle.time || candle.t || 0,
      open: candle.open || candle.o || 0,
      high: candle.high || candle.h || 0,
      low: candle.low || candle.l || 0,
      close: candle.close || candle.c || 0,
      volume: candle.volume || candle.v || 0,
    };
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

      case "analyze_candlestick_patterns":
        if (result.error) {
          return result.summary;
        }

        let formattedResult = result.summary + "\n\n";

        if (result.patterns && result.patterns.length > 0) {
          formattedResult += "**Detected Patterns:**\n";

          result.patterns.forEach((pattern: any) => {
            formattedResult += `\n• **${pattern.description}**\n`;

            // Format timestamps with timezone conversion placeholders
            if (
              pattern.candleTimestamps &&
              pattern.candleTimestamps.length > 1
            ) {
              formattedResult += `  - Pattern formed by ${pattern.candleTimestamps.length} candles:\n`;
              pattern.candleTimestamps.forEach((ts: number, index: number) => {
                const label =
                  pattern.candleTimestamps.length === 2
                    ? index === 0
                      ? "Previous"
                      : "Current"
                    : `Candle ${index + 1}`;
                formattedResult += `    - ${label}: <span class="timestamp-utc" data-timestamp="${ts}">(loading time...)</span>\n`;
              });
            } else {
              formattedResult += `  - Time: <span class="timestamp-utc" data-timestamp="${pattern.timestamp}">(loading time...)</span>\n`;
            }

            formattedResult += `  - Price: $${pattern.price.toFixed(2)}\n`;
            formattedResult += `  - Volume: ${pattern.volume.toLocaleString()}`;

            // Add volume comparison if we have average
            if (result.avgVolume) {
              const volRatio = (pattern.volume / result.avgVolume - 1) * 100;
              const volRatioStr = volRatio.toFixed(0);
              formattedResult += ` (${
                volRatio > 0 ? "+" : ""
              }${volRatioStr}% vs avg)`;
            }

            formattedResult += `\n  - Significance: ${pattern.significance.toUpperCase()}\n`;

            // Add near level information
            if (pattern.nearLevel) {
              const percentDistance = (
                pattern.nearLevel.distance * 100
              ).toFixed(2);
              formattedResult += `  - **Key Level:** ${
                pattern.nearLevel.type === "support"
                  ? "🟢 Support"
                  : "🔴 Resistance"
              } at $${pattern.nearLevel.price.toFixed(
                2
              )} (${percentDistance}% away)\n`;
            }

            // Add body ratio for doji patterns
            if (pattern.type === "doji" && pattern.bodyRatio) {
              formattedResult += `  - Body Ratio: ${pattern.bodyRatio}%\n`;
            }
          });
        }

        // Add support/resistance levels summary if available
        if (
          (result.supports && result.supports.length > 0) ||
          (result.resistances && result.resistances.length > 0)
        ) {
          formattedResult += "\n**Key Price Levels:**\n";

          if (result.supports && result.supports.length > 0) {
            formattedResult += "\n🟢 **Support Levels:**\n";
            result.supports.slice(0, 3).forEach((level: any) => {
              const price = typeof level === "number" ? level : level.price;
              const confidence = level.confidence
                ? ` (${level.confidence.toFixed(0)}% confidence)`
                : "";
              formattedResult += `  - $${price.toFixed(2)}${confidence}\n`;
            });
          }

          if (result.resistances && result.resistances.length > 0) {
            formattedResult += "\n🔴 **Resistance Levels:**\n";
            result.resistances.slice(0, 3).forEach((level: any) => {
              const price = typeof level === "number" ? level : level.price;
              const confidence = level.confidence
                ? ` (${level.confidence.toFixed(0)}% confidence)`
                : "";
              formattedResult += `  - $${price.toFixed(2)}${confidence}\n`;
            });
          }
        }

        return formattedResult;

      default:
        return `Completed ${toolName}`;
    }
  },
};
