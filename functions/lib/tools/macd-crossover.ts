/**
 * MACD Crossover Detection Module
 * Detects MACD signal line crossovers and zero-line crossovers
 */

import { PriceCandle, MarketAPI } from "../market-api.js";

export interface MACDCrossover {
  type: "bullish" | "bearish" | "bullish_zero" | "bearish_zero";
  timestamp: number;
  price: number;
  macdValue: number;
  signalValue: number;
  histogramValue: number;
  strength: number; // 0-100
  confidence: number; // 0-100
  description: string;
  previousCandle?: {
    timestamp: number;
    price: number;
    macdValue: number;
    signalValue: number;
    histogramValue: number;
  };
}

export interface MACDCrossoverResult {
  crossovers: MACDCrossover[];
  totalFound: number;
  filtered: boolean;
}

export interface MACDCrossoverDetectionOptions {
  crossoverTypes?: ("bullish" | "bearish" | "zero" | "all")[];
  minStrength?: number;
  includeHistogram?: boolean;
  macdSettings?: {
    fast?: number;
    slow?: number;
    signal?: number;
  };
}

interface MACDData {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
  price: number;
}

/**
 * Detects MACD crossovers in the given price candles
 */
export async function detectMACDCrossovers(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
  options: MACDCrossoverDetectionOptions = {}
): Promise<MACDCrossoverResult> {
  const {
    crossoverTypes = ["bullish", "bearish"],
    minStrength = 30,
    includeHistogram = true,
  } = options;

  const marketAPI = new MarketAPI();

  // Fetch candles with MACD evaluator
  const candles = await marketAPI.fetchPriceData(
    symbol,
    interval,
    Math.floor(startTime),
    Math.floor(endTime),
    undefined,
    ["macd"]
  );

  if (!candles || candles.length < 2) {
    return {
      crossovers: [],
      totalFound: 0,
      filtered: false
    };
  }

  // Extract MACD data from candles
  const macdData = extractMACDData(candles);

  if (macdData.length < 2) {
    return {
      crossovers: [],
      totalFound: 0,
      filtered: false
    };
  }

  const crossovers: MACDCrossover[] = [];

  // Detect crossovers
  for (let i = 1; i < macdData.length; i++) {
    const current = macdData[i];
    const previous = macdData[i - 1];

    // Check for signal line crossovers
    if (shouldDetectType("bullish", crossoverTypes)) {
      // Bullish crossover: MACD crosses above signal
      if (previous.macd <= previous.signal && current.macd > current.signal) {
        const strength = calculateCrossoverStrength(
          current,
          previous,
          macdData,
          i,
          "bullish"
        );

        if (strength >= minStrength) {
          crossovers.push({
            type: "bullish",
            timestamp: current.timestamp,
            price: current.price,
            macdValue: current.macd,
            signalValue: current.signal,
            histogramValue: current.histogram,
            strength,
            confidence: calculateConfidence(strength, current, previous, includeHistogram),
            description: `Bullish MACD crossover detected - MACD line (${current.macd.toFixed(2)}) crossed above signal line (${current.signal.toFixed(2)}) at price $${current.price.toFixed(2)}`,
            previousCandle: {
              timestamp: previous.timestamp,
              price: previous.price,
              macdValue: previous.macd,
              signalValue: previous.signal,
              histogramValue: previous.histogram,
            },
          });
        }
      }
    }

    if (shouldDetectType("bearish", crossoverTypes)) {
      // Bearish crossover: MACD crosses below signal
      if (previous.macd >= previous.signal && current.macd < current.signal) {
        const strength = calculateCrossoverStrength(
          current,
          previous,
          macdData,
          i,
          "bearish"
        );

        if (strength >= minStrength) {
          crossovers.push({
            type: "bearish",
            timestamp: current.timestamp,
            price: current.price,
            macdValue: current.macd,
            signalValue: current.signal,
            histogramValue: current.histogram,
            strength,
            confidence: calculateConfidence(strength, current, previous, includeHistogram),
            description: `Bearish MACD crossover detected - MACD line (${current.macd.toFixed(2)}) crossed below signal line (${current.signal.toFixed(2)}) at price $${current.price.toFixed(2)}`,
            previousCandle: {
              timestamp: previous.timestamp,
              price: previous.price,
              macdValue: previous.macd,
              signalValue: previous.signal,
              histogramValue: previous.histogram,
            },
          });
        }
      }
    }

    // Check for zero-line crossovers
    if (shouldDetectType("zero", crossoverTypes)) {
      // Bullish zero-line crossover: MACD crosses above zero
      if (previous.macd <= 0 && current.macd > 0) {
        const strength = calculateZeroCrossoverStrength(current, previous, macdData, i);

        if (strength >= minStrength) {
          crossovers.push({
            type: "bullish_zero",
            timestamp: current.timestamp,
            price: current.price,
            macdValue: current.macd,
            signalValue: current.signal,
            histogramValue: current.histogram,
            strength,
            confidence: calculateConfidence(strength, current, previous, includeHistogram),
            description: `Bullish zero-line crossover - MACD (${current.macd.toFixed(2)}) crossed above zero at price $${current.price.toFixed(2)}, indicating positive momentum`,
            previousCandle: {
              timestamp: previous.timestamp,
              price: previous.price,
              macdValue: previous.macd,
              signalValue: previous.signal,
              histogramValue: previous.histogram,
            },
          });
        }
      }

      // Bearish zero-line crossover: MACD crosses below zero
      if (previous.macd >= 0 && current.macd < 0) {
        const strength = calculateZeroCrossoverStrength(current, previous, macdData, i);

        if (strength >= minStrength) {
          crossovers.push({
            type: "bearish_zero",
            timestamp: current.timestamp,
            price: current.price,
            macdValue: current.macd,
            signalValue: current.signal,
            histogramValue: current.histogram,
            strength,
            confidence: calculateConfidence(strength, current, previous, includeHistogram),
            description: `Bearish zero-line crossover - MACD (${current.macd.toFixed(2)}) crossed below zero at price $${current.price.toFixed(2)}, indicating negative momentum`,
            previousCandle: {
              timestamp: previous.timestamp,
              price: previous.price,
              macdValue: previous.macd,
              signalValue: previous.signal,
              histogramValue: previous.histogram,
            },
          });
        }
      }
    }
  }

  // Sort by confidence (highest first), then by strength
  crossovers.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.strength - a.strength;
  });

  // Store the total count before filtering
  const totalFound = crossovers.length;
  const maxResults = 10;

  // Filter to top 10 most significant crossovers
  let filteredCrossovers = crossovers;
  let wasFiltered = false;

  if (crossovers.length > maxResults) {
    filteredCrossovers = crossovers.slice(0, maxResults);
    wasFiltered = true;

    // Re-sort the filtered results by timestamp (most recent first) for display
    filteredCrossovers.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    // If not filtered, still sort by timestamp for display
    filteredCrossovers.sort((a, b) => b.timestamp - a.timestamp);
  }

  return {
    crossovers: filteredCrossovers,
    totalFound: totalFound,
    filtered: wasFiltered
  };
}

/**
 * Extract MACD data from candles with evaluations
 */
function extractMACDData(candles: PriceCandle[]): MACDData[] {
  const macdData: MACDData[] = [];

  for (const candle of candles) {
    if (candle.evaluations && candle.evaluations.length > 0) {
      const macdEvaluation = candle.evaluations.find(
        (e) => e.name?.toLowerCase().includes("macd")
      );

      if (macdEvaluation && macdEvaluation.values && macdEvaluation.values.length > 0) {
        const macdValue = macdEvaluation.values.find((v) => v.name === "macd");
        const signalValue = macdEvaluation.values.find((v) => v.name === "signal");
        const histogramValue = macdEvaluation.values.find((v) => v.name === "histogram");

        if (macdValue && signalValue) {
          macdData.push({
            timestamp: candle.timestamp,
            macd: macdValue.value,
            signal: signalValue.value,
            histogram: histogramValue?.value || (macdValue.value - signalValue.value),
            price: candle.close,
          });
        }
      }
    }
  }

  return macdData;
}

/**
 * Calculate the strength of a signal line crossover
 */
function calculateCrossoverStrength(
  current: MACDData,
  previous: MACDData,
  allData: MACDData[],
  _index: number,
  type: "bullish" | "bearish"
): number {
  let strength = 50; // Base strength

  // Factor 1: Magnitude of the crossover (how decisively it crossed)
  const crossoverMagnitude = Math.abs(current.macd - current.signal);
  const avgMagnitude = calculateAverageMagnitude(allData);
  if (avgMagnitude > 0) {
    const magnitudeRatio = crossoverMagnitude / avgMagnitude;
    strength += Math.min(20, magnitudeRatio * 10);
  }

  // Factor 2: Momentum (rate of change)
  const macdMomentum = Math.abs(current.macd - previous.macd);
  const signalMomentum = Math.abs(current.signal - previous.signal);
  const momentumDiff = macdMomentum - signalMomentum;

  if (type === "bullish" && momentumDiff > 0) {
    strength += Math.min(15, momentumDiff * 100);
  } else if (type === "bearish" && momentumDiff < 0) {
    strength += Math.min(15, Math.abs(momentumDiff) * 100);
  }

  // Factor 3: Histogram expansion (confirming the crossover)
  const histogramChange = current.histogram - previous.histogram;
  if ((type === "bullish" && histogramChange > 0) || (type === "bearish" && histogramChange < 0)) {
    strength += Math.min(15, Math.abs(histogramChange) * 100);
  }

  return Math.min(100, Math.max(0, strength));
}

/**
 * Calculate the strength of a zero-line crossover
 */
function calculateZeroCrossoverStrength(
  current: MACDData,
  previous: MACDData,
  _allData: MACDData[],
  _index: number
): number {
  let strength = 50; // Base strength

  // Factor 1: Distance from zero (how strongly it crossed)
  const distanceFromZero = Math.abs(current.macd);
  strength += Math.min(20, distanceFromZero * 50);

  // Factor 2: Momentum
  const momentum = Math.abs(current.macd - previous.macd);
  strength += Math.min(20, momentum * 100);

  // Factor 3: Signal line position (confirming trend)
  const signalAlignment = current.macd > 0 ? current.signal > 0 : current.signal < 0;
  if (signalAlignment) {
    strength += 10;
  }

  return Math.min(100, Math.max(0, strength));
}

/**
 * Calculate confidence based on multiple factors
 */
function calculateConfidence(
  strength: number,
  current: MACDData,
  previous: MACDData,
  includeHistogram: boolean
): number {
  let confidence = strength * 0.7; // Start with 70% of strength

  // Add confidence if histogram confirms
  if (includeHistogram) {
    const histogramConfirms =
      (current.histogram > previous.histogram && current.macd > current.signal) ||
      (current.histogram < previous.histogram && current.macd < current.signal);

    if (histogramConfirms) {
      confidence += 15;
    }
  }

  // Add confidence for clean crossover (not hovering around the line)
  const separation = Math.abs(current.macd - current.signal);
  if (separation > 0.5) {
    confidence += 15;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Calculate average magnitude of MACD-Signal separation
 */
function calculateAverageMagnitude(data: MACDData[]): number {
  if (data.length === 0) return 0;

  const sum = data.reduce((acc, d) => acc + Math.abs(d.macd - d.signal), 0);
  return sum / data.length;
}

/**
 * Check if a crossover type should be detected
 */
function shouldDetectType(
  type: string,
  crossoverTypes: ("bullish" | "bearish" | "zero" | "all")[]
): boolean {
  return (
    crossoverTypes.includes("all") ||
    crossoverTypes.includes(type as any) ||
    (type.includes("zero") && crossoverTypes.includes("zero"))
  );
}