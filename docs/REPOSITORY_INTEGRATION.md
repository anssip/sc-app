# Repository Integration Documentation

This document describes the repository-integrated chart system that provides client-side caching, offline support, and automatic persistence to Firestore.

## Overview

The repository system provides a data layer that enables:
- **Instant responses** from client-side cache
- **Background synchronization** to Firestore
- **Offline support** with sync queue
- **Real-time updates** across devices
- **Layout persistence** and management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
│              (ChartApp, ChartPanel, etc.)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Repository Hooks                             │
│        (useRepository, useLayouts, useCharts)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Repository Service                            │
│         (Client-side cache + Async sync)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Firestore                                  │
│            (Persistent storage)                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Basic Usage

```tsx
import { ChartApp } from '~/components/ChartApp';
import { AuthProvider } from '~/lib/auth-context';

function App() {
  return (
    <AuthProvider>
      <ChartApp className="h-screen" />
    </AuthProvider>
  );
}
```

### 2. With Custom Initial Layout

```tsx
import { ChartApp } from '~/components/ChartApp';
import type { PanelLayout } from '~/components/ChartPanel';

function CustomChart() {
  const initialLayout: PanelLayout = {
    id: 'custom',
    type: 'chart',
    chart: {
      id: 'btc-chart',
      symbol: 'BTC-USD',
      granularity: 'ONE_HOUR',
      indicators: [],
    },
    defaultSize: 100,
    minSize: 20,
  };

  return <ChartApp initialLayout={initialLayout} />;
}
```

## Core Components

### ChartApp

Main application component that integrates everything together.

**Props:**
- `className?: string` - CSS classes
- `initialLayout?: PanelLayout` - Initial layout structure

**Features:**
- Repository initialization
- Layout management UI
- Error handling and loading states
- Online/offline status

### LayoutSelector

Component for selecting and saving layouts.

**Features:**
- Dropdown for saved layouts
- Save button with dialog
- Preset layout buttons
- Real-time layout list updates

### SaveLayoutDialog

Modal dialog for saving new layouts.

**Features:**
- Layout name validation
- Error handling
- Loading states
- Keyboard shortcuts (Enter/Escape)

## Repository Hooks

### useRepository()

Main hook for repository access and status.

```tsx
const { repository, isLoading, error, isOnline } = useRepository();
```

**Returns:**
- `repository: Repository | null` - Repository instance
- `isLoading: boolean` - Initialization status
- `error: string | null` - Error message if any
- `isOnline: boolean` - Network connectivity status

### useLayouts()

Hook for layout management operations.

```tsx
const { 
  layouts, 
  saveLayout, 
  updateLayout, 
  deleteLayout, 
  getLayout 
} = useLayouts();
```

**Methods:**
- `saveLayout(layout)` - Save new layout
- `updateLayout(id, updates)` - Update existing layout
- `deleteLayout(id)` - Delete layout
- `getLayout(id)` - Get layout by ID

### useCharts()

Hook for chart configuration management.

```tsx
const { 
  charts, 
  saveChart, 
  updateChart, 
  deleteChart 
} = useCharts();
```

### useSymbols()

Hook for trading pair/symbol management.

```tsx
const { symbols, activeSymbols, getSymbol } = useSymbols();
```

### useUserSettings()

Hook for user preference management.

```tsx
const { settings, updateSettings } = useUserSettings();
```

## Data Flow

### Layout Saving

1. User clicks "Save" button in LayoutSelector
2. SaveLayoutDialog opens for name input
3. Current ChartPanel layout converted to repository format
4. Layout saved to client cache (instant response)
5. Background sync to Firestore
6. Real-time update to other devices

### Chart Changes

1. User changes symbol/granularity in ChartToolbar
2. Chart API updates the chart display
3. Change persisted to repository cache
4. Background sync to Firestore
5. onConfigUpdate callback updates parent layout

### Layout Loading

1. User selects saved layout from dropdown
2. Repository layout converted to ChartPanel format
3. ChartPanel updates with new layout
4. Individual charts load with saved configurations

## Offline Support

The repository system works offline by:

1. **Client-side cache** stores all data locally
2. **Sync queue** holds pending operations
3. **Network detection** monitors connectivity
4. **Auto-sync** processes queue when online

### Offline Behavior

- All read operations work from cache
- Write operations queue for later sync
- UI shows offline status
- No functionality loss when offline

## Error Handling

### Repository Errors

```tsx
// Custom error types
RepositoryError - General repository errors
NetworkError - Network/sync errors  
ValidationError - Data validation errors
```

### Error Recovery

- Automatic retry for network errors
- Validation feedback for user input
- Graceful degradation on failures
- Error boundaries prevent crashes

## Firestore Schema

### Layouts Collection

```
/settings/{userId}/layouts/{layoutId}
{
  "name": "My Layout",
  "userId": "user@example.com",
  "layout": { /* layout structure */ },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Charts Collection

```
/settings/{userId}/charts/{chartId}
{
  "id": "chart-id",
  "title": "BTC Chart",
  "symbol": "BTC-USD",
  "granularity": "ONE_HOUR",
  "indicators": []
}
```

## Performance Optimizations

### Client-side Caching

- Map-based storage for O(1) lookups
- Memory-efficient data structures
- Automatic cache invalidation

### Background Sync

- Batched operations to reduce requests
- Debounced sync to prevent spam
- Smart retry with exponential backoff

### Real-time Updates

- Firestore listeners for live data
- Event system for component notifications
- Efficient change detection

## Best Practices

### Component Integration

```tsx
// ✅ Good - Use repository hooks
function MyComponent() {
  const { layouts, saveLayout } = useLayouts();
  // Component logic
}

// ❌ Bad - Direct repository access
function MyComponent() {
  const { repository } = useRepository();
  repository.saveLayout(); // Don't do this
}
```

### Error Handling

```tsx
// ✅ Good - Handle errors gracefully
try {
  await saveLayout(layoutData);
  showSuccessMessage();
} catch (error) {
  showErrorMessage(error.message);
}
```

### Layout Conversion

```tsx
// ✅ Good - Use utility functions
import { convertFromChartPanelLayout } from '~/utils/layoutConverter';

const repositoryLayout = convertFromChartPanelLayout(panelLayout);
```

## Debugging

### Enable Debug Logs

```tsx
// In browser console
localStorage.setItem('debug', 'repository:*');
```

### Check Repository Status

```tsx
const { repository, isOnline } = useRepository();
console.log('Repository status:', {
  initialized: !!repository,
  online: isOnline,
  cacheSize: repository?.getLayouts().length
});
```

### Monitor Sync Queue

```tsx
// Check if operations are pending sync
repository?.sync().then(() => {
  console.log('Sync completed');
});
```

## Migration Guide

### From Static Layouts

1. Replace direct ChartPanel usage with ChartApp
2. Wrap in AuthProvider for authentication
3. Update layout creation to use repository format
4. Add save/load functionality where needed

### Example Migration

**Before:**
```tsx
function OldChart() {
  const [layout, setLayout] = useState(staticLayout);
  return <ChartPanel layout={layout} onLayoutChange={setLayout} />;
}
```

**After:**
```tsx
function NewChart() {
  return (
    <AuthProvider>
      <ChartApp initialLayout={staticLayout} />
    </AuthProvider>
  );
}
```

## Troubleshooting

### Common Issues

**Repository not initializing:**
- Check authentication status
- Verify Firebase configuration
- Check network connectivity

**Layouts not saving:**
- Verify user permissions
- Check validation errors
- Monitor network requests

**Offline sync issues:**
- Clear browser cache
- Check localStorage quota
- Verify sync queue status

### Support

For additional help:
1. Check browser console for errors
2. Verify Firestore rules and permissions
3. Test with different network conditions
4. Review component integration patterns