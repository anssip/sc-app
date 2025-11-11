# sc-app Paper Trading & Backtesting Implementation Plan

**Architecture:** Client-side unified trading engine supporting both paper trading and backtesting modes.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Models](#data-models)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Detailed Implementation](#detailed-implementation)
7. [Usage Examples](#usage-examples)

---

## Architecture Overview

### Unified Trading Engine Approach

```
┌──────────────────────────────────────────────────────┐
│          Core Trading Engine (Client-Side)           │
│  ┌────────────────────────────────────────────────┐  │
│  │  Abstract Trading Engine Base Class            │  │
│  │  • Order execution logic                       │  │
│  │  • Position management                         │  │
│  │  │  Account & balance tracking                 │  │
│  │  • Trade recording                             │  │
│  │  • P&L calculations                            │  │
│  │  • Performance analytics                       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
              ↓                           ↓
    ┌────────────────────┐      ┌────────────────────┐
    │  Paper Trading     │      │   Backtesting      │
    │  Mode              │      │   Mode             │
    ├────────────────────┤      ├────────────────────┤
    │ • Live prices      │      │ • Historical data  │
    │ • Real-time sub.   │      │ • Fast-forward     │
    │ • Manual orders    │      │ • Strategy auto.   │
    │ • Interactive UI   │      │ • Bulk results     │
    └────────────────────┘      └────────────────────┘
```

### Why Client-Side?

✅ **Instant feedback** - No network latency
✅ **No cold starts** - Firebase Functions have delays
✅ **Free execution** - No function invocation costs
✅ **Better UX** - Immediate order execution
✅ **Easier debugging** - All in browser dev tools
✅ **Real-time updates** - Direct Firestore subscriptions

### Shared Logic (80% code reuse)

Both modes share:
- Order execution engine
- Position tracking
- Account/balance management
- P&L calculations
- Trade recording
- Performance metrics
- Chart visualization

### Key Differences

| Aspect | Paper Trading | Backtesting |
|--------|---------------|-------------|
| **Time** | Real-time, live | Historical, fast-forward |
| **Orders** | Manual UI | Strategy-automated |
| **Speed** | Market speed | Simulated (fast) |
| **Data** | Live subscriptions | Historical queries |
| **Interaction** | Interactive | Report-based |

---

## Core Components

### 1. Trading Engine (Abstract Base)

**Location:** `app/services/tradingEngine/TradingEngine.ts`

```typescript
abstract class TradingEngine {
  protected account: TradingAccount;
  protected positions: Map<string, Position>;
  protected orders: Map<string, Order>;
  protected trades: Trade[];

  // Abstract methods (implement in subclasses)
  abstract getPriceAt(symbol: string, timestamp: number): Promise<number>;
  abstract onPriceUpdate(symbol: string, price: number): void;

  // Shared methods (used by both modes)
  executeOrder(order: Order): Promise<Trade | null> { }
  updatePosition(trade: Trade): void { }
  closePosition(symbol: string, price: number): Trade | null { }
  calculatePnL(position: Position, currentPrice: number): number { }
  recordTrade(trade: Trade): void { }
  getPerformanceMetrics(): PerformanceMetrics { }
}
```

### 2. Paper Trading Engine

**Location:** `app/services/tradingEngine/PaperTradingEngine.ts`

```typescript
class PaperTradingEngine extends TradingEngine {
  private priceSubscriptions: Map<string, Unsubscribe>;

  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    // Get current live price from Firestore subscription
    return this.currentPrices.get(symbol) || 0;
  }

  subscribeToPrices(symbols: string[]): void {
    // Subscribe to live candle updates
    symbols.forEach(symbol => {
      const unsubscribe = repository.subscribeToCandle(
        'coinbase',
        symbol,
        'FIVE_MINUTE',
        (candle) => this.onPriceUpdate(symbol, candle.close)
      );
      this.priceSubscriptions.set(symbol, unsubscribe);
    });
  }

  onPriceUpdate(symbol: string, price: number): void {
    // Update current price
    this.currentPrices.set(symbol, price);

    // Check pending limit/stop orders
    this.checkPendingOrders(symbol, price);

    // Update position P&L
    this.updatePositionPnL(symbol, price);
  }
}
```

### 3. Backtesting Engine

**Location:** `app/services/tradingEngine/BacktestingEngine.ts`

```typescript
class BacktestingEngine extends TradingEngine {
  private historicalData: Map<string, Candle[]>;
  private currentIndex: number = 0;

  async loadHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity
  ): Promise<void> {
    // Query historical candles from Firestore
    const candles = await this.queryCandles(symbol, startDate, endDate, granularity);
    this.historicalData.set(symbol, candles);
  }

  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    // Find price at specific timestamp in historical data
    const candles = this.historicalData.get(symbol) || [];
    const candle = candles.find(c => c.timestamp === timestamp);
    return candle?.close || 0;
  }

  async runBacktest(strategy: TradingStrategy): Promise<BacktestResult> {
    const candles = this.historicalData.get(strategy.symbol) || [];

    for (const candle of candles) {
      this.currentIndex++;
      this.currentTimestamp = candle.timestamp;

      // Let strategy analyze candle and generate signals
      const signal = strategy.onCandle(candle);

      if (signal) {
        // Execute order at current price
        const order = this.createOrderFromSignal(signal, candle);
        const trade = await this.executeOrder(order);

        if (trade) {
          strategy.onTrade?.(trade);
        }
      }

      // Update positions with current price
      this.updateAllPositionsPnL(candle.close);

      // Optional: Emit progress event for UI
      this.emit('progress', {
        current: this.currentIndex,
        total: candles.length,
        timestamp: candle.timestamp
      });
    }

    return this.generateBacktestResult();
  }
}
```

### 4. Order Executor

**Location:** `app/services/tradingEngine/OrderExecutor.ts`

```typescript
class OrderExecutor {
  executeMarketOrder(order: Order, currentPrice: number): Trade {
    // Immediate execution at current price
    return {
      id: generateId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: currentPrice,
      timestamp: Date.now(),
      type: 'market'
    };
  }

  checkLimitOrder(order: Order, currentPrice: number): Trade | null {
    // Check if limit order should execute
    if (order.side === 'buy' && currentPrice <= order.price!) {
      return this.executeLimitOrder(order, order.price!);
    }
    if (order.side === 'sell' && currentPrice >= order.price!) {
      return this.executeLimitOrder(order, order.price!);
    }
    return null;
  }

  checkStopOrder(order: Order, currentPrice: number): Trade | null {
    // Check if stop order should trigger
    if (order.side === 'buy' && currentPrice >= order.price!) {
      return this.executeStopOrder(order, currentPrice);
    }
    if (order.side === 'sell' && currentPrice <= order.price!) {
      return this.executeStopOrder(order, currentPrice);
    }
    return null;
  }
}
```

### 5. Position Manager

**Location:** `app/services/tradingEngine/PositionManager.ts`

```typescript
class PositionManager {
  private positions: Map<string, Position> = new Map();

  updatePosition(trade: Trade): Position {
    const existing = this.positions.get(trade.symbol);

    if (!existing) {
      // New position
      return this.createPosition(trade);
    }

    // Update existing position
    if (this.isSameSide(existing, trade)) {
      // Adding to position
      return this.addToPosition(existing, trade);
    } else {
      // Reducing or closing position
      return this.reducePosition(existing, trade);
    }
  }

  calculatePnL(position: Position, currentPrice: number): PnLResult {
    const positionValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.avgEntryPrice;
    const unrealizedPnL = position.side === 'long'
      ? positionValue - costBasis
      : costBasis - positionValue;
    const unrealizedPnLPercent = (unrealizedPnL / costBasis) * 100;

    return {
      unrealizedPnL,
      unrealizedPnLPercent,
      positionValue,
      costBasis
    };
  }

  closePosition(symbol: string, exitPrice: number): Trade | null {
    const position = this.positions.get(symbol);
    if (!position) return null;

    // Create closing trade
    const closingTrade: Trade = {
      id: generateId(),
      symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      quantity: position.quantity,
      entryPrice: position.avgEntryPrice,
      exitPrice,
      pnl: this.calculatePnL(position, exitPrice).unrealizedPnL,
      entryTime: position.entryTime,
      exitTime: Date.now()
    };

    this.positions.delete(symbol);
    return closingTrade;
  }
}
```

### 6. Account Manager

**Location:** `app/services/tradingEngine/AccountManager.ts`

```typescript
class AccountManager {
  private account: TradingAccount;

  constructor(startingBalance: number) {
    this.account = {
      balance: startingBalance,
      startingBalance,
      equity: startingBalance,
      buyingPower: startingBalance,
      totalPnL: 0,
      totalPnLPercent: 0
    };
  }

  deductOrderCost(order: Order, executionPrice: number): boolean {
    const cost = order.quantity * executionPrice;

    if (cost > this.account.buyingPower) {
      return false; // Insufficient funds
    }

    this.account.balance -= cost;
    this.account.buyingPower -= cost;
    return true;
  }

  creditOrderProceeds(trade: Trade): void {
    const proceeds = trade.quantity * trade.price;
    this.account.balance += proceeds;
    this.account.buyingPower += proceeds;
  }

  updateEquity(positions: Position[], currentPrices: Map<string, number>): void {
    let totalPositionValue = 0;

    positions.forEach(position => {
      const currentPrice = currentPrices.get(position.symbol) || position.avgEntryPrice;
      totalPositionValue += position.quantity * currentPrice;
    });

    this.account.equity = this.account.balance + totalPositionValue;
    this.account.totalPnL = this.account.equity - this.account.startingBalance;
    this.account.totalPnLPercent =
      (this.account.totalPnL / this.account.startingBalance) * 100;
  }

  reset(startingBalance?: number): void {
    const balance = startingBalance || this.account.startingBalance;
    this.account = {
      balance,
      startingBalance: balance,
      equity: balance,
      buyingPower: balance,
      totalPnL: 0,
      totalPnLPercent: 0
    };
  }
}
```

### 7. Performance Analytics

**Location:** `app/services/tradingEngine/PerformanceAnalytics.ts`

```typescript
class PerformanceAnalytics {
  calculateMetrics(trades: Trade[], account: TradingAccount): PerformanceMetrics {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    const winRate = (winningTrades.length / trades.length) * 100;
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length || 0;
    const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length || 0);
    const profitFactor = avgWin / avgLoss || 0;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalPnL: account.totalPnL,
      totalPnLPercent: account.totalPnLPercent,
      largestWin: Math.max(...trades.map(t => t.pnl)),
      largestLoss: Math.min(...trades.map(t => t.pnl)),
      avgTradeDuration: this.calculateAvgDuration(trades),
      sharpeRatio: this.calculateSharpeRatio(trades),
      maxDrawdown: this.calculateMaxDrawdown(trades, account.startingBalance)
    };
  }

  private calculateMaxDrawdown(trades: Trade[], startingBalance: number): number {
    let peak = startingBalance;
    let maxDrawdown = 0;
    let runningBalance = startingBalance;

    trades.forEach(trade => {
      runningBalance += trade.pnl;

      if (runningBalance > peak) {
        peak = runningBalance;
      }

      const drawdown = ((peak - runningBalance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    return maxDrawdown;
  }
}
```

---

## Data Models

### Core Types

**Location:** `app/types/trading.ts`

```typescript
// Account
export interface TradingAccount {
  balance: number;              // Available cash
  startingBalance: number;      // Initial capital
  equity: number;               // Balance + position values
  buyingPower: number;          // Available for new trades
  totalPnL: number;            // Total profit/loss ($)
  totalPnLPercent: number;     // Total profit/loss (%)
}

// Order
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;               // For limit/stop orders
  stopPrice?: number;           // For stop_limit orders
  status: 'pending' | 'filled' | 'cancelled' | 'rejected' | 'partial';
  createdAt: number;           // Timestamp
  filledAt?: number;           // Timestamp when filled
  metadata?: any;              // Custom data
}

// Position
export interface Position {
  symbol: string;
  quantity: number;
  side: 'long' | 'short';
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  entryTime: number;
  costBasis: number;
}

// Trade (completed transaction)
export interface Trade {
  id: string;
  orderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;                 // Realized P&L
  pnlPercent: number;          // Realized P&L %
  entryTime: number;
  exitTime: number;
  duration: number;            // milliseconds
  fees?: number;               // Optional commission
  notes?: string;              // Trade journal notes
}

// Performance Metrics
export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;            // Percentage
  avgWin: number;
  avgLoss: number;
  profitFactor: number;       // avgWin / avgLoss
  totalPnL: number;
  totalPnLPercent: number;
  largestWin: number;
  largestLoss: number;
  avgTradeDuration: number;   // milliseconds
  sharpeRatio: number;
  maxDrawdown: number;        // Percentage
  expectancy: number;         // Average $ per trade
}

// Trading Strategy (for backtesting)
export interface TradingStrategy {
  name: string;
  symbol: string;
  description?: string;

  // Called for each candle
  onCandle(candle: Candle): OrderSignal | null;

  // Called when trade executes
  onTrade?(trade: Trade): void;

  // Optional initialization
  onStart?(account: TradingAccount): void;

  // Optional cleanup
  onEnd?(metrics: PerformanceMetrics): void;
}

// Order Signal (from strategy)
export interface OrderSignal {
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Backtest Result
export interface BacktestResult {
  strategy: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  metrics: PerformanceMetrics;
  trades: Trade[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  account: TradingAccount;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
}

export interface DrawdownPoint {
  timestamp: number;
  drawdownPercent: number;
}
```

---

## Implementation Phases

### Phase 1: Core Engine (Week 1)

**Goal:** Build shared trading engine with order execution and position management

**Tasks:**
1. Create base `TradingEngine` abstract class
2. Implement `OrderExecutor` (market, limit, stop orders)
3. Implement `PositionManager` (open, update, close positions)
4. Implement `AccountManager` (balance, equity, buying power)
5. Add unit tests for core logic

**Deliverable:** Working core engine that can execute trades programmatically

### Phase 2: Backtesting Mode (Week 1-2)

**Goal:** Implement backtesting with strategy support

**Tasks:**
1. Create `BacktestingEngine` class
2. Implement historical data loader (query Firestore)
3. Create `TradingStrategy` interface
4. Implement strategy executor (process candles)
5. Create simple example strategies (SMA crossover, RSI)
6. Build `PerformanceAnalytics` calculator
7. Create backtest result generator

**Deliverable:** Can run automated backtests with strategies

### Phase 3: Backtesting UI (Week 2)

**Goal:** Build user interface for backtesting

**Tasks:**
1. Create `BacktestPanel` component (strategy selector, date range, settings)
2. Create `BacktestResults` component (metrics display)
3. Create `EquityCurveChart` component
4. Create `TradesList` component
5. Integrate with chart visualization (trade markers, zones)
6. Add export functionality (CSV, JSON)

**Deliverable:** Full backtesting UI with results visualization

### Phase 4: Paper Trading Mode (Week 2-3)

**Goal:** Implement paper trading with live data

**Tasks:**
1. Create `PaperTradingEngine` class
2. Implement live price subscriptions
3. Create pending order checker (real-time)
4. Implement position P&L updates (real-time)
5. Add Firestore persistence for paper trading data

**Deliverable:** Working paper trading engine with live execution

### Phase 5: Paper Trading UI (Week 3)

**Goal:** Build interactive UI for manual trading

**Tasks:**
1. Create `TradingPanel` component (order entry)
2. Create `PositionsPanel` component (open positions)
3. Create `OrdersPanel` component (active/history)
4. Create `AccountSummary` widget
5. Integrate click-to-trade (rs-charts events)
6. Add keyboard shortcuts (B/S for buy/sell)

**Deliverable:** Complete paper trading UI

### Phase 6: Advanced Features (Week 3-4)

**Goal:** Add analytics, risk management, trade journal

**Tasks:**
1. Create `PerformanceAnalytics` component
2. Create `TradeJournal` component (notes, screenshots)
3. Add risk management tools (position sizing calculator)
4. Add notifications (trade fills, position updates)
5. Add settings (starting balance, commissions, slippage)
6. Add account reset functionality

**Deliverable:** Full-featured trading platform

---

## File Structure

```
app/
├── services/
│   ├── tradingEngine/
│   │   ├── TradingEngine.ts           # Abstract base class
│   │   ├── PaperTradingEngine.ts      # Live trading implementation
│   │   ├── BacktestingEngine.ts       # Historical backtesting
│   │   ├── OrderExecutor.ts           # Order matching logic
│   │   ├── PositionManager.ts         # Position tracking
│   │   ├── AccountManager.ts          # Balance management
│   │   ├── PerformanceAnalytics.ts    # Metrics calculation
│   │   └── index.ts                   # Exports
│   └── strategies/
│       ├── Strategy.ts                # Base strategy class
│       ├── SMAStrategy.ts             # Example: SMA crossover
│       ├── RSIStrategy.ts             # Example: RSI strategy
│       └── index.ts
│
├── components/
│   ├── trading/
│   │   ├── TradingPanel.tsx           # Order entry form
│   │   ├── PositionsPanel.tsx         # Open positions list
│   │   ├── OrdersPanel.tsx            # Orders list
│   │   ├── AccountSummary.tsx         # Balance/equity widget
│   │   ├── TradeHistory.tsx           # Completed trades
│   │   └── OrderEntryModal.tsx        # Quick order modal
│   │
│   ├── backtesting/
│   │   ├── BacktestPanel.tsx          # Backtest configuration
│   │   ├── BacktestResults.tsx        # Results dashboard
│   │   ├── StrategySelector.tsx       # Strategy picker
│   │   ├── EquityCurveChart.tsx       # Equity visualization
│   │   └── MetricsGrid.tsx            # Performance metrics
│   │
│   └── analytics/
│       ├── PerformanceAnalytics.tsx   # Analytics dashboard
│       ├── TradeJournal.tsx           # Trade notes/review
│       └── RiskCalculator.tsx         # Position sizing
│
├── types/
│   └── trading.ts                     # All trading types
│
└── hooks/
    ├── usePaperTrading.ts             # Paper trading hook
    ├── useBacktesting.ts              # Backtesting hook
    └── useTradeHistory.ts             # Trade data hook
```

---

## Detailed Implementation

### Creating the Core Engine

**Step 1: Base Trading Engine**

```typescript
// app/services/tradingEngine/TradingEngine.ts
import { db } from '~/lib/firebase';
import { Order, Trade, Position, TradingAccount } from '~/types/trading';
import { OrderExecutor } from './OrderExecutor';
import { PositionManager } from './PositionManager';
import { AccountManager } from './AccountManager';

export abstract class TradingEngine extends EventEmitter {
  protected orderExecutor: OrderExecutor;
  protected positionManager: PositionManager;
  protected accountManager: AccountManager;
  protected trades: Trade[] = [];

  constructor(startingBalance: number) {
    super();
    this.orderExecutor = new OrderExecutor();
    this.positionManager = new PositionManager();
    this.accountManager = new AccountManager(startingBalance);
  }

  // Abstract methods (implement in subclasses)
  abstract getPriceAt(symbol: string, timestamp: number): Promise<number>;

  // Shared order execution
  async executeOrder(order: Order): Promise<Trade | null> {
    const currentPrice = await this.getPriceAt(order.symbol, Date.now());

    // Check if we have enough buying power
    if (order.side === 'buy') {
      const cost = order.quantity * currentPrice;
      if (!this.accountManager.deductOrderCost(order, currentPrice)) {
        this.emit('order-rejected', { order, reason: 'Insufficient funds' });
        return null;
      }
    }

    // Execute based on order type
    let trade: Trade | null = null;

    if (order.type === 'market') {
      trade = this.orderExecutor.executeMarketOrder(order, currentPrice);
    } else if (order.type === 'limit') {
      trade = this.orderExecutor.checkLimitOrder(order, currentPrice);
    } else if (order.type === 'stop') {
      trade = this.orderExecutor.checkStopOrder(order, currentPrice);
    }

    if (trade) {
      // Update position
      const position = this.positionManager.updatePosition(trade);

      // Credit proceeds if selling
      if (order.side === 'sell') {
        this.accountManager.creditOrderProceeds(trade);
      }

      // Record trade
      this.trades.push(trade);

      // Emit events
      this.emit('trade-executed', { trade, position });
      this.emit('account-updated', this.accountManager.getAccount());
    }

    return trade;
  }

  getAccount(): TradingAccount {
    return this.accountManager.getAccount();
  }

  getPositions(): Position[] {
    return Array.from(this.positionManager.getPositions().values());
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  closePosition(symbol: string): Trade | null {
    const currentPrice = await this.getPriceAt(symbol, Date.now());
    return this.positionManager.closePosition(symbol, currentPrice);
  }

  reset(startingBalance?: number): void {
    this.accountManager.reset(startingBalance);
    this.positionManager.clear();
    this.trades = [];
    this.emit('reset');
  }
}
```

### Implementing Paper Trading

```typescript
// app/services/tradingEngine/PaperTradingEngine.ts
import { TradingEngine } from './TradingEngine';
import { getRepository } from '~/services/repository';

export class PaperTradingEngine extends TradingEngine {
  private repository: Repository;
  private userId: string;
  private priceSubscriptions = new Map<string, Unsubscribe>();
  private currentPrices = new Map<string, number>();
  private pendingOrders = new Map<string, Order>();

  constructor(userId: string, startingBalance: number) {
    super(startingBalance);
    this.userId = userId;
    this.repository = getRepository(userId);
  }

  async initialize(): Promise<void> {
    await this.repository.initialize();
    // Load saved paper trading state from Firestore
    await this.loadState();
  }

  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    // For paper trading, we use current live price
    return this.currentPrices.get(symbol) || 0;
  }

  subscribeToPrices(symbols: string[]): void {
    symbols.forEach(symbol => {
      // Skip if already subscribed
      if (this.priceSubscriptions.has(symbol)) return;

      const unsubscribe = this.repository.subscribeToCandle(
        'coinbase',
        symbol,
        'ONE_MINUTE',
        (candle) => {
          this.currentPrices.set(symbol, candle.close);
          this.onPriceUpdate(symbol, candle.close);
        }
      );

      this.priceSubscriptions.set(symbol, unsubscribe);
    });
  }

  private onPriceUpdate(symbol: string, price: number): void {
    // Check pending limit/stop orders
    this.checkPendingOrders(symbol, price);

    // Update position P&L
    const position = this.positionManager.getPosition(symbol);
    if (position) {
      const pnl = this.positionManager.calculatePnL(position, price);
      this.emit('position-updated', { symbol, position, pnl });
    }

    // Update account equity
    this.accountManager.updateEquity(
      this.getPositions(),
      this.currentPrices
    );
    this.emit('account-updated', this.getAccount());
  }

  private checkPendingOrders(symbol: string, price: number): void {
    this.pendingOrders.forEach(async (order) => {
      if (order.symbol !== symbol) return;

      let shouldExecute = false;

      if (order.type === 'limit') {
        if (order.side === 'buy' && price <= order.price!) {
          shouldExecute = true;
        } else if (order.side === 'sell' && price >= order.price!) {
          shouldExecute = true;
        }
      } else if (order.type === 'stop') {
        if (order.side === 'buy' && price >= order.price!) {
          shouldExecute = true;
        } else if (order.side === 'sell' && price <= order.price!) {
          shouldExecute = true;
        }
      }

      if (shouldExecute) {
        this.pendingOrders.delete(order.id);
        await this.executeOrder(order);
      }
    });
  }

  async placeOrder(order: Order): Promise<void> {
    if (order.type === 'market') {
      // Execute immediately
      await this.executeOrder(order);
    } else {
      // Add to pending orders
      this.pendingOrders.set(order.id, order);
      this.emit('order-placed', order);

      // Make sure we're subscribed to this symbol
      this.subscribeToPrices([order.symbol]);
    }

    // Persist to Firestore
    await this.saveState();
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = this.pendingOrders.get(orderId);
    if (order) {
      this.pendingOrders.delete(orderId);
      this.emit('order-cancelled', order);
      await this.saveState();
    }
  }

  private async loadState(): Promise<void> {
    // Load from Firestore: settings/{userId}/paperTrading/
    // Implementation depends on Firestore structure
  }

  private async saveState(): Promise<void> {
    // Save to Firestore: settings/{userId}/paperTrading/
    // Implementation depends on Firestore structure
  }

  destroy(): void {
    // Unsubscribe from all price feeds
    this.priceSubscriptions.forEach(unsubscribe => unsubscribe());
    this.priceSubscriptions.clear();
  }
}
```

### Implementing Backtesting

```typescript
// app/services/tradingEngine/BacktestingEngine.ts
import { TradingEngine } from './TradingEngine';
import { TradingStrategy, BacktestResult } from '~/types/trading';
import { getRepository } from '~/services/repository';

export class BacktestingEngine extends TradingEngine {
  private repository: Repository;
  private historicalData = new Map<string, Candle[]>();
  private currentTimestamp: number = 0;
  private currentIndex: number = 0;

  constructor(userId: string, startingBalance: number) {
    super(startingBalance);
    this.repository = getRepository(userId);
  }

  async loadHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity
  ): Promise<void> {
    await this.repository.initialize();

    // Query historical candles from Firestore
    const candles = await this.queryCandles(symbol, startDate, endDate, granularity);
    this.historicalData.set(symbol, candles);

    this.emit('data-loaded', {
      symbol,
      candleCount: candles.length,
      startDate,
      endDate
    });
  }

  private async queryCandles(
    symbol: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity
  ): Promise<Candle[]> {
    // Query Firestore for historical candles
    const candlesRef = collection(
      db,
      'exchanges',
      'coinbase',
      'products',
      symbol,
      'candles',
      granularity
    );

    const q = query(
      candlesRef,
      where('timestamp', '>=', startDate.getTime()),
      where('timestamp', '<=', endDate.getTime()),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Candle);
  }

  async getPriceAt(symbol: string, timestamp: number): Promise<number> {
    const candles = this.historicalData.get(symbol) || [];
    const candle = candles.find(c => c.timestamp === timestamp);
    return candle?.close || 0;
  }

  async runBacktest(strategy: TradingStrategy): Promise<BacktestResult> {
    const candles = this.historicalData.get(strategy.symbol) || [];

    if (candles.length === 0) {
      throw new Error('No historical data loaded');
    }

    // Initialize strategy
    strategy.onStart?.(this.getAccount());

    // Process each candle
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      this.currentIndex = i;
      this.currentTimestamp = candle.timestamp;

      // Let strategy analyze candle
      const signal = strategy.onCandle(candle);

      if (signal) {
        // Create order from signal
        const order: Order = {
          id: this.generateOrderId(),
          symbol: strategy.symbol,
          side: signal.side,
          type: signal.type,
          quantity: signal.quantity,
          price: signal.price,
          status: 'pending',
          createdAt: candle.timestamp
        };

        // Execute order
        const trade = await this.executeOrder(order);

        if (trade) {
          strategy.onTrade?.(trade);
        }
      }

      // Update all positions with current price
      this.getPositions().forEach(position => {
        const pnl = this.positionManager.calculatePnL(position, candle.close);
        this.emit('position-updated', { position, pnl, timestamp: candle.timestamp });
      });

      // Update account equity
      this.accountManager.updateEquity(
        this.getPositions(),
        new Map([[strategy.symbol, candle.close]])
      );

      // Emit progress
      this.emit('progress', {
        current: i + 1,
        total: candles.length,
        percent: ((i + 1) / candles.length) * 100,
        timestamp: candle.timestamp
      });
    }

    // Close any open positions at final price
    const finalCandle = candles[candles.length - 1];
    this.getPositions().forEach(position => {
      this.closePosition(position.symbol);
    });

    // Generate result
    const result = this.generateResult(strategy, candles);

    // Cleanup
    strategy.onEnd?.(result.metrics);

    return result;
  }

  private generateResult(
    strategy: TradingStrategy,
    candles: Candle[]
  ): BacktestResult {
    const analytics = new PerformanceAnalytics();
    const metrics = analytics.calculateMetrics(this.getTrades(), this.getAccount());

    // Generate equity curve
    const equityCurve = this.generateEquityCurve(candles);
    const drawdownCurve = analytics.calculateDrawdownCurve(equityCurve);

    return {
      strategy: strategy.name,
      symbol: strategy.symbol,
      startDate: new Date(candles[0].timestamp),
      endDate: new Date(candles[candles.length - 1].timestamp),
      metrics,
      trades: this.getTrades(),
      equityCurve,
      drawdownCurve,
      account: this.getAccount()
    };
  }

  private generateEquityCurve(candles: Candle[]): EquityPoint[] {
    // Reconstruct equity at each point in time
    const curve: EquityPoint[] = [];
    let equity = this.getAccount().startingBalance;

    // This is simplified - in reality, track equity changes with each trade
    this.getTrades().forEach(trade => {
      equity += trade.pnl;
      curve.push({
        timestamp: trade.exitTime,
        equity
      });
    });

    return curve;
  }

  private generateOrderId(): string {
    return `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Usage Examples

### Paper Trading

```typescript
// In a React component
import { PaperTradingEngine } from '~/services/tradingEngine';

function usePaperTrading() {
  const { user } = useAuth();
  const [engine, setEngine] = useState<PaperTradingEngine | null>(null);
  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    if (!user) return;

    const paperEngine = new PaperTradingEngine(user.uid, 100000);

    paperEngine.on('trade-executed', ({ trade, position }) => {
      console.log('Trade executed:', trade);
      // Add trade marker to chart
      if (chartRef.current?.api) {
        chartRef.current.api.addTradeMarker({
          timestamp: trade.entryTime,
          price: trade.entryPrice,
          side: trade.side,
          shape: 'arrow',
          tooltip: {
            title: `${trade.side.toUpperCase()} ${trade.symbol}`,
            details: [
              `Qty: ${trade.quantity}`,
              `Price: $${trade.entryPrice.toFixed(2)}`
            ]
          }
        });
      }
    });

    paperEngine.on('account-updated', (acc) => {
      setAccount(acc);
    });

    paperEngine.on('position-updated', () => {
      setPositions(paperEngine.getPositions());
    });

    paperEngine.initialize().then(() => {
      paperEngine.subscribeToPrices(['BTC-USD', 'ETH-USD']);
      setEngine(paperEngine);
      setAccount(paperEngine.getAccount());
    });

    return () => {
      paperEngine.destroy();
    };
  }, [user]);

  const placeMarketOrder = useCallback(async (
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number
  ) => {
    if (!engine) return;

    const order: Order = {
      id: `order-${Date.now()}`,
      symbol,
      side,
      type: 'market',
      quantity,
      status: 'pending',
      createdAt: Date.now()
    };

    await engine.placeOrder(order);
  }, [engine]);

  return {
    account,
    positions,
    placeMarketOrder,
    engine
  };
}
```

### Backtesting

```typescript
// In a React component
import { BacktestingEngine } from '~/services/tradingEngine';
import { SMAStrategy } from '~/services/strategies';

function useBacktesting() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const runBacktest = useCallback(async (
    symbol: string,
    startDate: Date,
    endDate: Date,
    strategyName: string,
    startingBalance: number
  ) => {
    if (!user) return;

    setIsRunning(true);
    setProgress(0);

    const engine = new BacktestingEngine(user.uid, startingBalance);

    engine.on('progress', ({ percent }) => {
      setProgress(percent);
    });

    // Load historical data
    await engine.loadHistoricalData(symbol, startDate, endDate, 'ONE_HOUR');

    // Create strategy
    const strategy = new SMAStrategy(symbol, {
      fastPeriod: 10,
      slowPeriod: 30
    });

    // Run backtest
    const backtestResult = await engine.runBacktest(strategy);

    setResult(backtestResult);
    setIsRunning(false);

    // Visualize trades on chart
    backtestResult.trades.forEach(trade => {
      if (chartRef.current?.api) {
        chartRef.current.api.addTradeMarker({
          timestamp: trade.entryTime,
          price: trade.entryPrice,
          side: trade.side,
          shape: 'arrow'
        });

        // Add trade zone
        chartRef.current.api.addTradeZone({
          startTimestamp: trade.entryTime,
          endTimestamp: trade.exitTime,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          fillColor: trade.pnl > 0 ? '#00ff00' : '#ff0000',
          fillOpacity: 0.2,
          showPnL: true,
          metadata: trade
        });
      }
    });
  }, [user]);

  return {
    runBacktest,
    isRunning,
    progress,
    result
  };
}
```

---

## Next Steps

1. **Implement Phase 1** (Core Engine) - Start with base classes and order execution
2. **Test thoroughly** - Unit tests for all core logic
3. **Implement Phase 2** (Backtesting) - Strategy support and historical replay
4. **Build Phase 3** (Backtesting UI) - Results visualization
5. **Implement Phase 4** (Paper Trading) - Live execution engine
6. **Build Phase 5** (Paper Trading UI) - Interactive trading interface
7. **Add Phase 6** (Advanced Features) - Analytics and risk tools

**Estimated Total Time:** 3-4 weeks for complete implementation

**Key Benefits:**
- ✅ Shared core logic (80% code reuse)
- ✅ Client-side execution (instant feedback)
- ✅ Strategy validation workflow (backtest → paper trade → live)
- ✅ Full control over execution logic
- ✅ No backend costs
