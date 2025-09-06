// Firestore data access tools
export const firestoreTools = {
  definitions: [
    {
      type: "function",
      function: {
        name: "get_price_data",
        description: "Fetch historical price data from Firestore for analysis",
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
  ],

  isFirestoreTool(name) {
    return this.definitions.some((def) => def.function.name === name);
  },

  async execute(toolName, args, db) {
    switch (toolName) {
      case "get_price_data":
        return await this.getPriceData(args);
      case "get_latest_price":
        return await this.getLatestPrice(args);
      case "get_available_symbols":
        return await this.getAvailableSymbols(db);
      case "analyze_price_points":
        return await this.analyzePricePoints(args);
      default:
        throw new Error(`Unknown Firestore tool: ${toolName}`);
    }
  },

  async getPriceData(
    { symbol, interval, limit = 100, startTime, endTime }
  ) {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";
      
      // If no time range provided, calculate a reasonable default
      if (!startTime || !endTime) {
        const now = Date.now();
        endTime = endTime || now;
        // Default to last 7 days worth of data
        startTime = startTime || (endTime - 7 * 24 * 60 * 60 * 1000);
      }

      // Build query parameters
      const params = new URLSearchParams({
        symbol,
        granularity: interval || "ONE_HOUR",
        start_time: startTime.toString(),
        end_time: endTime.toString(),
        exchange: "coinbase",
      });

      console.log(`Fetching price data from API: ${API_BASE_URL}/history?${params}`);

      // Fetch from the API
      const response = await fetch(`${API_BASE_URL}/history?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // The API returns data in a different format, so we need to transform it
      // Assuming the API returns an array of candles
      const candles = data.candles || data || [];
      
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
      const low = Math.min(...limitedCandles.map((c) => c.low || c.l || Number.MAX_VALUE));
      const change =
        limitedCandles.length > 1
          ? ((limitedCandles[limitedCandles.length - 1].close - limitedCandles[0].close) /
              limitedCandles[0].close) *
            100
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
          latestPrice: limitedCandles[limitedCandles.length - 1]?.close,
          oldestPrice: limitedCandles[0]?.close,
        },
      };
    } catch (error) {
      console.error("Error fetching price data from API:", error);
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }
  },

  async getLatestPrice({ symbol }) {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";
      
      // Get the last hour of data to find the latest price
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const params = new URLSearchParams({
        symbol,
        granularity: "ONE_MINUTE",
        start_time: oneHourAgo.toString(),
        end_time: now.toString(),
        exchange: "coinbase",
      });

      console.log(`Fetching latest price from API: ${API_BASE_URL}/history?${params}`);

      const response = await fetch(`${API_BASE_URL}/history?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const candles = data.candles || data || [];

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
        timestamp: latestCandle.timestamp || latestCandle.time || latestCandle.t,
        open: latestCandle.open || latestCandle.o,
        high: latestCandle.high || latestCandle.h,
        low: latestCandle.low || latestCandle.l,
        close: latestCandle.close || latestCandle.c,
        volume: latestCandle.volume || latestCandle.v,
      };
    } catch (error) {
      console.error("Error fetching latest price from API:", error);
      throw new Error(`Failed to fetch latest price: ${error.message}`);
    }
  },

  async getAvailableSymbols(db) {
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
    } catch (error) {
      console.error("Error fetching available symbols:", error);
      throw new Error(`Failed to fetch available symbols: ${error.message}`);
    }
  },

  async analyzePricePoints(
    { symbol, interval, startTime, endTime, type = "both", count = 3 }
  ) {
    try {
      const API_BASE_URL = "https://market.spotcanvas.com";
      
      // Log the query parameters for debugging
      console.log("Analyzing price points:", {
        symbol,
        interval,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        type,
        count,
      });

      // Build query parameters for the API
      const params = new URLSearchParams({
        symbol,
        granularity: interval || "ONE_HOUR",
        start_time: startTime.toString(),
        end_time: endTime.toString(),
        exchange: "coinbase",
      });

      console.log(`Fetching price data for analysis from API: ${API_BASE_URL}/history?${params}`);

      // Fetch from the API
      const response = await fetch(`${API_BASE_URL}/history?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const candles = data.candles || data || [];

      console.log(`API returned ${candles.length} candles`);

      if (candles.length === 0) {
        return {
          symbol,
          interval,
          message: "No data available for the specified time range",
          highs: [],
          lows: [],
        };
      }

      // Normalize candle data structure
      const normalizedCandles = candles.map((c) => ({
        timestamp: c.timestamp || c.time || c.t,
        open: c.open || c.o,
        high: c.high || c.h,
        low: c.low || c.l,
        close: c.close || c.c,
        volume: c.volume || c.v,
      }));

      // Find local maxima (highs) and minima (lows)
      const highs = [];
      const lows = [];

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
    } catch (error) {
      console.error("Error analyzing price points:", error);
      throw new Error(`Failed to analyze price points: ${error.message}`);
    }
  },

  formatResult(toolName, result) {
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

      default:
        return `Completed ${toolName}`;
    }
  },
};
