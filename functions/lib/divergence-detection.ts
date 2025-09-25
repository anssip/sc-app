/**
 * Divergence Detection Module
 * Detects price divergences with technical indicators (RSI, MACD, Volume, etc.)
 */

import { PriceCandle } from "./market-api.js";

export interface Peak {
  timestamp: number;
  value: number;
  index: number;
  type: "high" | "low";
}

export interface Divergence {
  type: "bullish" | "bearish" | "hidden_bullish" | "hidden_bearish";
  indicator: string;
  startPoint: {
    timestamp: number;
    price: number;
    indicatorValue: number;
  };
  endPoint: {
    timestamp: number;
    price: number;
    indicatorValue: number;
  };
  strength: number; // 0-100
  confidence: number; // 0-100
  description: string;
}

export interface DivergenceDetectionOptions {
  lookbackPeriod?: number; // Number of candles to look back for peaks/troughs (default: 5)
  minStrength?: number; // Minimum divergence strength to report (0-100, default: 30)
  divergenceTypes?: ("regular" | "hidden" | "all")[]; // Types to detect (default: ["regular"])
}

/**
 * Finds peaks (highs) and troughs (lows) in a data series
 */
export function findPeaksAndTroughs(
  data: { timestamp: number; value: number }[],
  lookback: number = 5
): Peak[] {
  const peaks: Peak[] = [];

  if (data.length < lookback * 2 + 1) {
    return peaks;
  }

  for (let i = lookback; i < data.length - lookback; i++) {
    const current = data[i].value;
    let isHigh = true;
    let isLow = true;

    // Check if it's a local maximum
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (data[j].value > current) {
        isHigh = false;
      }
      if (data[j].value < current) {
        isLow = false;
      }
    }

    if (isHigh) {
      peaks.push({
        timestamp: data[i].timestamp,
        value: current,
        index: i,
        type: "high",
      });
    } else if (isLow) {
      peaks.push({
        timestamp: data[i].timestamp,
        value: current,
        index: i,
        type: "low",
      });
    }
  }

  return peaks;
}

/**
 * Calculates the strength of a divergence (0-100)
 */
function calculateDivergenceStrength(
  priceDiff: number,
  indicatorDiff: number,
  priceRange: number,
  indicatorRange: number
): number {
  // Avoid division by zero
  if (priceRange === 0 || indicatorRange === 0) {
    return 0;
  }

  // Normalize the differences as percentages of their ranges
  const priceChangePercent = Math.abs(priceDiff / priceRange) * 100;
  const indicatorChangePercent = Math.abs(indicatorDiff / indicatorRange) * 100;

  // Check if they move in opposite directions (true divergence)
  const isOpposite = (priceDiff > 0 && indicatorDiff < 0) || (priceDiff < 0 && indicatorDiff > 0);

  if (!isOpposite) {
    // Not a true divergence, return 0
    return 0;
  }

  // Calculate strength based on the difference between the two movements
  // The greater the contrast, the stronger the divergence
  const divergenceMagnitude = Math.abs(priceChangePercent + indicatorChangePercent);

  // Scale the result (multiply by 2 for better distribution)
  const strength = Math.min(divergenceMagnitude * 2, 100);

  console.log(`Divergence strength calculation: price change ${priceChangePercent.toFixed(2)}%, indicator change ${indicatorChangePercent.toFixed(2)}%, strength ${strength.toFixed(2)}`);

  return strength;
}

/**
 * Calculates confidence score based on various factors
 */
function calculateConfidence(
  divergence: Partial<Divergence>,
  _volumeAtStart?: number,
  volumeAtEnd?: number,
  avgVolume?: number
): number {
  let confidence = 50; // Base confidence

  // Add confidence if divergence strength is high
  if (divergence.strength && divergence.strength > 70) {
    confidence += 20;
  } else if (divergence.strength && divergence.strength > 50) {
    confidence += 10;
  }

  // Add confidence if volume confirms the divergence
  if (volumeAtEnd && avgVolume && volumeAtEnd > avgVolume * 1.5) {
    confidence += 15; // High volume at divergence point
  }

  // Add confidence based on time between points (not too close, not too far)
  if (divergence.startPoint && divergence.endPoint) {
    const timeDiff = divergence.endPoint.timestamp - divergence.startPoint.timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 4 && hoursDiff <= 48) {
      confidence += 15; // Optimal time range for divergence
    }
  }

  return Math.min(confidence, 100);
}

/**
 * Calculate adaptive matching window based on candle interval
 */
function getMatchingWindow(candles: PriceCandle[]): number {
  if (candles.length < 2) return 3600000 * 4; // Default 4 hours

  // Calculate the average time between candles
  const avgInterval = (candles[candles.length - 1].timestamp - candles[0].timestamp) / (candles.length - 1);

  // Allow matching within 1.5x the average interval to account for gaps
  return avgInterval * 1.5;
}

/**
 * Main function to detect divergences between price and an indicator
 */
export function detectDivergence(
  candles: PriceCandle[],
  indicatorData: { timestamp: number; value: number }[],
  indicatorName: string,
  options: DivergenceDetectionOptions = {}
): Divergence[] {
  const {
    lookbackPeriod = 5,
    minStrength = 30,
    divergenceTypes = ["regular"],
  } = options;

  const divergences: Divergence[] = [];

  // Calculate adaptive matching window
  const matchingWindow = getMatchingWindow(candles);
  // Make lookback adaptive based on data length
  const adaptiveLookback = Math.min(lookbackPeriod, Math.floor(candles.length / 4));
  const actualLookback = Math.max(2, adaptiveLookback); // Minimum of 2

  // Prepare price data (using high/low for peaks/troughs)
  const priceHighs = candles.map(c => ({ timestamp: c.timestamp, value: c.high }));
  const priceLows = candles.map(c => ({ timestamp: c.timestamp, value: c.low }));

  // Find peaks and troughs
  const pricePeaks = findPeaksAndTroughs(priceHighs, actualLookback).filter(p => p.type === "high");
  const priceTroughs = findPeaksAndTroughs(priceLows, actualLookback).filter(p => p.type === "low");
  const indicatorPeaksAndTroughs = findPeaksAndTroughs(indicatorData, actualLookback);
  const indicatorPeaks = indicatorPeaksAndTroughs.filter(p => p.type === "high");
  const indicatorTroughs = indicatorPeaksAndTroughs.filter(p => p.type === "low");

  // Calculate price and indicator ranges for normalization
  const priceRange = Math.max(...candles.map(c => c.high)) - Math.min(...candles.map(c => c.low));
  const indicatorRange = Math.max(...indicatorData.map(d => d.value)) - Math.min(...indicatorData.map(d => d.value));


  // Detect Regular Bearish Divergence (Price HH, Indicator LH)
  if (divergenceTypes.includes("regular") || divergenceTypes.includes("all")) {
    for (let i = 1; i < pricePeaks.length; i++) {
      const prevPricePeak = pricePeaks[i - 1];
      const currPricePeak = pricePeaks[i];

      // Find corresponding indicator peaks near these timestamps
      const prevIndicatorPeak = indicatorPeaks.find(
        p => Math.abs(p.timestamp - prevPricePeak.timestamp) < matchingWindow
      );
      const currIndicatorPeak = indicatorPeaks.find(
        p => Math.abs(p.timestamp - currPricePeak.timestamp) < matchingWindow
      );

      if (prevIndicatorPeak && currIndicatorPeak) {
        // Check for regular bearish divergence
        if (
          currPricePeak.value > prevPricePeak.value && // Price makes higher high
          currIndicatorPeak.value < prevIndicatorPeak.value // Indicator makes lower high
        ) {
          const priceDiff = currPricePeak.value - prevPricePeak.value;
          const indicatorDiff = currIndicatorPeak.value - prevIndicatorPeak.value;
          const strength = calculateDivergenceStrength(priceDiff, indicatorDiff, priceRange, indicatorRange);

          if (strength >= minStrength) {
            const divergence: Divergence = {
              type: "bearish",
              indicator: indicatorName,
              startPoint: {
                timestamp: prevPricePeak.timestamp,
                price: prevPricePeak.value,
                indicatorValue: prevIndicatorPeak.value,
              },
              endPoint: {
                timestamp: currPricePeak.timestamp,
                price: currPricePeak.value,
                indicatorValue: currIndicatorPeak.value,
              },
              strength,
              confidence: 0, // Will be calculated
              description: `Bearish divergence: Price made higher high ($${currPricePeak.value.toFixed(2)} > $${prevPricePeak.value.toFixed(2)}), but ${indicatorName} made lower high (${currIndicatorPeak.value.toFixed(2)} < ${prevIndicatorPeak.value.toFixed(2)})`,
            };

            // Calculate confidence
            const volumeAtEnd = candles.find(c => c.timestamp === currPricePeak.timestamp)?.volume;
            const avgVolume = candles.reduce((sum, c) => sum + (c.volume || 0), 0) / candles.length;
            divergence.confidence = calculateConfidence(divergence, undefined, volumeAtEnd, avgVolume);

            divergences.push(divergence);
          }
        }
      }
    }

    // Detect Regular Bullish Divergence (Price LL, Indicator HL)
    for (let i = 1; i < priceTroughs.length; i++) {
      const prevPriceTrough = priceTroughs[i - 1];
      const currPriceTrough = priceTroughs[i];

      // Find corresponding indicator troughs near these timestamps
      const prevIndicatorTrough = indicatorTroughs.find(
        p => Math.abs(p.timestamp - prevPriceTrough.timestamp) < matchingWindow
      );
      const currIndicatorTrough = indicatorTroughs.find(
        p => Math.abs(p.timestamp - currPriceTrough.timestamp) < matchingWindow
      );

      if (prevIndicatorTrough && currIndicatorTrough) {
        // Check for regular bullish divergence
        if (
          currPriceTrough.value < prevPriceTrough.value && // Price makes lower low
          currIndicatorTrough.value > prevIndicatorTrough.value // Indicator makes higher low
        ) {
          const priceDiff = currPriceTrough.value - prevPriceTrough.value;
          const indicatorDiff = currIndicatorTrough.value - prevIndicatorTrough.value;
          const strength = calculateDivergenceStrength(priceDiff, indicatorDiff, priceRange, indicatorRange);

          if (strength >= minStrength) {
            const divergence: Divergence = {
              type: "bullish",
              indicator: indicatorName,
              startPoint: {
                timestamp: prevPriceTrough.timestamp,
                price: prevPriceTrough.value,
                indicatorValue: prevIndicatorTrough.value,
              },
              endPoint: {
                timestamp: currPriceTrough.timestamp,
                price: currPriceTrough.value,
                indicatorValue: currIndicatorTrough.value,
              },
              strength,
              confidence: 0,
              description: `Bullish divergence: Price made lower low ($${currPriceTrough.value.toFixed(2)} < $${prevPriceTrough.value.toFixed(2)}), but ${indicatorName} made higher low (${currIndicatorTrough.value.toFixed(2)} > ${prevIndicatorTrough.value.toFixed(2)})`,
            };

            // Calculate confidence
            const volumeAtEnd = candles.find(c => c.timestamp === currPriceTrough.timestamp)?.volume;
            const avgVolume = candles.reduce((sum, c) => sum + (c.volume || 0), 0) / candles.length;
            divergence.confidence = calculateConfidence(divergence, undefined, volumeAtEnd, avgVolume);

            divergences.push(divergence);
          }
        }
      }
    }
  }

  // Detect Hidden Divergences if requested
  if (divergenceTypes.includes("hidden") || divergenceTypes.includes("all")) {
    // Hidden Bearish Divergence (Price LH, Indicator HH)
    for (let i = 1; i < pricePeaks.length; i++) {
      const prevPricePeak = pricePeaks[i - 1];
      const currPricePeak = pricePeaks[i];

      const prevIndicatorPeak = indicatorPeaks.find(
        p => Math.abs(p.timestamp - prevPricePeak.timestamp) < matchingWindow
      );
      const currIndicatorPeak = indicatorPeaks.find(
        p => Math.abs(p.timestamp - currPricePeak.timestamp) < matchingWindow
      );

      if (prevIndicatorPeak && currIndicatorPeak) {
        if (
          currPricePeak.value < prevPricePeak.value && // Price makes lower high
          currIndicatorPeak.value > prevIndicatorPeak.value // Indicator makes higher high
        ) {
          const priceDiff = currPricePeak.value - prevPricePeak.value;
          const indicatorDiff = currIndicatorPeak.value - prevIndicatorPeak.value;
          const strength = calculateDivergenceStrength(priceDiff, indicatorDiff, priceRange, indicatorRange);

          if (strength >= minStrength) {
            const divergence: Divergence = {
              type: "hidden_bearish",
              indicator: indicatorName,
              startPoint: {
                timestamp: prevPricePeak.timestamp,
                price: prevPricePeak.value,
                indicatorValue: prevIndicatorPeak.value,
              },
              endPoint: {
                timestamp: currPricePeak.timestamp,
                price: currPricePeak.value,
                indicatorValue: currIndicatorPeak.value,
              },
              strength,
              confidence: 0,
              description: `Hidden bearish divergence: Price made lower high ($${currPricePeak.value.toFixed(2)} < $${prevPricePeak.value.toFixed(2)}), but ${indicatorName} made higher high (${currIndicatorPeak.value.toFixed(2)} > ${prevIndicatorPeak.value.toFixed(2)}) - Trend continuation signal`,
            };

            const volumeAtEnd = candles.find(c => c.timestamp === currPricePeak.timestamp)?.volume;
            const avgVolume = candles.reduce((sum, c) => sum + (c.volume || 0), 0) / candles.length;
            divergence.confidence = calculateConfidence(divergence, undefined, volumeAtEnd, avgVolume);

            divergences.push(divergence);
          }
        }
      }
    }

    // Hidden Bullish Divergence (Price HL, Indicator LL)
    for (let i = 1; i < priceTroughs.length; i++) {
      const prevPriceTrough = priceTroughs[i - 1];
      const currPriceTrough = priceTroughs[i];

      const prevIndicatorTrough = indicatorTroughs.find(
        p => Math.abs(p.timestamp - prevPriceTrough.timestamp) < matchingWindow
      );
      const currIndicatorTrough = indicatorTroughs.find(
        p => Math.abs(p.timestamp - currPriceTrough.timestamp) < matchingWindow
      );

      if (prevIndicatorTrough && currIndicatorTrough) {
        if (
          currPriceTrough.value > prevPriceTrough.value && // Price makes higher low
          currIndicatorTrough.value < prevIndicatorTrough.value // Indicator makes lower low
        ) {
          const priceDiff = currPriceTrough.value - prevPriceTrough.value;
          const indicatorDiff = currIndicatorTrough.value - prevIndicatorTrough.value;
          const strength = calculateDivergenceStrength(priceDiff, indicatorDiff, priceRange, indicatorRange);

          if (strength >= minStrength) {
            const divergence: Divergence = {
              type: "hidden_bullish",
              indicator: indicatorName,
              startPoint: {
                timestamp: prevPriceTrough.timestamp,
                price: prevPriceTrough.value,
                indicatorValue: prevIndicatorTrough.value,
              },
              endPoint: {
                timestamp: currPriceTrough.timestamp,
                price: currPriceTrough.value,
                indicatorValue: currIndicatorTrough.value,
              },
              strength,
              confidence: 0,
              description: `Hidden bullish divergence: Price made higher low ($${currPriceTrough.value.toFixed(2)} > $${prevPriceTrough.value.toFixed(2)}), but ${indicatorName} made lower low (${currIndicatorTrough.value.toFixed(2)} < ${prevIndicatorTrough.value.toFixed(2)}) - Trend continuation signal`,
            };

            const volumeAtEnd = candles.find(c => c.timestamp === currPriceTrough.timestamp)?.volume;
            const avgVolume = candles.reduce((sum, c) => sum + (c.volume || 0), 0) / candles.length;
            divergence.confidence = calculateConfidence(divergence, undefined, volumeAtEnd, avgVolume);

            divergences.push(divergence);
          }
        }
      }
    }
  }

  return divergences;
}

/**
 * Special function for volume divergence detection
 * Volume divergence is different - we look for price movements not confirmed by volume
 */
export function detectVolumeDivergence(
  candles: PriceCandle[],
  options: DivergenceDetectionOptions = {}
): Divergence[] {
  const {
    lookbackPeriod = 5,
    minStrength = 30,
  } = options;

  const divergences: Divergence[] = [];

  // Prepare data
  const priceData = candles.map(c => ({
    timestamp: c.timestamp,
    value: (c.high + c.low) / 2 // Use mid price
  }));

  // Find peaks and troughs
  const pricePeaksAndTroughs = findPeaksAndTroughs(priceData, lookbackPeriod);

  const pricePeaks = pricePeaksAndTroughs.filter(p => p.type === "high");

  // Volume divergence: Price makes new high but volume doesn't confirm
  for (let i = 1; i < pricePeaks.length; i++) {
    const prevPricePeak = pricePeaks[i - 1];
    const currPricePeak = pricePeaks[i];

    // Find volume at these price peaks
    const prevVolume = candles.find(c => c.timestamp === prevPricePeak.timestamp)?.volume || 0;
    const currVolume = candles.find(c => c.timestamp === currPricePeak.timestamp)?.volume || 0;

    // Price higher high with lower volume = bearish volume divergence
    if (currPricePeak.value > prevPricePeak.value && currVolume < prevVolume) {
      const strength = ((prevVolume - currVolume) / prevVolume) * 100;

      if (strength >= minStrength) {
        divergences.push({
          type: "bearish",
          indicator: "volume",
          startPoint: {
            timestamp: prevPricePeak.timestamp,
            price: prevPricePeak.value,
            indicatorValue: prevVolume,
          },
          endPoint: {
            timestamp: currPricePeak.timestamp,
            price: currPricePeak.value,
            indicatorValue: currVolume,
          },
          strength: Math.min(strength, 100),
          confidence: strength > 50 ? 75 : 50,
          description: `Volume divergence: Price made new high ($${currPricePeak.value.toFixed(2)}), but volume decreased by ${strength.toFixed(1)}% - Weak rally`,
        });
      }
    }
  }

  return divergences;
}