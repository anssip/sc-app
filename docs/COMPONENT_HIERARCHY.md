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
    │                   │       ├── ChartHeader
    │                   │       │   ├── Symbol Selector
    │                   │       │   ├── Granularity Selector
    │                   │       │   └── Remove Button
    │                   │       │
    │                   │       └── SCChart
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
```

## Props Flow

```
ChartApp
├── currentLayout: PanelLayout ─────┐
└── onLayoutChange: function        │
                                    │
                                    ▼
                            ChartPanel
                            ├── layout: PanelLayout
                            ├── layoutId?: string
                            └── onLayoutChange: function
                                    │
                                    ▼
                            ChartContainer
                            ├── config: ChartConfig
                            ├── layoutId?: string
                            ├── onSymbolChange?: function
                            └── onConfigUpdate?: function
                                    │
                                    ▼
                                SCChart
                                ├── firestore: Firestore
                                ├── initialState: any
                                ├── chartId?: string
                                └── onReady/onError: functions
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
└── LayoutProvider (optional - not currently used)
    └── Would provide: { currentLayoutId, setCurrentLayoutId }
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

## Nested Component Example (Horizontal Split)

```
ChartPanel
└── PanelGroup (horizontal)
    ├── Panel (50%)
    │   └── ChartContainer
    │       ├── ChartHeader [BTC-USD ▼] [1H ▼] [✕]
    │       └── SCChart
    │
    ├── PanelResizeHandle ║
    │
    └── Panel (50%)
        └── PanelGroup (vertical)
            ├── Panel (50%)
            │   └── ChartContainer
            │       ├── ChartHeader [ETH-USD ▼] [1D ▼] [✕]
            │       └── SCChart
            │
            ├── PanelResizeHandle ═
            │
            └── Panel (50%)
                └── ChartContainer
                    ├── ChartHeader [SOL-USD ▼] [4H ▼] [✕]
                    └── SCChart
```
