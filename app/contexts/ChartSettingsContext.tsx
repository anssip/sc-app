import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type { Granularity } from "@anssipiirainen/sc-charts";

export interface IndicatorConfig {
  id: string;
  name: string;
  display: string;
  visible: boolean;
  params?: any;
  scale?: string;
  className?: string;
}

export interface ChartSettings {
  symbol: string;
  granularity: Granularity;
  indicators: IndicatorConfig[];
  // Future settings can be added here:
  // theme?: string;
  // timezone?: string;
}

export interface ChartSettingsContextValue {
  // Current settings
  settings: ChartSettings;

  // Update methods
  setSymbol: (symbol: string, chartId?: string) => void;
  setGranularity: (granularity: Granularity, chartId?: string) => void;
  setIndicators: (indicators: IndicatorConfig[], chartId?: string) => void;
  setSettings: (settings: Partial<ChartSettings>, chartId?: string) => void;

  // Chart registration (for multi-chart support)
  registerChart: (chartId: string, initialSettings: ChartSettings) => void;
  unregisterChart: (chartId: string) => void;
  getChartSettings: (chartId: string) => ChartSettings | undefined;

  // Event handlers for persistence
  onSettingsChange?: (settings: ChartSettings, chartId?: string) => void;
}

const ChartSettingsContext = createContext<
  ChartSettingsContextValue | undefined
>(undefined);

export interface ChartSettingsProviderProps {
  children: React.ReactNode;
  initialSettings?: ChartSettings;
  onSettingsChange?: (settings: ChartSettings, chartId?: string) => void;
}

const DEFAULT_SETTINGS: ChartSettings = {
  symbol: "BTC-USD",
  granularity: "ONE_HOUR",
  indicators: [],
};

export const ChartSettingsProvider: React.FC<ChartSettingsProviderProps> = ({
  children,
  initialSettings = DEFAULT_SETTINGS,
  onSettingsChange,
}) => {
  // Global settings (for single chart or default)
  const [settings, setSettingsState] = useState<ChartSettings>(initialSettings);

  // Per-chart settings for multi-chart support
  const chartSettingsRef = useRef<Map<string, ChartSettings>>(new Map());
  const [, forceUpdate] = useState({});

  // Force component re-render when chart settings change
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const setSymbol = useCallback(
    (symbol: string, chartId?: string) => {
      if (chartId) {
        const currentSettings = chartSettingsRef.current.get(chartId) || {
          ...settings,
        };
        const newSettings = { ...currentSettings, symbol };
        chartSettingsRef.current.set(chartId, newSettings);
        onSettingsChange?.(newSettings, chartId);
        triggerUpdate();
      } else {
        const newSettings = { ...settings, symbol };
        setSettingsState(newSettings);
        onSettingsChange?.(newSettings);
      }
    },
    [settings, onSettingsChange, triggerUpdate]
  );

  const setGranularity = useCallback(
    (granularity: Granularity, chartId?: string) => {
      if (chartId) {
        const currentSettings = chartSettingsRef.current.get(chartId) || {
          ...settings,
        };
        const newSettings = { ...currentSettings, granularity };
        chartSettingsRef.current.set(chartId, newSettings);
        onSettingsChange?.(newSettings, chartId);
        triggerUpdate();
      } else {
        const newSettings = { ...settings, granularity };
        setSettingsState(newSettings);
        onSettingsChange?.(newSettings);
      }
    },
    [settings, onSettingsChange, triggerUpdate]
  );

  const setIndicators = useCallback(
    (indicators: IndicatorConfig[], chartId?: string) => {
      if (chartId) {
        const currentSettings = chartSettingsRef.current.get(chartId) || {
          ...settings,
        };
        const newSettings = { ...currentSettings, indicators };
        chartSettingsRef.current.set(chartId, newSettings);
        onSettingsChange?.(newSettings, chartId);
        triggerUpdate();
      } else {
        const newSettings = { ...settings, indicators };
        setSettingsState(newSettings);
        onSettingsChange?.(newSettings);
      }
    },
    [settings, onSettingsChange, triggerUpdate]
  );

  const setSettings = useCallback(
    (partialSettings: Partial<ChartSettings>, chartId?: string) => {
      if (chartId) {
        const currentSettings = chartSettingsRef.current.get(chartId) || {
          ...settings,
        };
        const newSettings = { ...currentSettings, ...partialSettings };
        chartSettingsRef.current.set(chartId, newSettings);
        onSettingsChange?.(newSettings, chartId);
        triggerUpdate();
      } else {
        const newSettings = { ...settings, ...partialSettings };
        setSettingsState(newSettings);
        onSettingsChange?.(newSettings);
      }
    },
    [settings, onSettingsChange, triggerUpdate]
  );

  const registerChart = useCallback(
    (chartId: string, initialSettings: ChartSettings) => {
      chartSettingsRef.current.set(chartId, initialSettings);
      triggerUpdate();
    },
    [triggerUpdate]
  );

  const unregisterChart = useCallback(
    (chartId: string) => {
      chartSettingsRef.current.delete(chartId);
      triggerUpdate();
    },
    [triggerUpdate]
  );

  const getChartSettings = useCallback(
    (chartId: string): ChartSettings | undefined => {
      return chartSettingsRef.current.get(chartId);
    },
    []
  );

  const contextValue: ChartSettingsContextValue = useMemo(
    () => ({
      settings,
      setSymbol,
      setGranularity,
      setIndicators,
      setSettings,
      registerChart,
      unregisterChart,
      getChartSettings,
      onSettingsChange,
    }),
    [
      settings,
      setSymbol,
      setGranularity,
      setIndicators,
      setSettings,
      registerChart,
      unregisterChart,
      getChartSettings,
      onSettingsChange,
    ]
  );

  return (
    <ChartSettingsContext.Provider value={contextValue}>
      {children}
    </ChartSettingsContext.Provider>
  );
};

export interface UseChartSettingsReturn {
  settings: ChartSettings;
  setSymbol: (symbol: string) => void;
  setGranularity: (granularity: Granularity) => void;
  setIndicators: (indicators: IndicatorConfig[]) => void;
  setSettings: (settings: Partial<ChartSettings>) => void;
  registerChart: (
    chartIdOrInitialSettings: string | ChartSettings,
    initialSettings?: ChartSettings
  ) => void;
  unregisterChart: (chartId?: string) => void;
  getChartSettings?: (chartId: string) => ChartSettings | undefined;
  chartId?: string;
}

export const useChartSettings = (chartId?: string): UseChartSettingsReturn => {
  const context = useContext(ChartSettingsContext);

  if (!context) {
    throw new Error(
      "useChartSettings must be used within a ChartSettingsProvider"
    );
  }

  // If chartId is provided, return chart-specific settings and methods
  if (chartId) {
    const chartSettings = context.getChartSettings(chartId) || context.settings;

    return {
      settings: chartSettings,
      setSymbol: (symbol: string) => context.setSymbol(symbol, chartId),
      setGranularity: (granularity: Granularity) =>
        context.setGranularity(granularity, chartId),
      setIndicators: (indicators: IndicatorConfig[]) =>
        context.setIndicators(indicators, chartId),
      setSettings: (settings: Partial<ChartSettings>) =>
        context.setSettings(settings, chartId),
      registerChart: (
        chartIdOrInitialSettings: string | ChartSettings,
        initialSettings?: ChartSettings
      ) => {
        if (typeof chartIdOrInitialSettings === "string") {
          context.registerChart(
            chartIdOrInitialSettings,
            initialSettings || context.settings
          );
        } else {
          context.registerChart(chartId, chartIdOrInitialSettings);
        }
      },
      unregisterChart: (targetChartId?: string) =>
        context.unregisterChart(targetChartId || chartId),
      chartId,
    };
  }

  // Return global settings and methods
  return {
    settings: context.settings,
    setSymbol: context.setSymbol,
    setGranularity: context.setGranularity,
    setIndicators: context.setIndicators,
    setSettings: context.setSettings,
    registerChart: (
      chartIdOrInitialSettings: string | ChartSettings,
      initialSettings?: ChartSettings
    ) => {
      if (typeof chartIdOrInitialSettings === "string") {
        context.registerChart(
          chartIdOrInitialSettings,
          initialSettings || context.settings
        );
      } else {
        throw new Error(
          "When using global chart settings, registerChart requires a chartId as the first parameter"
        );
      }
    },
    unregisterChart: (targetChartId?: string) => {
      if (targetChartId) {
        context.unregisterChart(targetChartId);
      }
    },
    getChartSettings: context.getChartSettings,
  };
};
