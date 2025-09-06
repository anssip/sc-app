import { Workflow, TrendLineInput, TrendLineResult } from "./types.js";
import { marketAPI, PriceCandle } from "../market-api.js";

export class TrendLineWorkflow
  implements Workflow<TrendLineInput, TrendLineResult>
{
  name = "TrendLineWorkflow";
  description =
    "Find collinear points using RANSAC algorithm for robust trend line fitting";

  validateInput(input: TrendLineInput): boolean {
    if (!input.symbol || !input.interval || !input.timeRange) {
      return false;
    }
    if (!input.timeRange.start || !input.timeRange.end) {
      return false;
    }
    if (input.type !== "resistance" && input.type !== "support") {
      return false;
    }
    return true;
  }

  async execute(
    input: TrendLineInput,
    onProgress?: (message: string) => void
  ): Promise<TrendLineResult> {
    const log = (message: string) => {
      console.log(message);
      if (onProgress) onProgress(message);
    };

    // Format time range for display
    const startDate = new Date(input.timeRange.start);
    const endDate = new Date(input.timeRange.end);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    log(`📊 **Time Frame Analysis:**`);
    log(
      `• Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} (${daysDiff} days)`
    );
    log(`• Symbol: ${input.symbol}`);
    log(`• Interval: ${input.interval.replace(/_/g, " ").toLowerCase()}`);
    log(`• Looking for: ${input.type} line\n`);

    // Fetch price data
    log(`🔄 Fetching market data from API...`);

    // Ensure we don't request future data
    const now = Date.now();
    const adjustedEndTime = Math.min(input.timeRange.end, now);
    if (input.timeRange.end > now) {
      log(
        `⚠️ Adjusted end time from future (${new Date(
          input.timeRange.end
        ).toISOString()}) to now (${new Date(adjustedEndTime).toISOString()})`
      );
    }

    log(
      `• Request time range: ${new Date(
        input.timeRange.start
      ).toISOString()} to ${new Date(adjustedEndTime).toISOString()}`
    );

    // Use the new MarketAPI to fetch data with automatic batching
    const priceData = await marketAPI.fetchPriceData(
      input.symbol,
      input.interval,
      input.timeRange.start,
      adjustedEndTime,
      log // Pass the log function for progress updates
    );

    log(`✅ Retrieved ${priceData.length} candles`);

    if (priceData.length > 0) {
      const priceMin = Math.min(...priceData.map((c) => c.low));
      const priceMax = Math.max(...priceData.map((c) => c.high));
      log(`• Price range: $${priceMin.toFixed(2)} - $${priceMax.toFixed(2)}\n`);
    }

    // Find peaks or valleys based on type
    log(`🔍 Analyzing price action to find ${input.type} points...`);
    const keyPoints =
      input.type === "resistance"
        ? this.findPeaks(priceData)
        : this.findValleys(priceData);

    if (keyPoints.length > 0) {
      const pointPrices = keyPoints.map((p) => p.price);
      log(`✅ Found ${keyPoints.length} potential ${input.type} points`);
      log(
        `• Price levels: $${Math.min(...pointPrices).toFixed(2)} - $${Math.max(
          ...pointPrices
        ).toFixed(2)}\n`
      );
    } else {
      log(`⚠️ No ${input.type} points found in this time frame\n`);
    }

    if (keyPoints.length < (input.minPoints || 3)) {
      // Provide helpful feedback about what was found
      const suggestion =
        keyPoints.length === 0
          ? "Try expanding the time range or using a different interval."
          : `Only found ${keyPoints.length} points. Try expanding the time range to find more ${input.type} points.`;

      throw new Error(
        `Insufficient ${input.type} points found. Need at least ${
          input.minPoints || 3
        }, found ${keyPoints.length}. ${suggestion}`
      );
    }

    // Apply RANSAC to find best-fit line
    log(`🎯 Running RANSAC algorithm to find best-fit line...`);
    log(`• Minimum points required: ${input.minPoints || 3}`);
    log(`• Threshold: ${((input.threshold || 0.02) * 100).toFixed(1)}%`);
    log(`• Max iterations: ${input.maxIterations || 1000}\n`);

    const ransacResult = this.ransac(
      keyPoints,
      input.minPoints || 3,
      input.threshold || 0.02,
      input.maxIterations || 1000
    );

    log(`✅ RANSAC complete!`);
    log(
      `• Inlier points: ${ransacResult.inliers.length} out of ${keyPoints.length}`
    );
    log(`• Confidence: ${(ransacResult.confidence * 100).toFixed(1)}%\n`);

    // Generate trend line parameters for chart
    log(`📈 Generating trend line for chart...`);
    // Use the adjusted time range (not the original which might be in the future)
    const adjustedTimeRange = {
      start: input.timeRange.start,
      end: adjustedEndTime,
    };
    const trendLineParams = this.generateTrendLineParams(
      ransacResult.bestLine,
      adjustedTimeRange
    );

    log(`✅ Trend line ready:`);
    log(`• Start: $${trendLineParams.startPrice.toFixed(2)}`);
    log(`• End: $${trendLineParams.endPrice.toFixed(2)}`);
    const priceChange = trendLineParams.endPrice - trendLineParams.startPrice;
    const priceChangePercent = (priceChange / trendLineParams.startPrice) * 100;
    log(
      `• Change: ${priceChange >= 0 ? "+" : ""}$${priceChange.toFixed(2)} (${
        priceChangePercent >= 0 ? "+" : ""
      }${priceChangePercent.toFixed(2)}%)\n`
    );

    return {
      points: ransacResult.inliers,
      equation: ransacResult.bestLine,
      confidence: ransacResult.confidence,
      trendLine: trendLineParams,
      type: input.type,
    };
  }

  private findPeaks(
    data: PriceCandle[]
  ): Array<{ timestamp: number; price: number }> {
    const peaks: Array<{ timestamp: number; price: number }> = [];
    const window = 5; // Look at 5 candles on each side

    for (let i = window; i < data.length - window; i++) {
      const current = data[i].high;
      let isPeak = true;

      // Check if current high is higher than surrounding highs
      for (let j = i - window; j <= i + window; j++) {
        if (j !== i && data[j].high >= current) {
          isPeak = false;
          break;
        }
      }

      if (isPeak) {
        peaks.push({
          timestamp: data[i].timestamp,
          price: current,
        });
      }
    }

    return peaks;
  }

  private findValleys(
    data: PriceCandle[]
  ): Array<{ timestamp: number; price: number }> {
    const valleys: Array<{ timestamp: number; price: number }> = [];
    const window = 5;

    for (let i = window; i < data.length - window; i++) {
      const current = data[i].low;
      let isValley = true;

      // Check if current low is lower than surrounding lows
      for (let j = i - window; j <= i + window; j++) {
        if (j !== i && data[j].low <= current) {
          isValley = false;
          break;
        }
      }

      if (isValley) {
        valleys.push({
          timestamp: data[i].timestamp,
          price: current,
        });
      }
    }

    return valleys;
  }

  private ransac(
    points: Array<{ timestamp: number; price: number }>,
    minPoints: number,
    threshold: number,
    maxIterations: number
  ): {
    bestLine: { slope: number; intercept: number };
    inliers: Array<{ timestamp: number; price: number }>;
    confidence: number;
  } {
    let bestLine = { slope: 0, intercept: 0 };
    let bestInliers: Array<{ timestamp: number; price: number }> = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Randomly select 2 points to define a line
      const sample = this.randomSample(points, 2);
      if (sample.length < 2) continue;

      // Calculate line equation from these 2 points
      const line = this.fitLine(sample);

      // Find all inliers (points close to the line)
      const inliers = points.filter((point) => {
        const distance = this.pointToLineDistance(point, line);
        const relativeDistance = distance / point.price;
        return relativeDistance <= threshold;
      });

      // Score based on number of inliers and their total fit
      if (inliers.length >= minPoints && inliers.length > bestInliers.length) {
        // Refit line using all inliers for better accuracy
        const refittedLine = this.fitLine(inliers);

        // Recalculate inliers with refitted line
        const finalInliers = points.filter((point) => {
          const distance = this.pointToLineDistance(point, refittedLine);
          const relativeDistance = distance / point.price;
          return relativeDistance <= threshold;
        });

        if (
          finalInliers.length >= minPoints &&
          finalInliers.length > bestInliers.length
        ) {
          bestLine = refittedLine;
          bestInliers = finalInliers;
        }
      }
    }

    const confidence = bestInliers.length / points.length;

    return {
      bestLine,
      inliers: bestInliers,
      confidence,
    };
  }

  private randomSample<T>(array: T[], n: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  private fitLine(points: Array<{ timestamp: number; price: number }>): {
    slope: number;
    intercept: number;
  } {
    if (points.length < 2) {
      throw new Error("Need at least 2 points to fit a line");
    }

    // Simple least squares fitting
    const n = points.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (const point of points) {
      const x = point.timestamp;
      const y = point.price;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private pointToLineDistance(
    point: { timestamp: number; price: number },
    line: { slope: number; intercept: number }
  ): number {
    // Calculate perpendicular distance from point to line
    // Line equation: y = mx + b
    // Convert to: mx - y + b = 0
    // Distance = |mx - y + b| / sqrt(m^2 + 1)
    const expectedPrice = line.slope * point.timestamp + line.intercept;
    return Math.abs(point.price - expectedPrice);
  }

  private generateTrendLineParams(
    line: { slope: number; intercept: number },
    timeRange: { start: number; end: number }
  ): {
    startTime: number;
    endTime: number;
    startPrice: number;
    endPrice: number;
    color?: string;
    lineWidth?: number;
    style?: "solid" | "dashed" | "dotted";
  } {
    const startPrice = line.slope * timeRange.start + line.intercept;
    const endPrice = line.slope * timeRange.end + line.intercept;

    return {
      startTime: timeRange.start,
      endTime: timeRange.end,
      startPrice,
      endPrice,
      color: "#FF5733",
      lineWidth: 2,
      style: "solid",
    };
  }
}
