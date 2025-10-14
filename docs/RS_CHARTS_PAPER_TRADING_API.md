# rs-charts API Enhancements for Paper Trading & Backtesting Support

This document outlines the API additions needed in the rs-charts library to support both paper trading and backtesting visualization features.

**Note:** The same visualization APIs are used for both paper trading (real-time) and backtesting (historical replay). The only difference is the timing of data updates - paper trading uses live data while backtesting can fast-forward through historical data.

## Architecture & Separation of Concerns

**Important:** This API design follows a clear separation between visualization (rs-charts) and business logic (sc-app):

### rs-charts Responsibilities (Visualization Layer)
- ✅ Display trade markers, price lines, and overlays
- ✅ Handle chart interactions (clicks, hovers, drags)
- ✅ Emit events with price/timestamp data
- ✅ Provide visual feedback (crosshairs, previews)

### sc-app Responsibilities (Business Logic Layer)
- ✅ Show order entry forms and confirmation dialogs
- ✅ Manage order types, quantities, and validation
- ✅ Execute trades and update positions
- ✅ Handle account balances and P&L calculations
- ✅ Persist trading data to Firestore

**Key Principle:** rs-charts provides the **interaction layer**, sc-app provides the **order entry UI and execution logic**.

## Priority Overview

**Must Have (P0):**
1. Trade markers (buy/sell flags)
2. Price level lines
3. Position overlay
4. Basic events (price-clicked, marker-clicked)

**Should Have (P1):**
5. Trade zones
6. Annotations
7. Click-to-trade
8. Enhanced crosshair events

**Nice to Have (P2):**
9. Equity curve overlay
10. Risk zones
11. Time markers
12. Order depth visualization

---

## 1. Trade Markers / Execution Flags

### Purpose
Display buy/sell execution points directly on the chart with visual markers (arrows, flags, etc.)

### API Methods

```typescript
// Add a trade marker to the chart
addTradeMarker(config: TradeMarkerConfig): string

// Remove a specific trade marker
removeTradeMarker(markerId: string): void

// Update an existing trade marker
updateTradeMarker(markerId: string, updates: Partial<TradeMarkerConfig>): void

// Get all trade markers
getTradeMarkers(): TradeMarker[]

// Remove all trade markers
clearTradeMarkers(): void
```

### TypeScript Interfaces

```typescript
interface TradeMarkerConfig {
  id?: string;                    // Auto-generated if not provided
  timestamp: number;              // Unix timestamp (X-axis position)
  price: number;                  // Price level (Y-axis position)
  side: 'buy' | 'sell';          // Trade direction
  shape?: 'arrow' | 'flag' | 'triangle' | 'circle';  // Marker shape
  color?: string;                 // Default: green for buy, red for sell
  size?: 'small' | 'medium' | 'large';  // Marker size
  text?: string;                  // Optional label text (e.g., "Entry")
  tooltip?: {                     // Hover information
    title: string;                // e.g., "Buy BTC-USD"
    details: string[];            // e.g., ["Qty: 0.5", "Price: $45,000"]
  };
  interactive?: boolean;          // Enable click/hover events
  zIndex?: number;                // Layer ordering
}

interface TradeMarker extends TradeMarkerConfig {
  id: string;                     // Always present after creation
}
```

### Events

```typescript
// Emitted when a trade marker is clicked
chart.on('trade-marker-clicked', (event: {
  markerId: string;
  marker: TradeMarker;
}) => void);

// Emitted when mouse hovers over a trade marker
chart.on('trade-marker-hovered', (event: {
  markerId: string;
  marker: TradeMarker;
}) => void);
```

### Visual Examples
- **Buy markers**: Green upward arrow below the candle
- **Sell markers**: Red downward arrow above the candle
- **Tooltip**: Shows trade details on hover

---

## 2. Price Level Lines

### Purpose
Display horizontal lines at specific price levels for pending orders, stop losses, take profits, and position entry prices.

### API Methods

```typescript
// Add a horizontal price line
addPriceLine(config: PriceLineConfig): string

// Remove a specific price line
removePriceLine(lineId: string): void

// Update an existing price line
updatePriceLine(lineId: string, updates: Partial<PriceLineConfig>): void

// Get all price lines
getPriceLines(): PriceLine[]

// Remove all price lines
clearPriceLines(): void
```

### TypeScript Interfaces

```typescript
interface PriceLineConfig {
  id?: string;                    // Auto-generated if not provided
  price: number;                  // Y-axis price level
  color?: string;                 // Line color (default: gray)
  lineStyle?: 'solid' | 'dashed' | 'dotted';  // Line style
  lineWidth?: number;             // Line thickness (default: 1)
  label?: {                       // Optional label
    text: string;                 // e.g., "Limit Order @ $45,000"
    position: 'left' | 'right';   // Label position
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  };
  draggable?: boolean;            // Allow user to drag the line up/down
  extendLeft?: boolean;           // Extend line to left edge
  extendRight?: boolean;          // Extend line to right edge (default: true)
  interactive?: boolean;          // Enable click/hover events
  showPriceLabel?: boolean;       // Show price on Y-axis
  metadata?: any;                 // Store custom data (e.g., order ID)
  zIndex?: number;                // Layer ordering
}

interface PriceLine extends PriceLineConfig {
  id: string;
  price: number;
}
```

### Events

```typescript
// Emitted when a draggable price line is moved
chart.on('price-line-dragged', (event: {
  lineId: string;
  oldPrice: number;
  newPrice: number;
  line: PriceLine;
}) => void);

// Emitted when a price line is clicked
chart.on('price-line-clicked', (event: {
  lineId: string;
  line: PriceLine;
}) => void);

// Emitted when mouse hovers over a price line
chart.on('price-line-hovered', (event: {
  lineId: string;
  line: PriceLine;
}) => void);
```

### Use Cases
- **Pending limit orders**: Dashed blue line
- **Stop loss**: Red solid line
- **Take profit**: Green solid line
- **Position entry**: Yellow dotted line

---

## 3. Position Overlay

### Purpose
Display current position information directly on the chart (quantity, entry price, P&L).

### API Methods

```typescript
// Show position overlay on chart
showPositionOverlay(config: PositionOverlayConfig): void

// Hide position overlay
hidePositionOverlay(): void

// Update position overlay data
updatePositionOverlay(updates: Partial<PositionOverlayConfig>): void

// Get current position overlay state
getPositionOverlay(): PositionOverlayConfig | null
```

### TypeScript Interfaces

```typescript
interface PositionOverlayConfig {
  symbol: string;                 // e.g., "BTC-USD"
  quantity: number;               // Position size
  side: 'long' | 'short';        // Position direction
  entryPrice: number;             // Average entry price
  currentPrice: number;           // Current market price
  unrealizedPnL: number;          // P&L in dollars
  unrealizedPnLPercent: number;   // P&L as percentage
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';  // Overlay position
  showEntryLine?: boolean;        // Show line at entry price
  entryLineColor?: string;
  backgroundColor?: string;       // Overlay background color
  textColor?: string;             // Text color
  opacity?: number;               // Overlay opacity (0-1)
  compact?: boolean;              // Show compact view
}
```

### Visual Example
```
┌─────────────────────────┐
│ LONG BTC-USD            │
│ Qty: 0.5 @ $45,000      │
│ P&L: +$2,500 (+5.56%)   │
└─────────────────────────┘
```

---

## 4. Trade Zone Visualization

### Purpose
Highlight the duration and price range of a completed trade with a semi-transparent overlay.

### API Methods

```typescript
// Add a trade zone to highlight trade duration
addTradeZone(config: TradeZoneConfig): string

// Remove a specific trade zone
removeTradeZone(zoneId: string): void

// Update an existing trade zone
updateTradeZone(zoneId: string, updates: Partial<TradeZoneConfig>): void

// Get all trade zones
getTradeZones(): TradeZone[]

// Remove all trade zones
clearTradeZones(): void
```

### TypeScript Interfaces

```typescript
interface TradeZoneConfig {
  id?: string;
  startTimestamp: number;         // Trade entry time
  endTimestamp: number;           // Trade exit time
  entryPrice: number;             // Entry price level
  exitPrice: number;              // Exit price level
  fillColor?: string;             // Semi-transparent background (default: green/red based on P&L)
  fillOpacity?: number;           // Opacity 0-1 (default: 0.2)
  borderColor?: string;           // Border color
  borderWidth?: number;           // Border thickness
  showPnL?: boolean;              // Display P&L text in zone (default: true)
  metadata?: {
    quantity: number;
    pnl: number;
    pnlPercent: number;
    side: 'long' | 'short';
    fees?: number;
  };
}

interface TradeZone extends TradeZoneConfig {
  id: string;
}
```

### Visual Example
A semi-transparent green rectangle from entry time/price to exit time/price with "P&L: +$500" displayed inside.

---

## 5. Click-to-Trade Interface

### Purpose
Enable users to interact with price levels by clicking directly on the chart. **Note:** This feature only handles chart interaction and emits events. All order entry UI (forms, confirmations) is handled by sc-app.

### What rs-charts DOES:
- ✅ Detect clicks on chart at specific price levels
- ✅ Show visual feedback (crosshair, price preview)
- ✅ Emit events with price/timestamp data
- ✅ Handle keyboard modifiers (Shift for buy/sell toggle)

### What rs-charts does NOT do:
- ❌ Show order entry forms
- ❌ Show confirmation dialogs
- ❌ Manage quantities or order types
- ❌ Execute trades

### API Methods

```typescript
// Enable click-to-trade functionality
enableClickToTrade(config: ClickToTradeConfig): void

// Disable click-to-trade functionality
disableClickToTrade(): void

// Check if click-to-trade is enabled
isClickToTradeEnabled(): boolean
```

### TypeScript Interfaces

```typescript
interface ClickToTradeConfig {
  enabled: boolean;                     // Enable/disable feature
  showCrosshair?: boolean;              // Show enhanced crosshair cursor
  showPriceLabel?: boolean;             // Show price label on Y-axis when hovering
  showOrderPreview?: boolean;           // Show preview line at hover position
  clickBehavior?: 'single' | 'double' | 'hold';  // Single-click, double-click, or click-and-hold
  defaultSide?: 'buy' | 'sell';        // Default order side (can be toggled with Shift)
  allowSideToggle?: boolean;            // Allow Shift key to toggle buy/sell
  onOrderRequest: (orderData: {
    price: number;                      // Price level clicked
    timestamp: number;                  // Time coordinate clicked
    side: 'buy' | 'sell';              // Buy or sell (based on defaultSide + Shift)
    modifiers: {                        // Keyboard modifiers pressed during click
      shift: boolean;
      ctrl: boolean;
      alt: boolean;
    };
  }) => void;
}
```

### Events

```typescript
// Emitted when user clicks to request an order placement
// sc-app should listen to this and show order entry UI
chart.on('order-request', (event: {
  price: number;
  timestamp: number;
  side: 'buy' | 'sell';
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
  };
}) => void);

// Emitted when hovering over price level in click-to-trade mode
chart.on('price-hover', (event: {
  price: number;
  timestamp: number;
}) => void);
```

### Usage Flow

1. **rs-charts**: User clicks on chart at price $45,000
2. **rs-charts**: Emits `order-request` event with price/timestamp
3. **sc-app**: Receives event, shows order entry modal/panel
4. **sc-app**: User fills form (quantity, order type, etc.)
5. **sc-app**: User confirms, executes trade via paper trading engine
6. **sc-app**: Adds trade marker to chart via `addTradeMarker()`

---

## 6. Annotations

### Purpose
Add custom text notes, alerts, or milestones to the chart.

### API Methods

```typescript
// Add an annotation to the chart
addAnnotation(config: AnnotationConfig): string

// Remove a specific annotation
removeAnnotation(annotationId: string): void

// Update an existing annotation
updateAnnotation(annotationId: string, updates: Partial<AnnotationConfig>): void

// Get all annotations
getAnnotations(): Annotation[]

// Remove all annotations
clearAnnotations(): void
```

### TypeScript Interfaces

```typescript
interface AnnotationConfig {
  id?: string;
  timestamp: number;              // Time position
  price?: number;                 // Price position (if undefined, anchor to top/bottom)
  text: string;                   // Annotation text
  type?: 'note' | 'alert' | 'milestone' | 'custom';  // Annotation type
  position?: 'above' | 'below' | 'left' | 'right';   // Relative to point
  color?: string;                 // Text color
  backgroundColor?: string;       // Background color
  borderColor?: string;
  fontSize?: number;
  icon?: string;                  // SVG icon or emoji
  draggable?: boolean;            // Allow repositioning
  showLine?: boolean;             // Show line connecting to price level
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  zIndex?: number;
}

interface Annotation extends AnnotationConfig {
  id: string;
}
```

---

## 7. Enhanced Chart Events

### New Events for Trading

```typescript
// Emitted when user clicks on a specific price level
chart.on('price-clicked', (event: {
  price: number;
  timestamp: number;
  mouseX: number;
  mouseY: number;
}) => void);

// Emitted when user clicks on a specific time
chart.on('time-clicked', (event: {
  timestamp: number;
  price: number;
  mouseX: number;
  mouseY: number;
}) => void);

// Emitted when crosshair position changes
chart.on('crosshair-moved', (event: {
  price: number | null;
  timestamp: number | null;
  mouseX: number;
  mouseY: number;
}) => void);

// Emitted when user right-clicks on chart
chart.on('context-menu', (event: {
  price: number;
  timestamp: number;
  mouseX: number;
  mouseY: number;
}) => void);
```

---

## 8. Time Markers

### Purpose
Add vertical lines at specific timestamps to mark important events.

### API Methods

```typescript
// Add a vertical time marker
addTimeMarker(config: TimeMarkerConfig): string

// Remove a specific time marker
removeTimeMarker(markerId: string): void

// Update an existing time marker
updateTimeMarker(markerId: string, updates: Partial<TimeMarkerConfig>): void

// Get all time markers
getTimeMarkers(): TimeMarker[]

// Remove all time markers
clearTimeMarkers(): void
```

### TypeScript Interfaces

```typescript
interface TimeMarkerConfig {
  id?: string;
  timestamp: number;              // Unix timestamp
  label?: string;                 // Optional label text
  color?: string;                 // Line color
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineWidth?: number;
  showLabel?: boolean;            // Show label at top/bottom
  labelPosition?: 'top' | 'bottom';
  zIndex?: number;
}

interface TimeMarker extends TimeMarkerConfig {
  id: string;
}
```

---

## 9. Risk Zones

### Purpose
Highlight price ranges that represent risk areas (e.g., stop loss zones, liquidation zones).

### API Methods

```typescript
// Add a risk zone to the chart
addRiskZone(config: RiskZoneConfig): string

// Remove a specific risk zone
removeRiskZone(zoneId: string): void

// Update an existing risk zone
updateRiskZone(zoneId: string, updates: Partial<RiskZoneConfig>): void

// Get all risk zones
getRiskZones(): RiskZone[]

// Remove all risk zones
clearRiskZones(): void
```

### TypeScript Interfaces

```typescript
interface RiskZoneConfig {
  id?: string;
  startPrice: number;             // Lower price boundary
  endPrice: number;               // Upper price boundary
  label?: string;                 // e.g., "Stop Loss Zone"
  color?: string;                 // Zone color (default: red with transparency)
  opacity?: number;               // Fill opacity (0-1)
  pattern?: 'solid' | 'striped' | 'dotted';  // Fill pattern
  borderColor?: string;
  borderWidth?: number;
  extendLeft?: boolean;           // Extend to left edge
  extendRight?: boolean;          // Extend to right edge (default: true)
}

interface RiskZone extends RiskZoneConfig {
  id: string;
}
```

---

## 10. Equity Curve Overlay

### Purpose
Overlay portfolio equity curve on top of price chart for performance visualization.

### API Methods

```typescript
// Show equity curve overlay
showEquityCurve(data: EquityPoint[]): void

// Hide equity curve overlay
hideEquityCurve(): void

// Update equity curve data
updateEquityCurve(data: EquityPoint[]): void

// Check if equity curve is visible
isEquityCurveVisible(): boolean
```

### TypeScript Interfaces

```typescript
interface EquityPoint {
  timestamp: number;              // Unix timestamp
  equity: number;                 // Portfolio value at this time
}

interface EquityCurveConfig {
  data: EquityPoint[];
  color?: string;                 // Line color (default: blue)
  lineWidth?: number;             // Line thickness
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  showArea?: boolean;             // Fill area under curve
  areaColor?: string;             // Area fill color
  opacity?: number;               // Line/area opacity
  yAxisPosition?: 'left' | 'right' | 'separate';  // Y-axis placement
}
```

---

## 11. Drawdown Visualization

### Purpose
Highlight drawdown periods on the chart.

### API Methods

```typescript
// Show drawdown overlay
showDrawdown(data: DrawdownPoint[]): void

// Hide drawdown overlay
hideDrawdown(): void

// Update drawdown data
updateDrawdown(data: DrawdownPoint[]): void
```

### TypeScript Interfaces

```typescript
interface DrawdownPoint {
  timestamp: number;
  drawdownPercent: number;        // Negative percentage
}
```

---

## 12. Chart State Management for Trading

### Purpose
Save and restore all trading overlays for persistence.

### API Methods

```typescript
// Get complete trading state
getTradingState(): TradingChartState

// Restore trading state
setTradingState(state: TradingChartState): void

// Clear all trading overlays
clearTradingOverlays(): void
```

### TypeScript Interfaces

```typescript
interface TradingChartState {
  tradeMarkers: TradeMarker[];
  priceLines: PriceLine[];
  tradeZones: TradeZone[];
  annotations: Annotation[];
  timeMarkers: TimeMarker[];
  riskZones: RiskZone[];
  positionOverlay: PositionOverlayConfig | null;
  clickToTrade: ClickToTradeConfig | null;
}
```

---

## Implementation Priority

### Phase 1 (Must Have - P0)
1. **Trade Markers** - Essential for showing buy/sell executions
2. **Price Lines** - Critical for order visualization
3. **Position Overlay** - Important for position awareness
4. **Basic Events** - Required for interactivity

### Phase 2 (Should Have - P1)
5. **Trade Zones** - Nice visualization for completed trades
6. **Annotations** - Useful for trade notes
7. **Click-to-Trade** - Enhanced user experience
8. **Enhanced Events** - Better interaction handling

### Phase 3 (Nice to Have - P2)
9. **Equity Curve** - Advanced analytics
10. **Risk Zones** - Risk management visualization
11. **Time Markers** - Event marking
12. **Drawdown** - Performance analysis

---

## Example Usage

```typescript
// Example: Adding a buy trade marker
const markerId = chart.addTradeMarker({
  timestamp: 1699564800000,
  price: 45000,
  side: 'buy',
  shape: 'arrow',
  text: 'Entry',
  tooltip: {
    title: 'Buy BTC-USD',
    details: ['Qty: 0.5', 'Price: $45,000', 'Total: $22,500']
  }
});

// Example: Adding a stop loss price line
const lineId = chart.addPriceLine({
  price: 43000,
  color: '#ff0000',
  lineStyle: 'solid',
  label: {
    text: 'Stop Loss',
    position: 'right',
    backgroundColor: '#ff0000',
    textColor: '#ffffff'
  },
  draggable: true
});

// Listen for price line drag
chart.on('price-line-dragged', (event) => {
  console.log('Stop loss moved to:', event.newPrice);
  updateStopLoss(event.newPrice);
});

// Example: Show position overlay
chart.showPositionOverlay({
  symbol: 'BTC-USD',
  quantity: 0.5,
  side: 'long',
  entryPrice: 45000,
  currentPrice: 47000,
  unrealizedPnL: 1000,
  unrealizedPnLPercent: 4.44,
  position: 'top-left',
  showEntryLine: true
});

// Example: Enable click-to-trade (rs-charts only handles interaction)
chart.enableClickToTrade({
  enabled: true,
  showCrosshair: true,
  showPriceLabel: true,
  showOrderPreview: true,
  defaultSide: 'buy',
  allowSideToggle: true,  // Shift key toggles to sell
  onOrderRequest: (orderData) => {
    // rs-charts emits this event when user clicks
    // sc-app handles the order entry UI
    console.log(`Order requested at $${orderData.price} (${orderData.side})`);
  }
});

// Example: sc-app listens to order-request event
chart.on('order-request', (event) => {
  // sc-app shows order entry UI (modal, sidebar, etc.)
  showOrderEntryModal({
    initialPrice: event.price,
    initialSide: event.side,
    onConfirm: (order) => {
      // Execute trade through paper trading engine
      paperTradingEngine.placeOrder({
        symbol: 'BTC-USD',
        side: order.side,
        type: order.type,      // Market/Limit/Stop - set by user in modal
        quantity: order.quantity,  // Set by user in modal
        price: order.price,
      });

      // After execution, add visual marker to chart
      chart.addTradeMarker({
        timestamp: Date.now(),
        price: order.price,
        side: order.side,
        shape: 'arrow',
        tooltip: {
          title: `${order.side.toUpperCase()} BTC-USD`,
          details: [
            `Qty: ${order.quantity}`,
            `Price: $${order.price}`,
            `Type: ${order.type}`
          ]
        }
      });
    }
  });
});
```

---

## Notes

### General Guidelines
- All price values should be in the same units as the chart's price data
- All timestamps should be Unix timestamps in milliseconds
- Colors should support hex, rgb, rgba, and named colors
- All overlay elements should be properly layered (zIndex) to avoid conflicts
- All IDs should be unique and auto-generated if not provided
- Methods should handle invalid data gracefully with clear error messages

### Separation of Concerns
**Critical:** rs-charts should remain a pure visualization library:
- ❌ **No business logic**: No order execution, position management, or P&L calculations
- ❌ **No forms/dialogs**: No order entry forms, confirmation dialogs, or input validation
- ❌ **No data persistence**: No Firestore writes or account balance management
- ✅ **Pure visualization**: Only handle rendering, interaction, and events
- ✅ **Event emission**: Emit events with data, let sc-app handle the business logic
- ✅ **Visual feedback**: Show markers, lines, overlays based on data provided by sc-app

This separation ensures:
1. rs-charts remains reusable across different applications
2. Business logic stays in sc-app where it belongs
3. Testing is simpler (visual tests vs. business logic tests)
4. Changes to trading rules don't require rs-charts updates
