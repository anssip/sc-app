import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface ChartApiInfo {
  id: string;
  api: any;
  symbol?: string;
  granularity?: string;
}

interface ActiveChartContextType {
  activeChartId: string | null;
  chartApis: Map<string, ChartApiInfo>;
  setActiveChart: (chartId: string) => void;
  registerChartApi: (chartId: string, api: any, symbol?: string, granularity?: string) => void;
  unregisterChartApi: (chartId: string) => void;
  getActiveChartApi: () => ChartApiInfo | null;
  getAllChartApis: () => ChartApiInfo[];
}

const ActiveChartContext = createContext<ActiveChartContextType | null>(null);

export function ActiveChartProvider({ children }: { children: ReactNode }) {
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [chartApis, setChartApis] = useState<Map<string, ChartApiInfo>>(new Map());
  const chartApisRef = useRef<Map<string, ChartApiInfo>>(new Map());

  const setActiveChart = useCallback((chartId: string) => {
    setActiveChartId(chartId);
  }, []);

  const registerChartApi = useCallback((chartId: string, api: any, symbol?: string, granularity?: string) => {
    // Update the ref immediately
    chartApisRef.current.set(chartId, { id: chartId, api, symbol, granularity });

    setChartApis(prev => {
      const newMap = new Map(prev);
      newMap.set(chartId, { id: chartId, api, symbol, granularity });
      return newMap;
    });

    // Always set the first registered chart as active
    setActiveChartId(currentActiveId => {
      if (!currentActiveId) {
        return chartId;
      }
      return currentActiveId;
    });
  }, []);

  const unregisterChartApi = useCallback((chartId: string) => {
    // Update the ref immediately
    chartApisRef.current.delete(chartId);

    setChartApis(prev => {
      const newMap = new Map(prev);
      newMap.delete(chartId);
      return newMap;
    });

    // Handle active chart removal
    setActiveChartId(currentActiveId => {
      if (currentActiveId === chartId) {
        const remainingIds = Array.from(chartApisRef.current.keys());
        if (remainingIds.length > 0) {
          const newActiveId = remainingIds[0];
          return newActiveId;
        }
        return null;
      }
      return currentActiveId;
    });
  }, []);

  const getActiveChartApi = useCallback(() => {
    if (!activeChartId) return null;
    return chartApis.get(activeChartId) || null;
  }, [activeChartId, chartApis]);

  const getAllChartApis = useCallback(() => {
    return Array.from(chartApis.values());
  }, [chartApis]);

  const value: ActiveChartContextType = {
    activeChartId,
    chartApis,
    setActiveChart,
    registerChartApi,
    unregisterChartApi,
    getActiveChartApi,
    getAllChartApis
  };

  return (
    <ActiveChartContext.Provider value={value}>
      {children}
    </ActiveChartContext.Provider>
  );
}

export function useActiveChart() {
  const context = useContext(ActiveChartContext);
  if (!context) {
    // Return a default implementation instead of throwing
    return {
      activeChartId: null,
      chartApis: new Map(),
      setActiveChart: () => {},
      registerChartApi: () => {},
      unregisterChartApi: () => {},
      getActiveChartApi: () => null,
      getAllChartApis: () => []
    };
  }
  return context;
}