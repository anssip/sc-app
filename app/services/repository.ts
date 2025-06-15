import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "~/lib/firebase";
import type {
  IRepository,
  SavedLayout,
  ChartConfig,
  Symbol,
  UserSettings,
  Candle,
  Granularity,
  RepositoryEvent,
  RepositoryEventCallback,
} from "~/types";
import { RepositoryError, NetworkError, ValidationError } from "~/types";

export class Repository implements IRepository {
  private userId: string;
  private isInitialized = false;
  private eventCallbacks: RepositoryEventCallback[] = [];

  // Client-side caches
  private layoutsCache = new Map<string, SavedLayout>();
  private chartsCache = new Map<string, ChartConfig>();
  private symbolsCache = new Map<string, Symbol>();
  private userSettingsCache: UserSettings | null = null;
  private candlesCache = new Map<string, Candle>();

  // Firestore listeners
  private unsubscribes: Unsubscribe[] = [];

  // Sync queue for offline operations
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Repository already initialized, skipping");
      return;
    }

    console.log("Repository: Starting initialization for user:", this.userId);

    try {
      // Load initial data from Firestore
      console.log("Repository: Loading initial data...");
      await Promise.all([
        this.loadLayouts(),
        this.loadCharts(),
        this.loadSymbols(),
        this.loadUserSettings(),
      ]);

      // Set up real-time listeners
      console.log("Repository: Setting up real-time listeners...");
      this.setupRealtimeListeners();

      this.isInitialized = true;
      console.log("Repository initialized successfully");
      console.log(
        `Repository stats: ${this.layoutsCache.size} layouts, ${this.chartsCache.size} charts, ${this.symbolsCache.size} symbols`
      );
    } catch (error) {
      console.error("Failed to initialize repository:", error);
      throw new RepositoryError(
        "Failed to initialize repository",
        "INIT_ERROR",
        error
      );
    }
  }

  // Layout Management
  async getLayouts(): Promise<SavedLayout[]> {
    this.ensureInitialized();
    return Array.from(this.layoutsCache.values());
  }

  async getLayout(layoutId: string): Promise<SavedLayout | null> {
    this.ensureInitialized();
    return this.layoutsCache.get(layoutId) || null;
  }

  async saveLayout(
    layoutData: Omit<SavedLayout, "id" | "createdAt" | "updatedAt">
  ): Promise<SavedLayout> {
    this.ensureInitialized();

    const layoutId = this.generateId();
    const now = new Date();

    const layout: SavedLayout = {
      ...layoutData,
      id: layoutId,
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
    };

    // Validate layout
    this.validateLayout(layout);

    // Store in cache immediately
    this.layoutsCache.set(layoutId, layout);

    // Queue for async sync
    this.queueSync(async () => {
      const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
      await setDoc(layoutRef, {
        ...layout,
        createdAt: Timestamp.fromDate(layout.createdAt),
        updatedAt: Timestamp.fromDate(layout.updatedAt),
      });
    });

    this.emitEvent("layout_saved", layout);
    return layout;
  }

  async updateLayout(
    layoutId: string,
    updates: Partial<SavedLayout>
  ): Promise<SavedLayout> {
    this.ensureInitialized();

    const existingLayout = this.layoutsCache.get(layoutId);
    if (!existingLayout) {
      throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
    }

    const updatedLayout: SavedLayout = {
      ...existingLayout,
      ...updates,
      id: layoutId, // Ensure ID doesn't change
      userId: this.userId, // Ensure userId doesn't change
      updatedAt: new Date(),
    };

    // Validate updated layout
    this.validateLayout(updatedLayout);

    // Store in cache immediately
    this.layoutsCache.set(layoutId, updatedLayout);

    // Queue for async sync
    this.queueSync(async () => {
      const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
      await updateDoc(layoutRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(updatedLayout.updatedAt),
      });
    });

    this.emitEvent("layout_updated", updatedLayout);
    return updatedLayout;
  }

  async deleteLayout(layoutId: string): Promise<void> {
    this.ensureInitialized();

    if (!this.layoutsCache.has(layoutId)) {
      throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
    }

    // Remove from cache immediately
    this.layoutsCache.delete(layoutId);

    // Queue for async sync
    this.queueSync(async () => {
      const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
      await deleteDoc(layoutRef);
    });

    this.emitEvent("layout_deleted", { layoutId });
  }

  // Chart Management
  async getChart(chartId: string): Promise<ChartConfig | null> {
    this.ensureInitialized();

    // First check cache
    const cachedChart = this.chartsCache.get(chartId);
    if (cachedChart) {
      return cachedChart;
    }

    // If not in cache, try to load from Firestore
    try {
      const chartRef = doc(db, "settings", this.userId, "charts", chartId);
      const chartSnap = await getDoc(chartRef);

      if (chartSnap.exists()) {
        const chartData = chartSnap.data() as ChartConfig;
        const chart: ChartConfig = {
          ...chartData,
          id: chartId, // Ensure ID is set correctly
        };

        // Store in cache for future use
        this.chartsCache.set(chartId, chart);
        console.log(`Loaded chart ${chartId} from Firestore:`, chart.symbol);
        return chart;
      }
    } catch (error) {
      console.error(`Failed to load chart ${chartId} from Firestore:`, error);
    }

    return null;
  }

  async saveChart(chartData: Omit<ChartConfig, "id">): Promise<ChartConfig> {
    this.ensureInitialized();

    const chartId = this.generateId();
    const chart: ChartConfig = {
      ...chartData,
      id: chartId,
    };

    // Validate chart
    this.validateChart(chart);

    // Store in cache immediately
    this.chartsCache.set(chartId, chart);

    // Queue for async sync
    this.queueSync(async () => {
      const chartRef = doc(db, "settings", this.userId, "charts", chartId);
      await setDoc(chartRef, chart);
    });

    this.emitEvent("chart_updated", chart);
    return chart;
  }

  async updateChart(
    chartId: string,
    updates: Partial<ChartConfig>
  ): Promise<ChartConfig> {
    this.ensureInitialized();

    const existingChart = this.chartsCache.get(chartId);
    if (!existingChart) {
      throw new RepositoryError("Chart not found", "NOT_FOUND", { chartId });
    }

    const updatedChart: ChartConfig = {
      ...existingChart,
      ...updates,
      id: chartId, // Ensure ID doesn't change
    };

    // Validate updated chart
    this.validateChart(updatedChart);

    // Store in cache immediately
    this.chartsCache.set(chartId, updatedChart);

    // Queue for async sync
    this.queueSync(async () => {
      const chartRef = doc(db, "settings", this.userId, "charts", chartId);
      await updateDoc(chartRef, updates);
    });

    this.emitEvent("chart_updated", updatedChart);
    return updatedChart;
  }

  async deleteChart(chartId: string): Promise<void> {
    this.ensureInitialized();

    if (!this.chartsCache.has(chartId)) {
      throw new RepositoryError("Chart not found", "NOT_FOUND", { chartId });
    }

    // Remove from cache immediately
    this.chartsCache.delete(chartId);

    // Queue for async sync
    this.queueSync(async () => {
      const chartRef = doc(db, "settings", this.userId, "charts", chartId);
      await deleteDoc(chartRef);
    });
  }

  // Symbol Management
  async getSymbols(): Promise<Symbol[]> {
    this.ensureInitialized();
    return Array.from(this.symbolsCache.values());
  }

  async getActiveSymbols(): Promise<Symbol[]> {
    this.ensureInitialized();
    return Array.from(this.symbolsCache.values()).filter(
      (symbol) => symbol.active
    );
  }

  async getSymbol(exchangeId: string, symbol: string): Promise<Symbol | null> {
    this.ensureInitialized();
    const key = `${exchangeId}:${symbol}`;
    return this.symbolsCache.get(key) || null;
  }

  // Live price data
  async getCandle(
    exchangeId: string,
    symbol: string,
    granularity: Granularity
  ): Promise<Candle | null> {
    this.ensureInitialized();
    const key = `${exchangeId}:${symbol}:${granularity}`;
    return this.candlesCache.get(key) || null;
  }

  subscribeToCandle(
    exchangeId: string,
    symbol: string,
    granularity: Granularity,
    callback: (candle: Candle) => void
  ): () => void {
    this.ensureInitialized();

    const candleRef = doc(
      db,
      "exchanges",
      exchangeId,
      "products",
      symbol,
      "intervals",
      granularity
    );

    const unsubscribe = onSnapshot(candleRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const candle: Candle = {
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
          timestamp: data.timestamp,
          lastUpdate: data.lastUpdate.toDate(),
        };

        // Update cache
        const key = `${exchangeId}:${symbol}:${granularity}`;
        this.candlesCache.set(key, candle);

        callback(candle);
      }
    });

    this.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }

  // User Settings
  async getSettings(): Promise<UserSettings | null> {
    this.ensureInitialized();
    return this.userSettingsCache;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    this.ensureInitialized();

    const updatedSettings: UserSettings = {
      ...this.userSettingsCache,
      ...settings,
      userId: this.userId, // Ensure userId doesn't change
    };

    // Store in cache immediately
    this.userSettingsCache = updatedSettings;

    // Queue for async sync
    this.queueSync(async () => {
      const settingsRef = doc(db, "settings", this.userId);
      await setDoc(settingsRef, updatedSettings, { merge: true });
    });

    return updatedSettings;
  }

  // General repository methods
  async sync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      // Process sync queue
      while (this.syncQueue.length > 0) {
        const syncOperation = this.syncQueue.shift();
        if (syncOperation) {
          await syncOperation();
        }
      }

      console.log("Repository sync completed");
    } catch (error) {
      console.error("Repository sync failed:", error);
      throw new NetworkError("Sync failed", error);
    } finally {
      this.isSyncing = false;
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Event system
  addEventListener(callback: RepositoryEventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  // Private methods
  private async loadLayouts(): Promise<void> {
    try {
      const layoutsRef = collection(db, "settings", this.userId, "layouts");
      const layoutsSnapshot = await getDocs(layoutsRef);

      layoutsSnapshot.forEach((doc) => {
        const data = doc.data();
        const layout: SavedLayout = {
          id: doc.id,
          name: data.name,
          userId: data.userId,
          layout: data.layout,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
        this.layoutsCache.set(doc.id, layout);
      });

      console.log(`Loaded ${this.layoutsCache.size} layouts`);
    } catch (error) {
      console.error("Failed to load layouts:", error);
    }
  }

  private async loadCharts(): Promise<void> {
    try {
      const chartsRef = collection(db, "settings", this.userId, "charts");
      const chartsSnapshot = await getDocs(chartsRef);

      chartsSnapshot.forEach((doc) => {
        const chart = doc.data() as ChartConfig;
        this.chartsCache.set(doc.id, chart);
      });

      console.log(`Loaded ${this.chartsCache.size} charts`);
    } catch (error) {
      console.error("Failed to load charts:", error);
    }
  }

  private async loadSymbols(): Promise<void> {
    console.log("Repository.loadSymbols: Starting symbol loading process...");

    try {
      console.log(
        "Repository.loadSymbols: Starting to load symbols from Firestore..."
      );

      // Direct approach: Load products from known exchanges
      // Since we know coinbase has products, load them directly
      const knownExchanges = ["coinbase"]; // Add more exchanges as needed

      for (const exchangeId of knownExchanges) {
        console.log(
          `Repository.loadSymbols: Loading products for exchange: ${exchangeId}`
        );

        try {
          const productsRef = collection(
            db,
            "exchanges",
            exchangeId,
            "products"
          );
          console.log(
            `Repository.loadSymbols: Fetching documents from path: exchanges/${exchangeId}/products`
          );

          const productsSnapshot = await getDocs(productsRef);

          console.log(
            `Repository.loadSymbols: Found ${productsSnapshot.docs.length} products in ${exchangeId}`
          );

          if (productsSnapshot.empty) {
            console.warn(
              `Repository.loadSymbols: No products found for exchange: ${exchangeId}`
            );
            continue;
          }

          let activeCount = 0;
          let usdCount = 0;

          productsSnapshot.forEach((productDoc) => {
            try {
              const data = productDoc.data();

              const symbol: Symbol = {
                id: productDoc.id,
                exchangeId: exchangeId,
                symbol: productDoc.id,
                baseAsset: data.baseAsset || "",
                quoteAsset: data.quoteAsset || "",
                active: this.isSymbolActive(data.lastUpdate),
                lastUpdate: data.lastUpdate?.toDate(),
              };

              const key = `${exchangeId}:${productDoc.id}`;
              this.symbolsCache.set(key, symbol);

              if (symbol.active) activeCount++;
              if (symbol.quoteAsset === "USD") usdCount++;
            } catch (productError) {
              console.error(
                `Repository.loadSymbols: Error processing product ${productDoc.id}:`,
                productError
              );
            }
          });

          console.log(
            `Repository.loadSymbols: Exchange ${exchangeId}: ${activeCount} active symbols, ${usdCount} USD pairs`
          );
        } catch (exchangeError) {
          console.error(
            `Repository.loadSymbols: Error loading products for exchange ${exchangeId}:`,
            exchangeError
          );
        }
      }

      const totalSymbols = this.symbolsCache.size;
      const activeSymbols = Array.from(this.symbolsCache.values()).filter(
        (s) => s.active
      ).length;
      const usdSymbols = Array.from(this.symbolsCache.values()).filter(
        (s) => s.quoteAsset === "USD"
      ).length;
      const activeUsdSymbols = Array.from(this.symbolsCache.values()).filter(
        (s) => s.active && s.quoteAsset === "USD"
      ).length;

      console.log(
        `Repository.loadSymbols: Successfully loaded ${totalSymbols} symbols into cache`
      );
      console.log(`Repository.loadSymbols: Active symbols: ${activeSymbols}`);
      console.log(`Repository.loadSymbols: USD symbols: ${usdSymbols}`);
      console.log(
        `Repository.loadSymbols: Active USD symbols: ${activeUsdSymbols}`
      );

      // Show some sample symbols for debugging
      const sampleSymbols = Array.from(this.symbolsCache.values()).slice(0, 5);
      console.log(
        "Repository.loadSymbols: Sample symbols:",
        sampleSymbols.map((s) => `${s.symbol} (active: ${s.active})`)
      );
    } catch (error) {
      console.error("Repository.loadSymbols: Failed to load symbols:", error);
      // Log the specific error details
      if (error instanceof Error) {
        console.error("Repository.loadSymbols: Error message:", error.message);
        console.error("Repository.loadSymbols: Error stack:", error.stack);
      }
    }
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const settingsRef = doc(db, "settings", this.userId);
      const settingsSnapshot = await getDoc(settingsRef);

      if (settingsSnapshot.exists()) {
        this.userSettingsCache = settingsSnapshot.data() as UserSettings;
      } else {
        // Create default settings
        this.userSettingsCache = {
          userId: this.userId,
          theme: "dark",
          defaultGranularity: "ONE_HOUR",
          defaultSymbol: "BTC-USD",
        };
      }

      console.log("Loaded user settings");
    } catch (error) {
      console.error("Failed to load user settings:", error);
    }
  }

  private setupRealtimeListeners(): void {
    // Listen to layout changes
    const layoutsRef = collection(db, "settings", this.userId, "layouts");
    const layoutsUnsubscribe = onSnapshot(layoutsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const layout: SavedLayout = {
          id: change.doc.id,
          name: data.name,
          userId: data.userId,
          layout: data.layout,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };

        if (change.type === "added" || change.type === "modified") {
          this.layoutsCache.set(change.doc.id, layout);
        } else if (change.type === "removed") {
          this.layoutsCache.delete(change.doc.id);
        }
      });
    });

    this.unsubscribes.push(layoutsUnsubscribe);

    // Listen to chart changes
    const chartsRef = collection(db, "settings", this.userId, "charts");
    const chartsUnsubscribe = onSnapshot(chartsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const chart = change.doc.data() as ChartConfig;

        if (change.type === "added" || change.type === "modified") {
          this.chartsCache.set(change.doc.id, chart);
        } else if (change.type === "removed") {
          this.chartsCache.delete(change.doc.id);
        }
      });
    });

    this.unsubscribes.push(chartsUnsubscribe);
  }

  private queueSync(operation: () => Promise<void>): void {
    this.syncQueue.push(operation);

    // Auto-sync if online
    if (this.isOnline() && !this.isSyncing) {
      setTimeout(() => this.sync(), 100);
    }
  }

  private emitEvent(type: RepositoryEvent["type"], data: any): void {
    const event: RepositoryEvent = {
      type,
      data,
      timestamp: new Date(),
    };

    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in repository event callback:", error);
      }
    });
  }

  private validateLayout(layout: SavedLayout): void {
    if (!layout.name || layout.name.trim().length === 0) {
      throw new ValidationError("Layout name is required");
    }

    if (!layout.layout) {
      throw new ValidationError("Layout structure is required");
    }

    // Validate layout structure recursively
    this.validateLayoutNode(layout.layout);
  }

  private validateLayoutNode(node: any): void {
    if (!node.type || !["split", "chart"].includes(node.type)) {
      throw new ValidationError("Invalid layout node type");
    }

    if (node.type === "split") {
      if (
        !node.direction ||
        !["horizontal", "vertical"].includes(node.direction)
      ) {
        throw new ValidationError("Invalid split direction");
      }

      if (typeof node.ratio !== "number" || node.ratio < 0 || node.ratio > 1) {
        throw new ValidationError("Invalid split ratio");
      }

      if (!Array.isArray(node.children) || node.children.length === 0) {
        throw new ValidationError("Split node must have children");
      }

      node.children.forEach((child: any) => this.validateLayoutNode(child));
    } else if (node.type === "chart") {
      if (!node.id || typeof node.id !== "string") {
        throw new ValidationError("Chart node must have a valid ID");
      }
    }
  }

  private validateChart(chart: ChartConfig): void {
    if (!chart.symbol || typeof chart.symbol !== "string") {
      throw new ValidationError("Chart symbol is required");
    }

    if (!chart.granularity) {
      throw new ValidationError("Chart granularity is required");
    }
  }

  private isSymbolActive(lastUpdate?: any): boolean {
    // For now, be more lenient with symbol activity
    // In production, you might want to check if lastUpdate is recent
    if (!lastUpdate) return true; // Default to active if no lastUpdate

    const updateTime = lastUpdate.toDate ? lastUpdate.toDate() : lastUpdate;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days instead of 1 hour

    return updateTime > weekAgo;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new RepositoryError(
        "Repository not initialized. Call initialize() first.",
        "NOT_INITIALIZED"
      );
    }
  }

  // Cleanup
  destroy(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
    this.eventCallbacks = [];
    this.layoutsCache.clear();
    this.chartsCache.clear();
    this.symbolsCache.clear();
    this.candlesCache.clear();
    this.userSettingsCache = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let repositoryInstance: Repository | null = null;

export function getRepository(userId: string): Repository {
  if (!repositoryInstance || repositoryInstance["userId"] !== userId) {
    repositoryInstance?.destroy();
    repositoryInstance = new Repository(userId);
  }
  return repositoryInstance;
}

export function destroyRepository(): void {
  if (repositoryInstance) {
    repositoryInstance.destroy();
    repositoryInstance = null;
  }
}
