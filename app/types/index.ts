import type { Granularity } from "@anssip/rs-charts";

// Trend line types
export interface TrendLinePoint {
  timestamp: number;
  price: number;
}

export interface TrendLine {
  id: string;
  startPoint: TrendLinePoint;
  endPoint: TrendLinePoint;
  color?: string;
  lineWidth?: number;
  style?: "solid" | "dashed" | "dotted";
  extendLeft?: boolean;
  extendRight?: boolean;
  name?: string;
  description?: string;
}

export interface TrendLineSettings {
  color?: string;
  lineWidth?: number;
  style?: "solid" | "dashed" | "dotted";
  extendLeft?: boolean;
  extendRight?: boolean;
  name?: string;
  description?: string;
}

// Chart configuration interface
export interface ChartConfig {
  id: string;
  title?: string;
  symbol: string;
  granularity: Granularity;
  indicators?: string[];
}

// Layout node types
export type LayoutNodeType = "split" | "chart";

// Base layout node interface
export interface BaseLayoutNode {
  type: LayoutNodeType;
}

// Chart layout node (leaf node)
export interface ChartLayoutNode extends BaseLayoutNode {
  type: "chart";
  id: string;
  chartId?: string; // DEPRECATED: Used for backward compatibility
  chart?: ChartConfig; // Embedded chart configuration
  size?: number; // Size percentage (0-100) for the panel
}

// Split layout node (container node)
export interface SplitLayoutNode extends BaseLayoutNode {
  type: "split";
  direction: "horizontal" | "vertical";
  ratio: number; // DEPRECATED: Use sizes instead
  children: LayoutNode[];
  sizes?: number[]; // Size percentages for each child panel
}

// Union type for all layout nodes
export type LayoutNode = ChartLayoutNode | SplitLayoutNode;

// Saved layout document structure
export interface SavedLayout {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  layout: LayoutNode;
  starredSymbols?: string[]; // Array of symbol strings for this layout
  showAIAssistant?: boolean; // Whether the AI assistant panel is shown for this layout
}

// Symbol/Product information
export interface Symbol {
  id: string;
  exchangeId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  active: boolean;
  lastUpdate?: Date;
}

// Candle data for live prices
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  lastUpdate: Date;
}

// Exchange information
export interface Exchange {
  id: string;
  name: string;
  active: boolean;
}

// User settings
export interface UserSettings {
  userId: string;
  theme?: "light" | "dark";
  defaultGranularity?: Granularity;
  defaultSymbol?: string;
  activeLayoutId?: string | null;
  preferences?: Record<string, any>;
}

// Starred symbol document
export interface StarredSymbol {
  symbol: string;
  addedAt: Date;
  order?: number;
}

// Repository interfaces
export interface ILayoutRepository {
  // Layout management
  getLayouts(): Promise<SavedLayout[]>;
  getLayout(layoutId: string): Promise<SavedLayout | null>;
  saveLayout(
    layout: Omit<SavedLayout, "id" | "createdAt" | "updatedAt">
  ): Promise<SavedLayout>;
  updateLayout(
    layoutId: string,
    updates: Partial<SavedLayout>
  ): Promise<SavedLayout>;
  deleteLayout(layoutId: string): Promise<void>;

  // Layout-specific starred symbols
  getLayoutStarredSymbols(layoutId: string): Promise<string[]>;
  updateLayoutStarredSymbols(
    layoutId: string,
    symbols: string[]
  ): Promise<void>;

  // Chart management (DEPRECATED: Charts are now embedded in layouts)
  getChart(chartId: string, layoutId?: string): Promise<ChartConfig | null>;
  saveChart(
    chart: Omit<ChartConfig, "id">,
    layoutId: string
  ): Promise<ChartConfig>;
  updateChart(
    chartId: string,
    updates: Partial<ChartConfig>,
    layoutId: string
  ): Promise<ChartConfig>;
  deleteChart(chartId: string, layoutId: string): Promise<void>;
}

export interface ISymbolRepository {
  // Symbol management
  getSymbols(): Promise<Symbol[]>;
  getActiveSymbols(): Promise<Symbol[]>;
  getSymbol(exchangeId: string, symbol: string): Promise<Symbol | null>;

  // Live price data
  getCandle(
    exchangeId: string,
    symbol: string,
    granularity: Granularity
  ): Promise<Candle | null>;
  subscribeToCandle(
    exchangeId: string,
    symbol: string,
    granularity: Granularity,
    callback: (candle: Candle) => void
  ): () => void;
}

export interface IUserRepository {
  // User settings
  getSettings(): Promise<UserSettings | null>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}

// Main repository interface
export interface IRepository
  extends ILayoutRepository,
    ISymbolRepository,
    IUserRepository {
  // General repository methods
  initialize(): Promise<void>;
  sync(): Promise<void>;
  isOnline(): boolean;
}

// Granularity type re-export for convenience
export type { Granularity } from "@anssip/rs-charts";

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
export type UpdateInput<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>;

// Event types for repository notifications
export interface RepositoryEvent {
  type:
    | "layout_saved"
    | "layout_updated"
    | "layout_deleted"
    | "chart_updated"
    | "symbol_updated";
  data: any;
  timestamp: Date;
}

export type RepositoryEventCallback = (event: RepositoryEvent) => void;

// Error types
export class RepositoryError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class NetworkError extends RepositoryError {
  constructor(message: string, details?: any) {
    super(message, "NETWORK_ERROR", details);
    this.name = "NetworkError";
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
