import { useState, useEffect, useRef } from "react";
import { useAuth } from "~/lib/auth-context";
import {
  getRepository,
  destroyRepository,
  Repository,
} from "~/services/repository";
import type {
  SavedLayout,
  ChartConfig,
  Symbol,
  UserSettings,
  RepositoryEvent,
  RepositoryEventCallback,
} from "~/types";

interface UseRepositoryReturn {
  repository: Repository | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

export function useRepository(): UseRepositoryReturn {
  const { user } = useAuth();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function initializeRepository() {
      if (!user?.email) {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (initializingRef.current) {
        return;
      }

      initializingRef.current = true;

      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const userId = user.email;
        const repo = getRepository(userId);

        await repo.initialize();
        if (mountedRef.current) {
          setRepository(repo);
          setIsOnline(repo.isOnline());
          setIsLoading(false);
          } else {
          }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize repository"
          );
          setIsLoading(false);
        }
      } finally {
        initializingRef.current = false;
        }
    }

    if (user?.email) {
      initializeRepository();
    } else {
      setIsLoading(false);
    }
  }, [user?.email]);

  // Monitor online status
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (repository) {
        repository.sync().catch(() => {});
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [repository]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!user) {
        destroyRepository();
      }
    };
  }, [user]);

  return {
    repository,
    isLoading,
    error,
    isOnline,
  };
}

interface UseLayoutsReturn {
  layouts: SavedLayout[];
  isLoading: boolean;
  error: string | null;
  saveLayout: (
    layout: Omit<SavedLayout, "id" | "createdAt" | "updatedAt">
  ) => Promise<SavedLayout>;
  updateLayout: (
    layoutId: string,
    updates: Partial<SavedLayout>
  ) => Promise<SavedLayout>;
  deleteLayout: (layoutId: string) => Promise<void>;
  getLayout: (layoutId: string) => SavedLayout | null;
}

export function useLayouts(): UseLayoutsReturn {
  const {
    repository,
    isLoading: repoLoading,
    error: repoError,
  } = useRepository();
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || repoLoading) return;

    async function loadLayouts() {
      if (!repository) return;

      try {
        setIsLoading(true);
        setError(null);
        const layouts = await repository.getLayouts();
        setLayouts(layouts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load layouts");
      } finally {
        setIsLoading(false);
      }
    }

    loadLayouts();

    // Listen for layout changes
    const unsubscribe = repository?.addEventListener(
      (event: RepositoryEvent) => {
        if (event.type === "layout_saved" || event.type === "layout_updated") {
          setLayouts((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((l) => l.id === event.data.id);
            if (index >= 0) {
              updated[index] = event.data;
            } else {
              updated.push(event.data);
            }
            return updated;
          });
        } else if (event.type === "layout_deleted") {
          setLayouts((prev) =>
            prev.filter((l) => l.id !== event.data.layoutId)
          );
        }
      }
    );

    return unsubscribe || (() => {});
  }, [repository, repoLoading]);

  const saveLayout = async (
    layoutData: Omit<SavedLayout, "id" | "createdAt" | "updatedAt">
  ): Promise<SavedLayout> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    return await repository.saveLayout(layoutData);
  };

  const updateLayout = async (
    layoutId: string,
    updates: Partial<SavedLayout>
  ): Promise<SavedLayout> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    return await repository.updateLayout(layoutId, updates);
  };

  const deleteLayout = async (layoutId: string): Promise<void> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    await repository.deleteLayout(layoutId);
  };

  const getLayout = (layoutId: string): SavedLayout | null => {
    return layouts.find((l) => l.id === layoutId) || null;
  };

  return {
    layouts,
    isLoading: isLoading || repoLoading,
    error: error || repoError,
    saveLayout,
    updateLayout,
    deleteLayout,
    getLayout,
  };
}

interface UseChartsReturn {
  charts: ChartConfig[];
  isLoading: boolean;
  error: string | null;
  saveChart: (
    chart: Omit<ChartConfig, "id">,
    layoutId?: string
  ) => Promise<ChartConfig>;
  updateChart: (
    chartId: string,
    updates: Partial<ChartConfig>,
    layoutId?: string
  ) => Promise<ChartConfig>;
  deleteChart: (chartId: string, layoutId?: string) => Promise<void>;
  getChart: (chartId: string, layoutId?: string) => ChartConfig | null;
}

export function useCharts(): UseChartsReturn {
  const {
    repository,
    isLoading: repoLoading,
    error: repoError,
  } = useRepository();
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || repoLoading) return;

    // For now, we'll track charts through the repository events
    // In the future, we might want to load all charts if needed
    setCharts([]);
    setIsLoading(false);

    // Listen for chart changes
    const unsubscribe = repository?.addEventListener(
      (event: RepositoryEvent) => {
        if (event.type === "chart_updated") {
          setCharts((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((c) => c.id === event.data.id);
            if (index >= 0) {
              updated[index] = event.data;
            } else {
              updated.push(event.data);
            }
            return updated;
          });
        }
      }
    );

    return unsubscribe || (() => {});
  }, [repository, repoLoading]);

  const saveChart = async (
    chartData: Omit<ChartConfig, "id">,
    layoutId?: string
  ): Promise<ChartConfig> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    return await repository.saveChart(chartData, layoutId || "default");
  };

  const updateChart = async (
    chartId: string,
    updates: Partial<ChartConfig>,
    layoutId?: string
  ): Promise<ChartConfig> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    return await repository.updateChart(
      chartId,
      updates,
      layoutId || "default"
    );
  };

  const deleteChart = async (
    chartId: string,
    layoutId?: string
  ): Promise<void> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    await repository.deleteChart(chartId, layoutId || "default");
  };

  const getChart = (chartId: string, layoutId?: string): ChartConfig | null => {
    // First check local cache
    const cachedChart = charts.find((c) => c.id === chartId);
    if (cachedChart) return cachedChart;

    // Note: Since repository.getChart is async, we can't use it in a sync function
    // The chart should be loaded through layouts or cached already
    return null;
  };

  return {
    charts,
    isLoading: isLoading || repoLoading,
    error: error || repoError,
    saveChart,
    updateChart,
    deleteChart,
    getChart,
  };
}

interface UseSymbolsReturn {
  symbols: Symbol[];
  activeSymbols: Symbol[];
  isLoading: boolean;
  error: string | null;
  getSymbol: (exchangeId: string, symbol: string) => Symbol | null;
}

export function useSymbols(): UseSymbolsReturn {
  const { user } = useAuth();
  const {
    repository,
    isLoading: repoLoading,
    error: repoError,
  } = useRepository();
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default symbols for preview mode (non-authenticated users)
  const DEFAULT_PREVIEW_SYMBOLS: Symbol[] = [
    {
      id: "coinbase:BTC-USD",
      exchangeId: "coinbase",
      symbol: "BTC-USD",
      baseAsset: "BTC",
      quoteAsset: "USD",
      displayName: "Bitcoin",
      active: true,
      minOrderSize: 0.00001,
      maxOrderSize: 10000,
      tickSize: 0.01,
      status: "online",
      tradingDisabled: false,
      auctionMode: false,
      productType: "SPOT",
      quoteCurrencyId: "USD",
      baseCurrencyId: "BTC",
      fcmTradingSessionDetails: null,
      midMarketPrice: "",
    },
    {
      id: "coinbase:ETH-USD",
      exchangeId: "coinbase",
      symbol: "ETH-USD",
      baseAsset: "ETH",
      quoteAsset: "USD",
      displayName: "Ethereum",
      active: true,
      minOrderSize: 0.0001,
      maxOrderSize: 10000,
      tickSize: 0.01,
      status: "online",
      tradingDisabled: false,
      auctionMode: false,
      productType: "SPOT",
      quoteCurrencyId: "USD",
      baseCurrencyId: "ETH",
      fcmTradingSessionDetails: null,
      midMarketPrice: "",
    },
    {
      id: "coinbase:SOL-USD",
      exchangeId: "coinbase",
      symbol: "SOL-USD",
      baseAsset: "SOL",
      quoteAsset: "USD",
      displayName: "Solana",
      active: true,
      minOrderSize: 0.001,
      maxOrderSize: 10000,
      tickSize: 0.01,
      status: "online",
      tradingDisabled: false,
      auctionMode: false,
      productType: "SPOT",
      quoteCurrencyId: "USD",
      baseCurrencyId: "SOL",
      fcmTradingSessionDetails: null,
      midMarketPrice: "",
    },
    {
      id: "coinbase:DOGE-USD",
      exchangeId: "coinbase",
      symbol: "DOGE-USD",
      baseAsset: "DOGE",
      quoteAsset: "USD",
      displayName: "Dogecoin",
      active: true,
      minOrderSize: 1,
      maxOrderSize: 10000000,
      tickSize: 0.00001,
      status: "online",
      tradingDisabled: false,
      auctionMode: false,
      productType: "SPOT",
      quoteCurrencyId: "USD",
      baseCurrencyId: "DOGE",
      fcmTradingSessionDetails: null,
      midMarketPrice: "",
    },
  ];

  useEffect(() => {
    // If no user (preview mode), use default symbols
    if (!user) {
      setSymbols(DEFAULT_PREVIEW_SYMBOLS);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!repository || repoLoading) {
      return;
    }

    async function loadSymbols() {
      if (!repository) return;

      try {
        setIsLoading(true);
        setError(null);
        const symbols = await repository.getSymbols();
        setSymbols(symbols);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load symbols");
      } finally {
        setIsLoading(false);
        }
    }

    loadSymbols();
  }, [user, repository, repoLoading]);

  const activeSymbols = symbols.filter((symbol) => symbol.active);

  const getSymbol = (exchangeId: string, symbol: string): Symbol | null => {
    return (
      symbols.find((s) => s.exchangeId === exchangeId && s.symbol === symbol) ||
      null
    );
  };

  return {
    symbols,
    activeSymbols,
    isLoading: user ? (isLoading || repoLoading) : false,
    error: user ? (error || repoError) : null,
    getSymbol,
  };
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;
  setActiveLayout: (layoutId: string | null) => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const {
    repository,
    isLoading: repoLoading,
    error: repoError,
  } = useRepository();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || repoLoading) return;

    async function loadSettings() {
      if (!repository) return;

      try {
        setIsLoading(true);
        setError(null);
        const settings = await repository.getSettings();
        setSettings(settings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load user settings"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [repository, repoLoading]);

  const updateSettings = async (
    updates: Partial<UserSettings>
  ): Promise<UserSettings> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    const updated = await repository.updateSettings(updates);
    setSettings(updated);
    return updated;
  };

  const setActiveLayout = async (layoutId: string | null): Promise<void> => {
    if (!repository) {
      throw new Error("Repository not available");
    }
    await repository.setActiveLayout(layoutId);
    // Update local state immediately
    setSettings((prev) =>
      prev ? { ...prev, activeLayoutId: layoutId } : null
    );
  };

  return {
    settings,
    isLoading: isLoading || repoLoading,
    error: error || repoError,
    updateSettings,
    setActiveLayout,
  };
}
