/**
 * Trading Engine - Core trading system for paper trading and backtesting
 *
 * This module provides the foundational classes for executing trades,
 * managing positions, tracking account balances, and calculating performance metrics.
 *
 * @module tradingEngine
 */

export { TradingEngine } from "./TradingEngine";
export { OrderExecutor } from "./OrderExecutor";
export { PositionManager } from "./PositionManager";
export { AccountManager } from "./AccountManager";
export { PerformanceAnalytics } from "./PerformanceAnalytics";

// Re-export commonly used types
export type {
  Order,
  Trade,
  CompletedTrade,
  Position,
  TradingAccount,
  PerformanceMetrics,
  OrderSignal,
  TradingStrategy,
  BacktestResult,
} from "~/types/trading";
