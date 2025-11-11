/**
 * Market API client for fetching price data
 * Handles batching and rate limiting for the market.spotcanvas.com API
 *
 * This is a shared module used by both client and server code.
 */
export class MarketAPI {
  API_BASE_URL =
    "https://market-evaluators-dev-346028322665.europe-west1.run.app";
  MAX_CANDLES_PER_REQUEST = 200;
  /**
   * Fetches price data for a given symbol and time range
   * Automatically handles batching for large time ranges
   *
   * @param symbol Trading symbol (e.g., "BTC-USD")
   * @param interval Granularity (e.g., "ONE_HOUR", "ONE_DAY")
   * @param startTime Start timestamp in milliseconds
   * @param endTime End timestamp in milliseconds
   * @param onProgress Optional progress callback
   * @param evaluators Optional list of evaluator IDs (e.g., ["moving-averages", "rsi"])
   * @returns Array of price candles with optional indicator evaluations
   */
  async fetchPriceData(
    symbol,
    interval,
    startTime,
    endTime,
    onProgress,
    evaluators
  ) {
    try {
      console.log("=== MarketAPI.fetchPriceData DEBUG ===");
      console.log("Input parameters:");
      console.log(`  symbol: ${symbol}`);
      console.log(`  interval: ${interval}`);
      console.log(
        `  startTime: ${startTime} (${new Date(startTime).toISOString()})`
      );
      console.log(`  endTime: ${endTime} (${new Date(endTime).toISOString()})`);
      // Additional validation
      const timeDiff = endTime - startTime;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      console.log(
        `  Time difference: ${timeDiff}ms (${daysDiff.toFixed(2)} days)`
      );
      if (startTime >= endTime) {
        console.error("ERROR: startTime >= endTime!");
        throw new Error(
          "Invalid time range: start time must be before end time"
        );
      }
      const intervalMs = this.getIntervalMilliseconds(interval);
      console.log(
        `  intervalMs: ${intervalMs} (${intervalMs / 1000 / 60} minutes)`
      );
      // Align timestamps to interval boundaries and ensure they're integers
      const alignedStart = Math.floor(
        Math.floor(startTime / intervalMs) * intervalMs
      );
      const alignedEnd = Math.floor(
        Math.ceil(endTime / intervalMs) * intervalMs
      );
      console.log("=== Timestamp Alignment Debug ===");
      console.log(`  Original start: ${startTime}`);
      console.log(`  Original end: ${endTime}`);
      console.log(`  Interval in ms: ${intervalMs}`);
      console.log(`  startTime / intervalMs = ${startTime / intervalMs}`);
      console.log(
        `  Math.floor(${startTime / intervalMs}) = ${Math.floor(
          startTime / intervalMs
        )}`
      );
      console.log(`  endTime / intervalMs = ${endTime / intervalMs}`);
      console.log(
        `  Math.ceil(${endTime / intervalMs}) = ${Math.ceil(
          endTime / intervalMs
        )}`
      );
      console.log(
        `  alignedStart: ${alignedStart} (${new Date(
          alignedStart
        ).toISOString()})`
      );
      console.log(
        `  alignedEnd: ${alignedEnd} (${new Date(alignedEnd).toISOString()})`
      );
      console.log(`  Aligned diff: ${alignedEnd - alignedStart}ms`);
      // Calculate total candles needed
      const totalCandles =
        Math.floor((alignedEnd - alignedStart) / intervalMs) + 1;
      console.log(
        `  totalCandles calculation: Math.floor((${alignedEnd} - ${alignedStart}) / ${intervalMs}) + 1 = ${totalCandles}`
      );
      console.log(`  totalCandles needed: ${totalCandles}`);
      console.log(
        `  Expected candles for ${daysDiff.toFixed(
          1
        )} days at ${interval}: ~${Math.floor(timeDiff / intervalMs)}`
      );
      if (totalCandles <= this.MAX_CANDLES_PER_REQUEST) {
        // Single request is sufficient
        return await this.fetchSingleBatch(
          symbol,
          interval,
          alignedStart,
          alignedEnd,
          evaluators
        );
      }
      // Need to fetch in multiple batches
      const log = (msg) => {
        console.log(msg);
        if (onProgress) onProgress(msg);
      };
      log(`• Large time range detected: ${totalCandles} candles needed`);
      log(
        `• Fetching in batches of ${this.MAX_CANDLES_PER_REQUEST} candles...`
      );
      const results = [];
      let currentStart = alignedStart;
      let batchNumber = 1;
      const totalBatches = Math.ceil(
        totalCandles / this.MAX_CANDLES_PER_REQUEST
      );
      while (currentStart < alignedEnd) {
        // Calculate batch end time
        const remainingTime = alignedEnd - currentStart;
        const remainingCandles = Math.floor(remainingTime / intervalMs) + 1;
        const batchCandles = Math.min(
          remainingCandles,
          this.MAX_CANDLES_PER_REQUEST
        );
        const batchEnd = Math.min(
          currentStart + (batchCandles - 1) * intervalMs,
          alignedEnd
        );
        log(
          `• Fetching batch ${batchNumber}/${totalBatches} (${new Date(
            currentStart
          ).toLocaleDateString()} to ${new Date(
            batchEnd
          ).toLocaleDateString()})`
        );
        const batchData = await this.fetchSingleBatch(
          symbol,
          interval,
          currentStart,
          batchEnd,
          evaluators
        );
        results.push(...batchData);
        // Move to next batch
        currentStart = batchEnd + intervalMs;
        batchNumber++;
      }
      log(`✅ Fetched ${results.length} candles in ${totalBatches} batches`);
      return results;
    } catch (error) {
      console.error("Error fetching price data from API:", error);
      throw error;
    }
  }
  /**
   * Fetches a single batch of candles (up to MAX_CANDLES_PER_REQUEST)
   */
  async fetchSingleBatch(symbol, interval, startTime, endTime, evaluators) {
    // Build query parameters
    // Ensure timestamps are integers (no decimals)
    const params = new URLSearchParams();
    params.append("symbol", symbol);
    params.append("granularity", interval);
    params.append("start_time", Math.floor(startTime).toString());
    params.append("end_time", Math.floor(endTime).toString());
    // Add evaluators if provided
    if (evaluators && evaluators.length > 0) {
      params.append("evaluators", evaluators.join(","));
    }
    console.log("=== fetchSingleBatch DEBUG ===");
    console.log(
      `Fetching price data from API: ${this.API_BASE_URL}/history?${params}`
    );
    console.log(`• Symbol: ${symbol}`);
    console.log(`• Granularity: ${interval}`);
    console.log(
      `• StartTime: ${startTime} (${new Date(startTime).toISOString()})`
    );
    console.log(`• EndTime: ${endTime} (${new Date(endTime).toISOString()})`);
    console.log(
      `• Time range: ${(endTime - startTime) / (1000 * 60 * 60 * 24)} days`
    );
    console.log(
      `• Expected candles: ~${Math.floor(
        (endTime - startTime) / this.getIntervalMilliseconds(interval)
      )}`
    );
    console.log(
      `• Full URL: ${this.API_BASE_URL}/history?${params.toString()}`
    );
    const response = await fetch(`${this.API_BASE_URL}/history?${params}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }
    const result = await response.json();
    console.log(`API returned ${result.candles?.length || 0} candles`);
    if (result.candles && result.candles.length > 0) {
      const firstCandle = result.candles[0];
      const lastCandle = result.candles[result.candles.length - 1];
      console.log(
        `• First candle: ${new Date(
          Number(firstCandle.timestamp)
        ).toISOString()}`
      );
      console.log(
        `• Last candle: ${new Date(Number(lastCandle.timestamp)).toISOString()}`
      );
    }
    // Transform the API response to match PriceCandle interface
    if (!result.candles || !Array.isArray(result.candles)) {
      throw new Error("Invalid API response: missing candles array");
    }
    return result.candles.map((candle) => ({
      timestamp: Number(candle.timestamp),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0),
      evaluations: candle.evaluations || undefined,
    }));
  }
  /**
   * Converts interval string to milliseconds
   */
  getIntervalMilliseconds(interval) {
    const intervals = {
      ONE_MINUTE: 60 * 1000,
      FIVE_MINUTE: 5 * 60 * 1000,
      FIVE_MINUTES: 5 * 60 * 1000, // Support both formats
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
  }
  /**
   * Generates realistic mock data for testing when API is unavailable
   */
  generateMockData(startTime, endTime, interval) {
    console.warn("Using fallback mock data for testing");
    const mockData = [];
    const intervalMs = this.getIntervalMilliseconds(interval);
    let currentTime = startTime;
    // Use realistic BTC price levels
    const basePrice = 60000;
    const volatility = 2000;
    let previousClose = basePrice;
    while (currentTime <= endTime) {
      const open = previousClose + (Math.random() - 0.5) * 500;
      const close = open + (Math.random() - 0.5) * 800;
      const high = Math.max(open, close) + Math.random() * 600;
      const low = Math.min(open, close) - Math.random() * 600;
      mockData.push({
        timestamp: currentTime,
        open: Math.max(basePrice - volatility * 2, open),
        high: Math.max(basePrice - volatility * 2, high),
        low: Math.max(basePrice - volatility * 2, low),
        close: Math.max(basePrice - volatility * 2, close),
        volume: 1000000 + Math.random() * 5000000,
      });
      previousClose = close;
      currentTime += intervalMs;
    }
    return mockData;
  }
}
// Export a singleton instance
export const marketAPI = new MarketAPI();
//# sourceMappingURL=MarketAPI.js.map
