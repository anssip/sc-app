export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Pattern {
  type: string;
  significance: number;
  description: string;
  candleTimestamps: number[];
  price: number;
  volume?: number;
  nearLevel?: {
    type: "support" | "resistance";
    price: number;
    distance: number;
  };
}

export interface PatternDetectorConfig {
  minVolumeRatio?: number;
  minSignificance?: number;
  levelProximityThreshold?: number;
  supportBoost?: number;
  resistanceBoost?: number;
}

export class PatternDetector {
  private config: Required<PatternDetectorConfig>;

  constructor(config: PatternDetectorConfig = {}) {
    this.config = {
      minVolumeRatio: config.minVolumeRatio ?? 1.2,
      minSignificance: config.minSignificance ?? 0.5,
      levelProximityThreshold: config.levelProximityThreshold ?? 0.01,
      supportBoost: config.supportBoost ?? 2.0,
      resistanceBoost: config.resistanceBoost ?? 2.0,
    };
  }

  async detectPatterns(
    candles: Candle[],
    supports: number[] = [],
    resistances: number[] = []
  ): Promise<Pattern[]> {
    if (!candles || candles.length < 2) return [];

    const patterns: Pattern[] = [];
    const avgVolume = this.calculateAverageVolume(candles);

    for (let i = 1; i < candles.length; i++) {
      const candle = candles[i];
      const prevCandle = candles[i - 1];

      this.detectDoji(candle, avgVolume, patterns);
      this.detectHammer(candle, prevCandle, avgVolume, patterns);
      this.detectShootingStar(candle, prevCandle, avgVolume, patterns);

      if (i < candles.length - 1) {
        const nextCandle = candles[i + 1];
        this.detectEngulfingPatterns(candle, nextCandle, avgVolume, patterns);
      }
    }

    this.applyLevelBoosts(patterns, supports, resistances);

    return this.filterPatterns(patterns, candles.length, avgVolume);
  }

  private calculateAverageVolume(candles: Candle[]): number {
    if (!candles || candles.length === 0) return 0;
    const sum = candles.reduce((acc, c) => acc + (c.volume || 0), 0);
    return sum / candles.length;
  }

  private detectDoji(
    candle: Candle,
    avgVolume: number,
    patterns: Pattern[]
  ): void {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const bodyRatio = range > 0 ? (body / range) * 100 : 0;

    if (bodyRatio < 10 && range > 0) {
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      const shadowBalance = Math.abs(upperShadow - lowerShadow) / range;

      // Start with lower base significance
      let significance = 0.5; // Down from 0.7
      if (shadowBalance < 0.1) significance += 0.15; // Less boost for balance

      // Require higher body ratio for stronger doji
      if (bodyRatio < 5) significance += 0.1; // Extra boost for very small body

      const volumeRatio = avgVolume > 0 ? candle.volume / avgVolume : 1;
      if (volumeRatio > this.config.minVolumeRatio) {
        significance += 0.1 * Math.min(volumeRatio - 1, 1);
      }

      patterns.push({
        type: "Doji",
        significance,
        description: `Doji pattern (body ${bodyRatio.toFixed(1)}% of range)`,
        candleTimestamps: [candle.timestamp],
        price: candle.close,
        volume: candle.volume,
      });
    }
  }

  private detectHammer(
    candle: Candle,
    prevCandle: Candle,
    avgVolume: number,
    patterns: Pattern[]
  ): void {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);

    if (lowerShadow > body * 2 && upperShadow < body * 0.3) {
      const inDowntrend = prevCandle && prevCandle.close > candle.close;
      let significance = inDowntrend ? 0.8 : 0.6;

      const volumeRatio = avgVolume > 0 ? candle.volume / avgVolume : 1;
      if (volumeRatio > this.config.minVolumeRatio) {
        significance += 0.1 * Math.min(volumeRatio - 1, 1);
      }

      patterns.push({
        type: "Hammer",
        significance,
        description: `Hammer pattern${inDowntrend ? " in downtrend" : ""}`,
        candleTimestamps: [candle.timestamp],
        price: candle.close,
        volume: candle.volume,
      });
    }
  }

  private detectShootingStar(
    candle: Candle,
    prevCandle: Candle,
    avgVolume: number,
    patterns: Pattern[]
  ): void {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

    if (upperShadow > body * 2 && lowerShadow < body * 0.3) {
      const inUptrend = prevCandle && prevCandle.close < candle.close;
      let significance = inUptrend ? 0.8 : 0.6;

      const volumeRatio = avgVolume > 0 ? candle.volume / avgVolume : 1;
      if (volumeRatio > this.config.minVolumeRatio) {
        significance += 0.1 * Math.min(volumeRatio - 1, 1);
      }

      patterns.push({
        type: "ShootingStar",
        significance,
        description: `Shooting Star pattern${inUptrend ? " in uptrend" : ""}`,
        candleTimestamps: [candle.timestamp],
        price: candle.close,
        volume: candle.volume,
      });
    }
  }

  private detectEngulfingPatterns(
    candle: Candle,
    nextCandle: Candle,
    avgVolume: number,
    patterns: Pattern[]
  ): void {
    const currBody = Math.abs(candle.close - candle.open);
    const nextBody = Math.abs(nextCandle.close - nextCandle.open);

    if (nextBody > currBody * 1.5) {
      if (
        candle.close < candle.open &&
        nextCandle.close > nextCandle.open &&
        nextCandle.open <= candle.close &&
        nextCandle.close >= candle.open
      ) {
        let significance = 0.6; // Down from 0.75
        const volumeRatio = avgVolume > 0 ? nextCandle.volume / avgVolume : 1;
        if (volumeRatio > this.config.minVolumeRatio) {
          significance += 0.15 * Math.min(volumeRatio - 1, 1);
        }

        patterns.push({
          type: "BullishEngulfing",
          significance,
          description: "Bullish Engulfing pattern",
          candleTimestamps: [candle.timestamp, nextCandle.timestamp],
          price: nextCandle.close,
          volume: nextCandle.volume,
        });
      } else if (
        candle.close > candle.open &&
        nextCandle.close < nextCandle.open &&
        nextCandle.open >= candle.close &&
        nextCandle.close <= candle.open
      ) {
        let significance = 0.6; // Down from 0.75
        const volumeRatio = avgVolume > 0 ? nextCandle.volume / avgVolume : 1;
        if (volumeRatio > this.config.minVolumeRatio) {
          significance += 0.15 * Math.min(volumeRatio - 1, 1);
        }

        patterns.push({
          type: "BearishEngulfing",
          significance,
          description: "Bearish Engulfing pattern",
          candleTimestamps: [candle.timestamp, nextCandle.timestamp],
          price: nextCandle.close,
          volume: nextCandle.volume,
        });
      }
    }
  }

  private applyLevelBoosts(
    patterns: Pattern[],
    supports: number[],
    resistances: number[]
  ): void {
    for (const pattern of patterns) {
      let nearestSupport: { price: number; distance: number } | null = null;
      let nearestResistance: { price: number; distance: number } | null = null;

      if (pattern.price > 0) {
        for (const support of supports) {
          const distance = Math.abs(1 - support / pattern.price);
          if (distance < this.config.levelProximityThreshold) {
            if (!nearestSupport || distance < nearestSupport.distance) {
              nearestSupport = { price: support, distance };
            }
          }
        }

        for (const resistance of resistances) {
          const distance = Math.abs(1 - resistance / pattern.price);
          if (distance < this.config.levelProximityThreshold) {
            if (!nearestResistance || distance < nearestResistance.distance) {
              nearestResistance = { price: resistance, distance };
            }
          }
        }
      }

      // Handle bullish patterns at support
      if (nearestSupport && this.isBullishPattern(pattern.type)) {
        pattern.significance *= this.config.supportBoost;
        pattern.nearLevel = {
          type: "support",
          price: nearestSupport.price,
          distance: nearestSupport.distance,
        };
        pattern.description += ` at support $${nearestSupport.price.toFixed(
          2
        )}`;
      }
      // Handle bearish patterns at resistance
      else if (nearestResistance && this.isBearishPattern(pattern.type)) {
        pattern.significance *= this.config.resistanceBoost;
        pattern.nearLevel = {
          type: "resistance",
          price: nearestResistance.price,
          distance: nearestResistance.distance,
        };
        pattern.description += ` at resistance $${nearestResistance.price.toFixed(
          2
        )}`;
      }
      // Handle neutral patterns (Doji) - boost at either level but less aggressively
      else if (this.isNeutralPattern(pattern.type)) {
        if (
          nearestSupport &&
          (!nearestResistance ||
            nearestSupport.distance < nearestResistance.distance)
        ) {
          pattern.significance *= Math.min(
            this.config.supportBoost * 0.75,
            1.3
          );
          pattern.nearLevel = {
            type: "support",
            price: nearestSupport.price,
            distance: nearestSupport.distance,
          };
          pattern.description += ` at support $${nearestSupport.price.toFixed(
            2
          )}`;
        } else if (nearestResistance) {
          pattern.significance *= Math.min(
            this.config.resistanceBoost * 0.75,
            1.3
          );
          pattern.nearLevel = {
            type: "resistance",
            price: nearestResistance.price,
            distance: nearestResistance.distance,
          };
          pattern.description += ` at resistance $${nearestResistance.price.toFixed(
            2
          )}`;
        }
      }
    }
  }

  private isBullishPattern(type: string): boolean {
    return ["Hammer", "BullishEngulfing"].includes(type);
  }

  private isBearishPattern(type: string): boolean {
    return ["ShootingStar", "BearishEngulfing"].includes(type);
  }

  private isNeutralPattern(type: string): boolean {
    return ["Doji"].includes(type);
  }

  private filterPatterns(
    patterns: Pattern[],
    candleCount: number,
    avgVolume: number
  ): Pattern[] {
    // Calculate dynamic limit based on candle count (5% of candles, min 1, max 5)
    const maxPatterns = Math.min(
      5,
      Math.max(1, Math.floor(candleCount * 0.05))
    );

    // Filter by significance and volume
    const filtered = patterns
      .filter((p) => p.significance >= this.config.minSignificance)
      .filter((p) => !p.volume || p.volume >= avgVolume * 0.8); // Remove low-volume patterns

    // Deduplicate patterns at same price level (within 0.2%)
    const deduplicated: Pattern[] = [];
    const priceGroups = new Map<number, Pattern[]>();

    // Group patterns by price level
    for (const pattern of filtered) {
      const priceKey = Math.round(pattern.price / 0.002) * 0.002; // Round to 0.2% buckets
      if (!priceGroups.has(priceKey)) {
        priceGroups.set(priceKey, []);
      }
      priceGroups.get(priceKey)!.push(pattern);
    }

    // Keep only the highest significance pattern from each price group
    for (const group of priceGroups.values()) {
      const best = group.sort((a, b) => b.significance - a.significance)[0];
      deduplicated.push(best);
    }

    // Sort by significance, take top patterns, then re-sort by timestamp (oldest first)
    return deduplicated
      .sort((a, b) => b.significance - a.significance)
      .slice(0, maxPatterns)
      .sort((a, b) => a.candleTimestamps[0] - b.candleTimestamps[0]);
  }
}

export async function fetchSupportResistanceLevels(
  symbol: string,
  apiKey: string
): Promise<{ supports: number[]; resistances: number[] }> {
  try {
    const url = `https://api.spotcanvas.com/v1/market-data/support-resistance-levels`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch support/resistance levels: ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      supports?: number[];
      resistances?: number[];
    };
    return {
      supports: data.supports || [],
      resistances: data.resistances || [],
    };
  } catch (error) {
    console.error("Error fetching support/resistance levels:", error);
    return { supports: [], resistances: [] };
  }
}
