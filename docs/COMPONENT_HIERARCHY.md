# React Component Hierarchy Diagram

## Component Tree Structure

```
App (Root)
│
├── AuthProvider (Context)
│   │
│   └── useAuth() hook
│
└── Routes
    │
    ├── /chart-app
    │   └── ChartApp
    │       ├── LayoutSelector
    │       │   ├── Layout Presets (Single/Double/Triple)
    │       │   ├── Saved Layouts List
    │       │   └── Save Layout Dialog
    │       │
    │       └── ChartPanel
    │           └── PanelGroup (react-resizable-panels)
    │               └── renderPanelGroup() [recursive]
    │                   ├── Panel (leaf)
    │                   │   └── ChartContainer
    │                   │       ├── ChartSettingsProvider (Context)
    │                   │       │   └── useChartSettings() hook
    │                   │       │
    │                   │       ├── ChartHeader
    │                   │       │   └── ChartToolbar
    │                   │       │       ├── Symbol Selector (reads/writes context)
    │                   │       │       ├── Granularity Selector (reads/writes context)
    │                   │       │       └── Action Buttons
    │                   │       │
    │                   │       └── SCChart (listens to symbolChange events)
    │                   │           ├── Context integration for symbol/granularity sync
    │                   │           └── @anssipiirainen/sc-charts (3rd party)
    │                   │
    │                   └── Panel (split)
    │                       ├── PanelGroup
    │                       ├── PanelResizeHandle
    │                       └── [recursive children...]
    │
    └── /layout-manager
        └── LayoutManager
            ├── Layout List
            ├── Save/Delete Controls
            └── ChartPanel (same as above)
```

## Component Relationships & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          Repository                             │
│  (Singleton service - handles Firestore operations)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      useRepository()                            │
│         (Hook - provides repository instance)                   │
└────────────────┬───────────────────────────────────┬────────────┘
                 │                                   │
                 ▼                                   ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│      useLayouts()           │     │       useCharts()           │
│  (Manages layout CRUD)      │     │  (Manages chart updates)    │
└─────────────────────────────┘     └─────────────────────────────┘
                 │                                   │
                 ▼                                   ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│     LayoutSelector          │     │     ChartContainer          │
│  (Layout management UI)     │     │   (Individual chart UI)     │
└─────────────────────────────┘     └─────────────────────────────┘
                                                    │
                                                    ▼
                                    ┌─────────────────────────────┐
                                    │   ChartSettingsProvider     │
                                    │  (Context for chart state)  │
                                    └─────────────────────────────┘
                                                    │
                                                    ▼
                                    ┌─────────────────────────────┐
                                    │   useChartSettings()        │
                                    │ (Hook for symbol/granularity)│
                                    └─────────────────────────────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                              ┌─────────┐   ┌─────────────┐   ┌─────────┐
                              │ChartToolbar │   │   SCChart   │   │Persistence│
                              │(reads UI)   │   │(writes ctx) │   │(Firestore)│
                              │(calls API)  │   │(via events) │   │           │
                              └─────────────┘   └─────────────┘   └─────────────┘
```

## Props Flow & Context Integration

```
ChartApp
├── currentLayout: PanelLayout ─────┐
├── onLayoutChange: function        │
└── changeType: "chart-data" | "structure"
                                    │
                                    ▼
                            ChartPanel
                            ├── layout: PanelLayout
                            ├── layoutId?: string
                            └── onLayoutChange: (layout, changeType) => void
                                    │
                                    ▼
                            ChartContainer
                            ├── config: ChartConfig
                            ├── layoutId?: string
                            └── onConfigUpdate?: function
                                    │
                                    ▼
                        ChartSettingsProvider
                        ├── initialSettings: { symbol, granularity }
                        ├── onSettingsChange: (settings, chartId) => void
                        └── Context Value: { settings } (read-only for UI)
                                    │
                            ┌───────┼───────┐
                            ▼               ▼
                    ChartToolbar        SCChart
                    ├── chartId         ├── chartId
                    ├── chartApiRef     ├── useChartSettings()
                    ├── reads context   ├── symbolChange listener
                    └── calls Chart API └── writes to context
```

## Context-Based State Management

```
Simplified Chart Settings Flow:
User Action → ChartToolbar → Chart API → Chart Visual Update
                                 │
                                 ▼
                          symbolChange Event → SCChart → Context Update
                                                              │
                                                              ▼
                                                         Persistence
                                                              │
                                                              ▼
                                                    ChartToolbar UI Update

Key Benefits:
- Single direction: Only SCChart writes to context
- No redundant context updates
- Chart API is the source of truth
- symbolChange events drive all context updates
```

## Layout Data Structure

```
PanelLayout (UI representation)
├── type: "chart" | "group"
├── id: string
├── direction?: "horizontal" | "vertical"
├── children?: PanelLayout[]
├── chart?: ChartConfig
├── defaultSize?: number
└── minSize?: number

           ↕ (conversion)

LayoutNode (Firestore representation)
├── type: "chart" | "split"
├── id?: string
├── direction?: "horizontal" | "vertical"
├── children?: LayoutNode[]
├── chart?: ChartConfig (embedded)
├── chartId?: string (deprecated)
└── ratio?: number
```

## Context Providers

```
App
│
├── AuthProvider
│   └── Provides: { user, signIn, signOut, loading }
│
└── ChartApp
    └── For each chart:
        └── ChartSettingsProvider
            ├── Provides: { settings, setSymbol, setGranularity }
            ├── Manages: per-chart state (symbol, granularity)
            ├── Multi-chart support: chartId-based state isolation
            └── Persistence: onSettingsChange callback
```

## Chart Settings Context API

```
interface ChartSettings {
  symbol: string;           // Trading pair (e.g., "BTC-USD")
  granularity: Granularity; // Timeframe (e.g., "ONE_HOUR")
  // Future: indicators, theme, timezone
}

useChartSettings(chartId?: string) returns:
├── settings: ChartSettings
├── setSymbol: (symbol: string) => void
├── setGranularity: (granularity: Granularity) => void
├── setSettings: (partial: Partial<ChartSettings>) => void
├── registerChart: (initialSettings: ChartSettings) => void
└── unregisterChart: () => void
```

## Hook Dependencies

```
useRepository()
├── Depends on: useAuth() for userId
└── Provides: repository instance

useLayouts()
├── Depends on: useRepository()
└── Manages: layout CRUD operations

useCharts()
├── Depends on: useRepository()
└── Manages: chart updates (within layouts)

useSymbols()
├── Depends on: useRepository()
└── Provides: available trading symbols

useUserSettings()
├── Depends on: useRepository()
└── Manages: user preferences

useChartSettings() [NEW]
├── Depends on: ChartSettingsProvider context
├── Manages: per-chart symbol/granularity state
├── Supports: multi-chart scenarios with chartId
├── Triggers: persistence via onSettingsChange callback
└── Usage: ChartToolbar (read-only), SCChart (write via events)
```

## State Management Strategy

```
Chart Data Changes:
├── Source: ChartToolbar user interactions
├── Flow: ChartToolbar → Chart API → symbolChange Event → Context → Persistence
├── Single Direction: Only SCChart writes to context (via events)
├── Persistence: Chart-specific updates to Firestore
└── Auto-save: DISABLED (prevents race conditions)

Layout Structural Changes:
├── Source: Panel resizing, splits, layout modifications
├── Flow: ChartPanel → ChartApp → Layout auto-save
├── Persistence: Layout structure updates to Firestore
└── Auto-save: ENABLED (1 second debounce)

Change Type Detection:
├── "chart-data": Symbol/granularity changes → Chart persistence only
├── "structure": Panel resizes/splits → Layout auto-save only
└── Fine-grained updates prevent conflicts between persistence mechanisms
```

## Simple Visual ASCII Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                                   App                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                            ChartApp                              │  │
│  │  ┌─────────────────┐  ┌───────────────────────────────────────┐  │  │
│  │  │  LayoutSelector │  │            ChartPanel                 │  │  │
│  │  │  ┌───────────┐  │  │  ┌─────────────────────────────────┐  │  │  │
│  │  │  │ ▢ Single  │  │  │  │         PanelGroup              │  │  │  │
│  │  │  │ ▢ Double  │  │  │  │  ┌───────────┬───────────────┐  │  │  │  │
│  │  │  │ ▢ Triple  │  │  │  │  │  Chart 1  │    Chart 2    │  │  │  │  │
│  │  │  │-----------│  │  │  │  │ ┌───────┐ │  ┌─────────┐  │  │  │  │  │
│  │  │  │ ▼ Saved   │  │  │  │  │ │Header │ │  │ Header  │  │  │  │  │  │
│  │  │  │ • Layout1 │  │  │  │  │ ├───────┤ │  ├─────────┤  │  │  │  │  │
│  │  │  │ • Layout2 │  │  │  │  │ │       │ │  │         │  │  │  │  │  │
│  │  │  │-----------│  │  │  │  │ │SCChart│ │  │ SCChart │  │  │  │  │  │
│  │  │  │ [+ Save]  │  │  │  │  │ │       │ │  │         │  │  │  │  │  │
│  │  │  └───────────┘  │  │  │  │ └───────┘ │  └─────────┘  │  │  │  │  │
│  │  └─────────────────┘  │  │  └───────────┴───────────────┘  │  │  │  │
│  │                       │  └─────────────────────────────────┘  │  │  │
│  └───────────────────────────────────────────────────────────────┘  │  │
└────────────────────────────────────────────────────────────────────────┘

Legend:
▢ = Layout preset button
▼ = Expandable section
• = Saved layout item
[+ Save] = Action button
│├└┌┐┘┬┴─ = Box drawing characters
```

## Context-Based Chart State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          User Interaction                              │
│  User selects "ETH-USD" from symbol dropdown in ChartToolbar          │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ChartToolbar                                     │
│  Calls Chart API directly: chartApiRef.current.setSymbol("ETH-USD")   │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Chart API                                       │
│  Changes symbol to ETH-USD, updates chart visualization                │
│  Fires symbolChange event when change is complete                      │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      symbolChange Event                                │
│  SCChart receives event and updates context with new symbol            │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ChartSettingsContext │ Persistence │ │  ChartToolbar   │
│                 │ │             │ │                 │
│ Context state   │ │ChartContainer│ │ UI automatically│
│ updated with    │ │onSettingsChange│ │ reflects new    │
│ symbol:         │ │             │ │ symbol via      │
│ "ETH-USD"       │ │ Saves to    │ │ context reading │
│                 │ │ Firestore   │ │                 │
│ Single source   │ │ (debounced) │ │ No direct state │
│ of truth for    │ │             │ │ management      │
│ chart state     │ │             │ │ needed          │
└─────────────────┘ └─────────────┘ └─────────────────┘

Benefits:
- No double writes to context
- Chart API is the authoritative source
- Context updates only from symbolChange events
- UI automatically stays in sync
```

## Multi-Chart Context Isolation

```
ChartApp Layout with 3 Charts:
┌─────────────────────────────────────────────────────────────────────────┐
│ ChartContainer A (chartId: "chart-123")                                │
│ ├── ChartSettingsProvider                                              │
│ │   ├── Context State: { symbol: "BTC-USD", granularity: "ONE_HOUR" }  │
│ │   └── useChartSettings("chart-123")                                   │
│ ├── ChartToolbar (reads/writes Context A)                              │
│ └── SCChart (syncs with Context A)                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ChartContainer B (chartId: "chart-456")                                │
│ ├── ChartSettingsProvider                                              │
│ │   ├── Context State: { symbol: "ETH-USD", granularity: "FOUR_HOUR" } │
│ │   └── useChartSettings("chart-456")                                   │
│ ├── ChartToolbar (reads/writes Context B)                              │
│ └── SCChart (syncs with Context B)                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ChartContainer C (chartId: "chart-789")                                │
│ ├── ChartSettingsProvider                                              │
│ │   ├── Context State: { symbol: "SOL-USD", granularity: "ONE_DAY" }   │
│ │   └── useChartSettings("chart-789")                                   │
│ ├── ChartToolbar (reads/writes Context C)                              │
│ └── SCChart (syncs with Context C)                                     │
└─────────────────────────────────────────────────────────────────────────┘

Each chart has isolated state - changing symbol in Chart A doesn't affect Chart B or C
```

## Nested Component Example (Horizontal Split)

```
ChartPanel
└── PanelGroup (horizontal)
    ├── Panel (50%)
    │   └── ChartContainer + ChartSettingsProvider
    │       ├── ChartHeader → ChartToolbar [BTC-USD ▼] [1H ▼] [✕]
    │       └── SCChart (with symbolChange listener)
    │
    ├── PanelResizeHandle ║
    │
    └── Panel (50%)
        └── PanelGroup (vertical)
            ├── Panel (50%)
            │   └── ChartContainer + ChartSettingsProvider
            │       ├── ChartHeader → ChartToolbar [ETH-USD ▼] [1D ▼] [✕]
            │       └── SCChart (with symbolChange listener)
            │
            ├── PanelResizeHandle ═
            │
            └── Panel (50%)
                └── ChartContainer + ChartSettingsProvider
                    ├── ChartHeader → ChartToolbar [SOL-USD ▼] [4H ▼] [✕]
                    └── SCChart (with symbolChange listener)
```
