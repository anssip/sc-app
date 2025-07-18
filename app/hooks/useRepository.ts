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
      console.log("useRepository: initializeRepository called", {
        userEmail: user?.email,
        isInitializing: initializingRef.current,
        mounted: mountedRef.current,
      });

      if (!user?.email) {
        console.log("useRepository: No user email, setting isLoading to false");
        if (mountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      if (initializingRef.current) {
        console.log("useRepository: Already initializing, skipping");
        return;
      }

      console.log("useRepository: Starting repository initialization");
      initializingRef.current = true;

      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const userId = user.email;
        const repo = getRepository(userId);

        console.log("useRepository: Calling repo.initialize()");
        await repo.initialize();
        console.log("useRepository: Repository initialized successfully");

        console.log(
          "useRepository: Checking mounted state:",
          mountedRef.current
        );
        if (mountedRef.current) {
          console.log("useRepository: Setting repository and isOnline");
          setRepository(repo);
          setIsOnline(repo.isOnline());
          setIsLoading(false);
          console.log("useRepository: Repository state updated successfully");
        } else {
          console.log(
            "useRepository: Component unmounted, skipping state update"
          );
        }
      } catch (err) {
        console.error("Failed to initialize repository:", err);
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
        console.log("useRepository: Initialization completed");
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
        repository.sync().catch(console.error);
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

  console.log("useRepository: Returning state", {
    hasRepository: !!repository,
    isLoading,
    error,
    isOnline,
    userEmail: user?.email,
  });

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
        console.error("Failed to load layouts:", err);
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
  const {
    repository,
    isLoading: repoLoading,
    error: repoError,
  } = useRepository();
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useSymbols: Effect triggered", {
      hasRepository: !!repository,
      repoLoading,
      repoError,
    });

    if (!repository || repoLoading) {
      console.log("useSymbols: Repository not ready, skipping symbol loading");
      return;
    }

    async function loadSymbols() {
      if (!repository) return;

      console.log("useSymbols: Starting to load symbols...");
      try {
        setIsLoading(true);
        setError(null);
        console.log("useSymbols: Calling repository.getSymbols()");
        const symbols = await repository.getSymbols();
        console.log("useSymbols: Got symbols from repository:", symbols.length);
        setSymbols(symbols);
      } catch (err) {
        console.error("useSymbols: Failed to load symbols:", err);
        setError(err instanceof Error ? err.message : "Failed to load symbols");
      } finally {
        setIsLoading(false);
        console.log("useSymbols: Loading complete");
      }
    }

    loadSymbols();
  }, [repository, repoLoading]);

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
    isLoading: isLoading || repoLoading,
    error: error || repoError,
    getSymbol,
  };
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;
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
        console.error("Failed to load user settings:", err);
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

  return {
    settings,
    isLoading: isLoading || repoLoading,
    error: error || repoError,
    updateSettings,
  };
}
