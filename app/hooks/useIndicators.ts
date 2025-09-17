import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { IndicatorConfig } from "~/contexts/ChartSettingsContext";

interface UseIndicatorsReturn {
  indicators: IndicatorConfig[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useIndicators = (firestore?: Firestore): UseIndicatorsReturn => {
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = async () => {
    if (!firestore) {
      setError("Firestore not available");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const indicatorsRef = collection(firestore, "indicators");
      const q = query(indicatorsRef, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);

      const loadedIndicators: IndicatorConfig[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedIndicators.push({
          id: doc.id,
          name: data.name || doc.id,
          display: data.display || "Overlay",
          visible: data.visible || false,
          params: data.params || {},
          scale: data.scale || "Price",
          className: data.className || "MarketIndicator",
        });
      });

      setIndicators(loadedIndicators);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load indicators";
      setError(errorMessage);
      // Use fallback indicators when Firestore fails
      const fallbackIndicators: IndicatorConfig[] = [
        {
          id: "volume",
          name: "Volume",
          display: "Bottom",
          visible: false,
          params: {},
          scale: "Value",
          className: "VolumeIndicator",
        },
        {
          id: "rsi",
          name: "RSI",
          display: "Bottom",
          visible: false,
          params: { period: 14 },
          scale: "Value",
          className: "RSIIndicator",
        },
        {
          id: "macd",
          name: "MACD",
          display: "Bottom",
          visible: false,
          params: { fast: 12, slow: 26, signal: 9 },
          scale: "Value",
          className: "MACDIndicator",
        },
        {
          id: "bollinger-bands",
          name: "Bollinger Bands",
          display: "Overlay",
          visible: false,
          params: { period: 20, stdDev: 2 },
          scale: "Price",
          className: "BollingerBandsIndicator",
        },
        {
          id: "moving-average-20",
          name: "Moving Average (20)",
          display: "Overlay",
          visible: false,
          params: { period: 20, type: "sma" },
          scale: "Price",
          className: "MovingAverageIndicator",
        },
        {
          id: "moving-average-50",
          name: "Moving Average (50)",
          display: "Overlay",
          visible: false,
          params: { period: 50, type: "sma" },
          scale: "Price",
          className: "MovingAverageIndicator",
        },
        {
          id: "ema-12",
          name: "EMA (12)",
          display: "Overlay",
          visible: false,
          params: { period: 12, type: "ema" },
          scale: "Price",
          className: "MovingAverageIndicator",
        },
        {
          id: "stochastic",
          name: "Stochastic",
          display: "Bottom",
          visible: false,
          params: { kPeriod: 14, dPeriod: 3, smooth: 3 },
          scale: "Value",
          className: "StochasticIndicator",
        },
      ];

      setIndicators(fallbackIndicators);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, [firestore]);

  return {
    indicators,
    isLoading,
    error,
    refetch: fetchIndicators,
  };
};
