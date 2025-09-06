export class TrendLineWorkflow {
    name = "TrendLineWorkflow";
    description = "Find collinear points using RANSAC algorithm for robust trend line fitting";
    validateInput(input) {
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
    async execute(input) {
        // Fetch price data
        const priceData = await this.fetchPriceData(input.symbol, input.interval, input.timeRange.start, input.timeRange.end);
        // Find peaks or valleys based on type
        const keyPoints = input.type === "resistance"
            ? this.findPeaks(priceData)
            : this.findValleys(priceData);
        if (keyPoints.length < (input.minPoints || 3)) {
            throw new Error(`Insufficient key points found. Need at least ${input.minPoints || 3}, found ${keyPoints.length}`);
        }
        // Apply RANSAC to find best-fit line
        const ransacResult = this.ransac(keyPoints, input.minPoints || 3, input.threshold || 0.02, input.maxIterations || 1000);
        // Generate trend line parameters for chart
        const trendLineParams = this.generateTrendLineParams(ransacResult.bestLine, input.timeRange);
        return {
            points: ransacResult.inliers,
            equation: ransacResult.bestLine,
            confidence: ransacResult.confidence,
            trendLine: trendLineParams,
            type: input.type,
        };
    }
    async fetchPriceData(_symbol, interval, startTime, endTime) {
        // TODO: Implement actual API call to fetch price data
        // For now, return mock data for testing
        const mockData = [];
        const intervalMs = this.getIntervalMilliseconds(interval);
        let currentTime = startTime;
        while (currentTime <= endTime) {
            const basePrice = 50000 + Math.sin(currentTime / 1000000) * 5000;
            mockData.push({
                timestamp: currentTime,
                open: basePrice + Math.random() * 100,
                high: basePrice + Math.random() * 200 + 100,
                low: basePrice - Math.random() * 100,
                close: basePrice + Math.random() * 100,
                volume: Math.random() * 1000000,
            });
            currentTime += intervalMs;
        }
        return mockData;
    }
    findPeaks(data) {
        const peaks = [];
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
    findValleys(data) {
        const valleys = [];
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
    ransac(points, minPoints, threshold, maxIterations) {
        let bestLine = { slope: 0, intercept: 0 };
        let bestInliers = [];
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // Randomly select 2 points to define a line
            const sample = this.randomSample(points, 2);
            if (sample.length < 2)
                continue;
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
                if (finalInliers.length >= minPoints &&
                    finalInliers.length > bestInliers.length) {
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
    randomSample(array, n) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    }
    fitLine(points) {
        if (points.length < 2) {
            throw new Error("Need at least 2 points to fit a line");
        }
        // Simple least squares fitting
        const n = points.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
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
    pointToLineDistance(point, line) {
        // Calculate perpendicular distance from point to line
        // Line equation: y = mx + b
        // Convert to: mx - y + b = 0
        // Distance = |mx - y + b| / sqrt(m^2 + 1)
        const expectedPrice = line.slope * point.timestamp + line.intercept;
        return Math.abs(point.price - expectedPrice);
    }
    generateTrendLineParams(line, timeRange) {
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
    getIntervalMilliseconds(interval) {
        const intervals = {
            ONE_MINUTE: 60 * 1000,
            FIVE_MINUTES: 5 * 60 * 1000,
            FIFTEEN_MINUTES: 15 * 60 * 1000,
            THIRTY_MINUTES: 30 * 60 * 1000,
            ONE_HOUR: 60 * 60 * 1000,
            TWO_HOURS: 2 * 60 * 60 * 1000,
            FOUR_HOURS: 4 * 60 * 60 * 1000,
            ONE_DAY: 24 * 60 * 60 * 1000,
            ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
            ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
        };
        return intervals[interval] || 60 * 60 * 1000; // Default to 1 hour
    }
}
//# sourceMappingURL=TrendLineWorkflow.js.map