# Configurable Indicator Parameters - Implementation Plan

## Overview
Enable custom indicator parameters to flow from UI through to server-side calculation, allowing users to configure SMA periods, RSI periods, and other indicator settings that affect the actual calculations.

## Current Problem

**What's Broken:**
- BacktestPanel allows users to configure `fastPeriod: 50, slowPeriod: 200`
- These parameters are stored in strategy config but NEVER sent to Market API
- Market API returns fixed indicators with generic names (`fast_ma`, `slow_ma`)
- Strategies look for period-specific names (`ma50`, `ma200`) and fail to find them
- Result: User configuration has no effect on actual indicator calculations

**Architecture Gap:**
```
Current (Broken):
BacktestPanel → evaluators: ["moving-averages"] → Market API → fixed indicators

Needed:
BacktestPanel → evaluators: [{id: "moving-averages", params: {fast: 50, slow: 200}}]
  → market-api.ts → Market API Server → custom calculated indicators
```

## Implementation Strategy

**Order of Implementation:**
1. Market API Server changes (FIRST - separate plan in MARKET_API_INDICATOR_PARAMS.md)
2. Client-side type system updates
3. Client-side component changes
4. Testing and validation

**No Backward Compatibility Needed:**
- Both client apps (sc-app and rs-charts) can be updated simultaneously
- Clean break, simpler implementation

---

## Data Structure Note

**IMPORTANT:** The Market API returns indicators nested within each candle with timestamps already included:

```typescript
{
  candles: [
    {
      timestamp: 1704067200000,
      open: 42000,
      close: 42500,
      evaluations: [{
        id: "moving-averages",
        params: { fastPeriod: 20, slowPeriod: 100 },
        values: [
          { name: "ma20", timestamp: 1704067200000, value: 93245.50 },
          { name: "ma100", timestamp: 1704067200000, value: 94876.23 }
        ]
      }]
    }
  ]
}
```

**No client-side changes needed for timestamps** - they're already part of the API response structure. The changes in this plan focus solely on passing parameter configurations from UI to API.

---

## Phase 1: Type System & Data Models

### 1.1 Update Core Types
**File:** `app/types/trading.ts`

**Add new interface:**
```typescript
export interface EvaluatorConfig {
  id: string;
  params?: Record<string, any>;
}
```

**Update BacktestConfig:**
```typescript
export interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  granularity: Granularity;
  startingBalance: number;
  strategy: TradingStrategy;
  evaluators: EvaluatorConfig[];  // CHANGED: from string[] to EvaluatorConfig[]
}
```

### 1.2 Create Indicator Parameter Types
**File:** `app/types/indicators.ts` (NEW FILE)

```typescript
/**
 * Parameter definitions for common technical indicators
 */

export interface MovingAverageParams {
  fastPeriod: number;
  slowPeriod: number;
  type?: 'sma' | 'ema';
}

export interface RSIParams {
  period: number;
  overbought?: number;  // Default: 70
  oversold?: number;    // Default: 30
}

export interface MACDParams {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface BollingerBandsParams {
  period: number;
  stdDev: number;
}

export interface StochasticParams {
  kPeriod: number;
  dPeriod: number;
  smooth: number;
}

export type IndicatorParams =
  | MovingAverageParams
  | RSIParams
  | MACDParams
  | BollingerBandsParams
  | StochasticParams
  | Record<string, any>;  // Allow custom indicators
```

---

## Phase 2: Component Layer Changes

### 2.1 BacktestPanel Component
**File:** `app/components/backtesting/BacktestPanel.tsx`

**Update lines 101-106:**

**BEFORE:**
```typescript
// Get evaluators needed for the strategy
const evaluators: string[] = [];
if (strategyType === "sma") {
  evaluators.push("moving-averages");
} else if (strategyType === "rsi") {
  evaluators.push("rsi");
}
```

**AFTER:**
```typescript
// Get evaluators with parameters for the strategy
const evaluators: EvaluatorConfig[] = [];
if (strategyType === "sma") {
  evaluators.push({
    id: "moving-averages",
    params: {
      fastPeriod: strategyConfig.fastPeriod,
      slowPeriod: strategyConfig.slowPeriod,
    }
  });
} else if (strategyType === "rsi") {
  evaluators.push({
    id: "rsi",
    params: {
      period: strategyConfig.period || 14,
    }
  });
}
```

**Update import:**
```typescript
import type { Granularity, EvaluatorConfig } from "~/types/trading";
```

### 2.2 Strategy Selector (Optional Enhancement)
**File:** `app/components/backtesting/StrategySelector.tsx`

Consider adding metadata about indicator requirements:
```typescript
const STRATEGY_METADATA = {
  sma: {
    requiredIndicators: ['moving-averages'],
    defaultParams: { fastPeriod: 50, slowPeriod: 200 }
  },
  rsi: {
    requiredIndicators: ['rsi'],
    defaultParams: { period: 14 }
  }
};
```

---

## Phase 3: Hook Layer

### 3.1 useBacktesting Hook
**File:** `app/hooks/useBacktesting.ts`

**Line 86:** Type signature already correct if BacktestConfig updated
- No code changes needed
- Just ensure TypeScript compilation passes

---

## Phase 4: Service Layer

### 4.1 BacktestingEngine
**File:** `app/services/tradingEngine/BacktestingEngine.ts`

**Line 45:** Update type signature
```typescript
async loadHistoricalData(
  config: BacktestConfig
): Promise<void> {
  await this.indicatorDataLoader.loadIndicatorData(
    config.symbol,
    config.granularity,
    config.startDate,
    config.endDate,
    config.evaluators  // Now EvaluatorConfig[]
  );
}
```

### 4.2 IndicatorDataLoader
**File:** `app/services/indicators/IndicatorDataLoader.ts`

**Update method signature (line 58 area):**
```typescript
async loadIndicatorData(
  symbol: string,
  granularity: Granularity,
  startDate: Date,
  endDate: Date,
  evaluators: EvaluatorConfig[]  // CHANGED from string[]
): Promise<CandleWithIndicators[]> {
  // ... existing code

  const candles = await this.marketAPI.fetchPriceData(
    symbol,
    granularity,
    startDate.getTime(),
    endDate.getTime(),
    undefined,
    evaluators  // Pass EvaluatorConfig[] to API
  );

  // ... rest of method
}
```

---

## Phase 5: API Client Layer

### 5.1 market-api.ts Updates
**File:** `functions/lib/market-api.ts`

**Update method signature (lines 53-60):**

**BEFORE:**
```typescript
async fetchPriceData(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
  onProgress?: (message: string) => void,
  evaluators?: string[]
): Promise<PriceCandle[]>
```

**AFTER:**
```typescript
async fetchPriceData(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
  onProgress?: (message: string) => void,
  evaluators?: EvaluatorConfig[]  // CHANGED
): Promise<PriceCandle[]>
```

**Update request building (lines 228-231):**

**BEFORE:**
```typescript
// Add evaluators if provided
if (evaluators && evaluators.length > 0) {
  params.append("evaluators", evaluators.join(","));
}
```

**AFTER:**
```typescript
// Add evaluators with params if provided
if (evaluators && evaluators.length > 0) {
  // Serialize as JSON for complex parameter passing
  params.append("evaluators", JSON.stringify(evaluators));
}
```

**Add import:**
```typescript
import type { EvaluatorConfig } from '../app/types/trading';
```

---

## Phase 6: Strategy Layer Updates

### 6.1 SMAStrategy
**File:** `app/services/strategies/SMAStrategy.ts`

**Lines 62-63: Already correct!**
```typescript
const fastMA = maValues[`ma${this.fastPeriod}`];  // e.g., ma50
const slowMA = maValues[`ma${this.slowPeriod}`];  // e.g., ma200
```

This code expects period-specific names, which is exactly what the updated Market API will return.

**No changes needed** ✓

### 6.2 RSIStrategy
**File:** `app/services/strategies/RSIStrategy.ts`

**Line 51:** Verify naming convention
```typescript
const rsiValue = rsi.rsi;  // May need to be rsi.rsi14 if period-specific
```

**Update if needed:**
```typescript
const rsiValue = rsi[`rsi${this.period}`] || rsi.rsi;
```

---

## Phase 7: Testing

### 7.1 Unit Tests

**Test evaluator config creation:**
```typescript
// test: BacktestPanel creates correct evaluator config
const config = createBacktestConfig({
  strategyType: 'sma',
  strategyConfig: { fastPeriod: 20, slowPeriod: 100 }
});

expect(config.evaluators).toEqual([{
  id: 'moving-averages',
  params: { fastPeriod: 20, slowPeriod: 100 }
}]);
```

**Test API serialization:**
```typescript
// test: market-api correctly serializes evaluators
const url = buildUrl(/* ... */, [{
  id: 'moving-averages',
  params: { fastPeriod: 20, slowPeriod: 100 }
}]);

expect(url).toContain('evaluators=%5B%7B%22id%22%3A%22moving-averages%22');
```

### 7.2 Integration Tests

**Test full backtest flow:**
```typescript
// test: Custom SMA periods flow through to strategy
const result = await runBacktest({
  symbol: 'BTC-USD',
  strategy: 'sma',
  strategyConfig: { fastPeriod: 20, slowPeriod: 100 },
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Verify indicators were calculated with correct periods
expect(result.candles[0].evaluations[0].values).toContainEqual({
  name: 'ma20',
  value: expect.any(Number)
});
```

### 7.3 Manual Testing Checklist

- [ ] Configure SMA strategy with default periods (50/200)
- [ ] Run backtest, verify trades executed
- [ ] Change to custom periods (20/100)
- [ ] Run backtest, verify different behavior
- [ ] Check trade markers appear on chart
- [ ] Configure RSI strategy with period 21
- [ ] Run backtest, verify custom RSI used
- [ ] Test multiple indicators simultaneously
- [ ] Verify indicator values in candle data

---

## Expected Behavior After Implementation

### Before (Broken)
1. User sets fastPeriod=20, slowPeriod=100 in UI
2. Backend receives: `evaluators: ["moving-averages"]`
3. Market API returns: `fast_ma: 93439`, `slow_ma: 95198` (fixed periods)
4. Strategy looks for: `ma20`, `ma100` → **NOT FOUND**
5. No trades executed

### After (Working)
1. User sets fastPeriod=20, slowPeriod=100 in UI
2. Backend receives: `evaluators: [{id: "moving-averages", params: {fastPeriod: 20, slowPeriod: 100}}]`
3. Market API calculates with periods 20 and 100
4. Market API returns: `ma20: 93245`, `ma100: 94876`
5. Strategy finds: `ma20`, `ma100` → **FOUND**
6. Trades executed based on 20/100 crossover

---

## Files to Modify

### Client-Side (9 files)
1. `app/types/trading.ts` - Add EvaluatorConfig, update BacktestConfig
2. `app/types/indicators.ts` - NEW FILE with param types
3. `app/components/backtesting/BacktestPanel.tsx` - Build evaluator configs
4. `app/components/backtesting/StrategySelector.tsx` - Optional metadata
5. `app/hooks/useBacktesting.ts` - Type updates
6. `app/services/tradingEngine/BacktestingEngine.ts` - Type updates
7. `app/services/indicators/IndicatorDataLoader.ts` - Type updates, pass configs
8. `functions/lib/market-api.ts` - Serialize evaluator configs
9. `app/services/strategies/RSIStrategy.ts` - Verify naming convention

### Server-Side
See separate document: `MARKET_API_INDICATOR_PARAMS.md`

### Testing (2 files)
10. Unit tests for evaluator configs
11. Integration test for full flow

---

## Implementation Timeline

**Estimated Time: 4-5 hours** (client-side only, assuming server already done)

1. **Type System** (30 min)
   - Create types/indicators.ts
   - Update types/trading.ts

2. **Component Layer** (45 min)
   - Update BacktestPanel.tsx
   - Optional StrategySelector.tsx updates

3. **Service Layer** (1 hour)
   - Update BacktestingEngine.ts
   - Update IndicatorDataLoader.ts
   - Update market-api.ts

4. **Strategy Layer** (30 min)
   - Verify SMAStrategy.ts
   - Update RSIStrategy.ts if needed

5. **Testing** (1.5 hours)
   - Write unit tests
   - Write integration test
   - Manual testing with various configs

6. **Buffer** (30 min)
   - Bug fixes
   - Edge cases

---

## Success Criteria

✅ User configures SMA with fastPeriod=20, slowPeriod=100 in UI
✅ Config flows through to Market API as JSON params
✅ Market API calculates indicators with periods 20 and 100
✅ Market API returns `ma20` and `ma100` with correct values
✅ Strategy finds indicators and executes trades
✅ Backtest results show trades based on 20/100 crossover
✅ Chart displays trade markers at correct positions
✅ Different parameter values produce different backtest results

---

## Dependencies

**Must be completed FIRST:**
- Market API Server modifications (see MARKET_API_INDICATOR_PARAMS.md)

**Blocks:**
- Any feature that relies on custom indicator parameters
- Advanced strategy development
- Strategy optimization tools

---

## Notes

- No backward compatibility needed (clean break)
- Both sc-app and rs-charts will be updated together
- Server changes must be deployed before client changes
- Consider adding parameter validation (min/max values)
- Future: Add indicator parameter presets/templates
