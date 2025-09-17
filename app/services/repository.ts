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
  Unsubscribe,
  Timestamp,
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
  LayoutNode,
  ChartLayoutNode,
  SplitLayoutNode,
  TrendLine,
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

      // Only update the layout field and updatedAt, ignore any other fields
      const updateData: any = {
        updatedAt: Timestamp.fromDate(updatedLayout.updatedAt),
      };

      // Only include layout if it's provided
      if (updates.layout) {
        updateData.layout = updates.layout;
      }

      // Include name if it's provided (for rename operations)
      if (updates.name) {
        updateData.name = updates.name;
      }

      // Include starredSymbols if it's provided
      if (updates.starredSymbols !== undefined) {
        updateData.starredSymbols = updates.starredSymbols;
      }

      // Include showAIAssistant if it's provided
      if (updates.showAIAssistant !== undefined) {
        updateData.showAIAssistant = updates.showAIAssistant;
      }

      await updateDoc(layoutRef, updateData);
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

  // Chart Management (Charts are now embedded in layouts)
  async getChart(
    chartId: string,
    layoutId?: string
  ): Promise<ChartConfig | null> {
    this.ensureInitialized();

    // First check cache
    const cachedChart = this.chartsCache.get(chartId);
    if (cachedChart) {
      return cachedChart;
    }

    // If layoutId is provided, look for the chart in that specific layout
    if (layoutId) {
      const layout = await this.getLayout(layoutId);
      if (layout) {
        const chart = this.findChartInLayout(layout.layout, chartId);
        if (chart) {
          this.chartsCache.set(chartId, chart);
          return chart;
        }
      }
    }

    // Otherwise, search through all layouts
    const layouts = await this.getLayouts();
    for (const layout of layouts) {
      const chart = this.findChartInLayout(layout.layout, chartId);
      if (chart) {
        this.chartsCache.set(chartId, chart);
        return chart;
      }
    }

    return null;
  }

  async saveChart(
    chartData: Omit<ChartConfig, "id">,
    layoutId: string
  ): Promise<ChartConfig> {
    this.ensureInitialized();

    // For embedded charts, we need to find the layout that contains the chart
    // This is a simplified implementation - in practice, charts are created
    // as part of layout creation/modification
    const chartId = this.generateId();
    const chart: ChartConfig = {
      ...chartData,
      id: chartId,
    };

    // Validate chart
    this.validateChart(chart);

    // Store in cache
    this.chartsCache.set(chartId, chart);

    this.emitEvent("chart_updated", chart);
    return chart;
  }

  async updateChart(
    chartId: string,
    updates: Partial<ChartConfig>,
    layoutId?: string
  ): Promise<ChartConfig> {
    this.ensureInitialized();

    // Find the existing chart in the specified layout or all layouts
    let existingChart: ChartConfig | null = null;
    let targetLayout: SavedLayout | null = null;

    // If layoutId is provided, check that layout first
    if (layoutId) {
      const layout = await this.getLayout(layoutId);
      if (layout) {
        existingChart = this.findChartInLayout(layout.layout, chartId);
        if (existingChart) {
          targetLayout = layout;
        }
      }
    }

    // If not found in the specified layout, search all layouts
    if (!existingChart || !targetLayout) {
      const layouts = await this.getLayouts();
      for (const layout of layouts) {
        const chart = this.findChartInLayout(layout.layout, chartId);
        if (chart) {
          existingChart = chart;
          targetLayout = layout;
          break;
        }
      }
    }

    if (!existingChart || !targetLayout) {
      throw new RepositoryError("Chart not found", "NOT_FOUND", {
        chartId,
        layoutId,
      });
    }

    const updatedChart: ChartConfig = {
      ...existingChart,
      ...updates,
      id: chartId, // Ensure ID doesn't change
    };

    // Validate updated chart
    this.validateChart(updatedChart);

    // Update the chart in the layout
    const updatedLayoutNode = this.updateChartInLayout(
      targetLayout.layout,
      chartId,
      updatedChart
    );

    // Save the updated layout
    await this.updateLayout(targetLayout.id, { layout: updatedLayoutNode });

    // Store in cache
    this.chartsCache.set(chartId, updatedChart);

    this.emitEvent("chart_updated", updatedChart);
    return updatedChart;
  }

  async deleteChart(chartId: string, layoutId: string): Promise<void> {
    this.ensureInitialized();

    // Find the layout containing the chart
    let targetLayout: SavedLayout | null = null;

    if (layoutId) {
      const layout = await this.getLayout(layoutId);
      if (layout) {
        const chart = this.findChartInLayout(layout.layout, chartId);
        if (chart) {
          targetLayout = layout;
        }
      }
    }

    // If not found, search all layouts
    if (!targetLayout) {
      const layouts = await this.getLayouts();
      for (const layout of layouts) {
        const chart = this.findChartInLayout(layout.layout, chartId);
        if (chart) {
          targetLayout = layout;
          break;
        }
      }
    }

    if (!targetLayout) {
      throw new RepositoryError("Chart not found", "NOT_FOUND", {
        chartId,
        layoutId,
      });
    }

    // Remove the chart from the layout
    const updatedLayout = this.removeChartFromLayout(
      targetLayout.layout,
      chartId
    );

    // Save the updated layout
    await this.updateLayout(targetLayout.id, { layout: updatedLayout });

    // Remove from cache
    this.chartsCache.delete(chartId);
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

    const unsubscribe = onSnapshot(
      candleRef,
      (doc) => {
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
      },
      (error) => {
        console.error(`Error in candle subscription for ${exchangeId}/${symbol}/${granularity}:`, error);
        // Don't throw - just log the error to prevent uncaught promise rejections
      }
    );

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

  async setActiveLayout(layoutId: string | null): Promise<void> {
    this.ensureInitialized();

    await this.updateSettings({
      activeLayoutId: layoutId,
    });

    console.log("Active layout set to:", layoutId);
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
          starredSymbols: data.starredSymbols || [],
          showAIAssistant: data.showAIAssistant, // Include the AI assistant visibility state
        };
        this.layoutsCache.set(doc.id, layout);

        // Extract and cache charts from the layout
        this.extractAndCacheCharts(layout.layout);
      });

      console.log(`Loaded ${this.layoutsCache.size} layouts`);
      console.log(`Extracted ${this.chartsCache.size} charts from layouts`);
    } catch (error) {
      console.error("Failed to load layouts:", error);
    }
  }

  private async loadSymbols(): Promise<void> {
    try {
      // Direct approach: Load products from known exchanges
      // Since we know coinbase has products, load them directly
      const knownExchanges = ["coinbase"]; // Add more exchanges as needed

      for (const exchangeId of knownExchanges) {
        try {
          const productsRef = collection(
            db,
            "exchanges",
            exchangeId,
            "products"
          );
          const productsSnapshot = await getDocs(productsRef);

          if (productsSnapshot.empty) {
            console.warn(
              `Repository.loadSymbols: No products found for exchange: ${exchangeId}`
            );
            continue;
          }

          let activeCount = 0;
          let usdCount = 0;

          // Process products in parallel with activity checks
          const symbolPromises = productsSnapshot.docs.map(
            async (productDoc) => {
              try {
                const data = productDoc.data();

                // Check if symbol is active by looking for recent candle data
                const isActive = await this.checkSymbolActivityFromCandles(
                  exchangeId,
                  productDoc.id
                );

                const symbolParts = productDoc.id.split("-");
                const baseAsset = symbolParts[0];
                const quoteAsset = symbolParts[1];

                const symbol: Symbol = {
                  id: productDoc.id,
                  exchangeId: exchangeId,
                  symbol: productDoc.id,
                  baseAsset,
                  quoteAsset,
                  active: isActive,
                  lastUpdate: data.lastUpdate?.toDate(),
                };

                const key = `${exchangeId}:${productDoc.id}`;
                this.symbolsCache.set(key, symbol);

                if (symbol.active) activeCount++;
                if (symbol.quoteAsset === "USD") usdCount++;

                return symbol;
              } catch (productError) {
                console.error(
                  `Repository.loadSymbols: Error processing product ${productDoc.id}:`,
                  productError
                );
                return null;
              }
            }
          );

          // Wait for all symbol processing to complete
          await Promise.all(symbolPromises);

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
    const layoutsUnsubscribe = onSnapshot(
      layoutsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const layout: SavedLayout = {
            id: change.doc.id,
            name: data.name,
            userId: data.userId,
            layout: data.layout,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            starredSymbols: data.starredSymbols || [],
            showAIAssistant: data.showAIAssistant, // Include the AI assistant visibility state
          };

          if (change.type === "added" || change.type === "modified") {
            this.layoutsCache.set(change.doc.id, layout);
          } else if (change.type === "removed") {
            this.layoutsCache.delete(change.doc.id);
          }
        });
      },
      (error) => {
        console.error("Error in layouts snapshot listener:", error);
        // Don't throw - just log the error to prevent uncaught promise rejections
      }
    );

    this.unsubscribes.push(layoutsUnsubscribe);

    // Listen to chart changes
    const chartsRef = collection(db, "settings", this.userId, "charts");
    const chartsUnsubscribe = onSnapshot(
      chartsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const chart = change.doc.data() as ChartConfig;

          if (change.type === "added" || change.type === "modified") {
            this.chartsCache.set(change.doc.id, chart);
          } else if (change.type === "removed") {
            this.chartsCache.delete(change.doc.id);
          }
        });
      },
      (error) => {
        console.error("Error in charts snapshot listener:", error);
        // Don't throw - just log the error to prevent uncaught promise rejections
      }
    );

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

  private async checkSymbolActivityFromCandles(
    exchangeId: string,
    productId: string
  ): Promise<boolean> {
    try {
      // Check for recent candle data in the ONE_HOUR interval
      const candleRef = doc(
        db,
        "exchanges",
        exchangeId,
        "products",
        productId,
        "intervals",
        "ONE_HOUR"
      );

      const candleSnap = await getDoc(candleRef);

      if (!candleSnap.exists()) {
        console.log(
          `Repository.loadSymbols: ${productId} - No candle data (inactive)`
        );
        return false; // No candle data means inactive
      }

      const candleData = candleSnap.data();

      // Check if lastUpdate is recent (within last 24 hours)
      if (candleData.lastUpdate) {
        const lastUpdate = candleData.lastUpdate.toDate();
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const isRecent = lastUpdate > dayAgo;
        return isRecent;
      }

      // Fallback: if no lastUpdate, check if candle has valid data
      const hasValidData = !!(
        candleData.close &&
        candleData.open &&
        candleData.high &&
        candleData.low
      );

      console.log(
        `Repository.loadSymbols: ${productId} - No lastUpdate, valid data: ${hasValidData}`
      );
      return hasValidData;
    } catch (error) {
      console.warn(
        `Repository.loadSymbols: Could not check activity for ${exchangeId}:${productId}:`,
        error
      );
      // Default to inactive if we can't check
      return false;
    }
  }

  // Helper methods for manipulating charts within layouts
  private findChartInLayout(
    node: LayoutNode,
    chartId: string
  ): ChartConfig | null {
    if (node.type === "chart") {
      const chartNode = node as ChartLayoutNode;
      if (chartNode.chart && chartNode.chart.id === chartId) {
        return chartNode.chart;
      }
      // Check deprecated chartId field for backward compatibility
      if (chartNode.chartId === chartId && chartNode.chart) {
        return chartNode.chart;
      }
    } else if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      for (const child of splitNode.children) {
        const found = this.findChartInLayout(child, chartId);
        if (found) return found;
      }
    }
    return null;
  }

  private updateChartInLayout(
    node: LayoutNode,
    chartId: string,
    updatedChart: ChartConfig
  ): LayoutNode {
    if (node.type === "chart") {
      const chartNode = node as ChartLayoutNode;

      if (
        chartNode.chart &&
        (chartNode.chart.id === chartId || chartNode.chartId === chartId)
      ) {
        const { chartId: _, ...nodeWithoutChartId } = chartNode;
        const updatedNode = {
          ...nodeWithoutChartId,
          chart: updatedChart,
        };

        return updatedNode;
      }
      return node;
    } else if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      return {
        ...splitNode,
        children: splitNode.children.map((child: LayoutNode) =>
          this.updateChartInLayout(child, chartId, updatedChart)
        ),
      };
    }
    return node;
  }

  private removeChartFromLayout(node: LayoutNode, chartId: string): LayoutNode {
    if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      const filteredChildren = splitNode.children.filter(
        (child: LayoutNode) => {
          if (child.type === "chart") {
            const chartNode = child as ChartLayoutNode;
            return !(
              (chartNode.chart && chartNode.chart.id === chartId) ||
              chartNode.chartId === chartId
            );
          }
          return true;
        }
      );

      // If only one child remains after filtering, return that child
      if (filteredChildren.length === 1) {
        return filteredChildren[0];
      }

      // If no children remain, this shouldn't happen in a valid layout
      if (filteredChildren.length === 0) {
        // Return a default empty chart node
        return {
          type: "chart",
          id: this.generateId(),
          chart: {
            id: this.generateId(),
            symbol: "BTC-USD",
            granularity: "ONE_HOUR",
            indicators: [],
          },
        };
      }

      return {
        ...splitNode,
        children: filteredChildren.map((child: LayoutNode) =>
          this.removeChartFromLayout(child, chartId)
        ),
      };
    }
    return node;
  }

  private addChartToLayout(
    node: LayoutNode,
    chartNode: ChartLayoutNode
  ): LayoutNode {
    // For now, we'll replace the entire layout with a split containing the old layout and new chart
    // This is a simple implementation - in practice, you might want more sophisticated placement
    return {
      type: "split",
      direction: "horizontal",
      ratio: 0.5,
      children: [node, chartNode],
    };
  }

  private extractAndCacheCharts(node: LayoutNode): void {
    if (node.type === "chart") {
      const chartNode = node as ChartLayoutNode;
      if (chartNode.chart) {
        this.chartsCache.set(chartNode.chart.id, chartNode.chart);
      }
    } else if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      splitNode.children.forEach((child: LayoutNode) =>
        this.extractAndCacheCharts(child)
      );
    }
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

  // Layout-specific starred symbols
  async getLayoutStarredSymbols(layoutId: string): Promise<string[]> {
    this.ensureInitialized();
    
    const layout = await this.getLayout(layoutId);
    if (!layout) {
      return [];
    }
    
    return layout.starredSymbols || [];
  }

  async updateLayoutStarredSymbols(layoutId: string, symbols: string[]): Promise<void> {
    this.ensureInitialized();
    
    const layout = await this.getLayout(layoutId);
    if (!layout) {
      throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
    }
    
    // Update the layout with the new starred symbols
    await this.updateLayout(layoutId, {
      starredSymbols: symbols
    });
  }

  // Trend Line Management - stored under charts
  async getTrendLines(layoutId: string, chartId: string): Promise<TrendLine[]> {
    this.ensureInitialized();
    
    try {
      const trendLinesRef = collection(
        db,
        "settings",
        this.userId,
        "layouts",
        layoutId,
        "charts",
        chartId,
        "trendLines"
      );
      
      const snapshot = await getDocs(trendLinesRef);
      const trendLines: TrendLine[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        trendLines.push({
          id: doc.id,
          ...data
        } as TrendLine);
      });
      
      return trendLines;
    } catch (error) {
      console.error("Failed to get trend lines:", error);
      throw new RepositoryError(
        "Failed to get trend lines",
        "TRENDLINE_FETCH_ERROR",
        error
      );
    }
  }
  
  async saveTrendLine(layoutId: string, chartId: string, trendLine: TrendLine): Promise<void> {
    this.ensureInitialized();
    
    try {
      const trendLineRef = doc(
        db,
        "settings",
        this.userId,
        "layouts",
        layoutId,
        "charts",
        chartId,
        "trendLines",
        trendLine.id
      );
      
      await setDoc(trendLineRef, trendLine);
    } catch (error) {
      console.error("Failed to save trend line:", error);
      throw new RepositoryError(
        "Failed to save trend line",
        "TRENDLINE_SAVE_ERROR",
        error
      );
    }
  }
  
  async updateTrendLine(layoutId: string, chartId: string, trendLineId: string, updates: Partial<TrendLine>): Promise<void> {
    this.ensureInitialized();
    
    try {
      const trendLineRef = doc(
        db,
        "settings",
        this.userId,
        "layouts",
        layoutId,
        "charts",
        chartId,
        "trendLines",
        trendLineId
      );
      
      await updateDoc(trendLineRef, updates);
    } catch (error) {
      console.error("Failed to update trend line:", error);
      throw new RepositoryError(
        "Failed to update trend line",
        "TRENDLINE_UPDATE_ERROR",
        error
      );
    }
  }
  
  async deleteTrendLine(layoutId: string, chartId: string, trendLineId: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const trendLineRef = doc(
        db,
        "settings",
        this.userId,
        "layouts",
        layoutId,
        "charts",
        chartId,
        "trendLines",
        trendLineId
      );
      
      await deleteDoc(trendLineRef);
    } catch (error) {
      console.error("Failed to delete trend line:", error);
      throw new RepositoryError(
        "Failed to delete trend line",
        "TRENDLINE_DELETE_ERROR",
        error
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
