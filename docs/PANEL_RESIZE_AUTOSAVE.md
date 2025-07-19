# Panel Resize Auto-Save Feature

## Overview

This feature automatically saves panel dimensions to Firestore when users resize panels in the layout. The saved dimensions are restored when the layout is loaded again, preserving the user's preferred panel sizes.

## Implementation Details

### 1. Type Updates

Added size information to the layout types in `app/types/index.ts`:

- **ChartLayoutNode**: Added `size?: number` field to store panel size percentage (0-100)
- **SplitLayoutNode**: Added `sizes?: number[]` field to store size percentages for each child panel

### 2. Component Updates

#### ChartPanel (`app/components/ChartPanel.tsx`)

- Added resize handling using the `onLayout` callback from `react-resizable-panels`
- When panels are resized, the `onLayout` callback captures the new sizes
- Sizes are propagated up through the component tree via the `onLayoutChange` prop
- Each panel's size is stored both at the group level (sizes array) and individual panel level (size property)

#### ChartApp (`app/components/ChartApp.tsx`)

- Implements auto-save functionality with debouncing
- When layout changes are received, a 1-second timeout is set
- If no further changes occur within that second, the layout is auto-saved to Firestore
- The timeout is cleared and reset on each new change to prevent excessive saves

### 3. Layout Converter Updates

The `layoutConverter.ts` utility was updated to:

- Convert sizes between PanelLayout (UI) and LayoutNode (Firestore) formats
- Preserve size information during conversions
- Apply saved sizes when loading layouts from Firestore

### 4. Preset Layouts

All preset layouts now include initial size values:

- Single: 100% for the single panel
- Horizontal: 50/50 split
- Vertical: 50/50 split
- Quad: Four 50/50 splits
- Triple: 40/60 split with nested 50/50

## How It Works

### Saving Process

1. User drags a resize handle between panels
2. `PanelGroup` fires `onLayout` callback with new size percentages
3. ChartPanel updates the layout structure with new sizes
4. ChartApp receives the updated layout and sets a 1-second timeout
5. After 1 second of no changes, the layout is saved to Firestore

### Loading Process

1. User selects a saved layout
2. Layout is loaded from Firestore with embedded size information
3. Layout converter applies the saved sizes to each panel
4. Panels render with their saved dimensions

## Data Structure Example

```json
{
  "type": "split",
  "direction": "horizontal",
  "ratio": 0.4,
  "sizes": [40, 60],
  "children": [
    {
      "type": "chart",
      "id": "left-panel",
      "size": 40,
      "chart": {
        "id": "chart-1",
        "symbol": "BTC-USD",
        "granularity": "ONE_HOUR"
      }
    },
    {
      "type": "split",
      "direction": "vertical",
      "sizes": [70, 30],
      "children": [
        {
          "type": "chart",
          "id": "top-right",
          "size": 70,
          "chart": {
            "id": "chart-2",
            "symbol": "ETH-USD",
            "granularity": "ONE_DAY"
          }
        },
        {
          "type": "chart",
          "id": "bottom-right",
          "size": 30,
          "chart": {
            "id": "chart-3",
            "symbol": "SOL-USD",
            "granularity": "FOUR_HOUR"
          }
        }
      ]
    }
  ]
}
```

## Benefits

1. **User Experience**: Users don't lose their preferred panel sizes when switching layouts
2. **Automatic**: No manual save action required
3. **Debounced**: Prevents excessive database writes during active resizing
4. **Backward Compatible**: Works with existing layouts that don't have size data

## Technical Considerations

- The 1-second debounce delay balances responsiveness with database efficiency
- Sizes are stored as percentages (0-100) to handle different screen sizes
- The `ratio` field is maintained for backward compatibility but `sizes` takes precedence
- Panel minimum sizes are respected (default 20%)
