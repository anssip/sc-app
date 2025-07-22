# Settings collection

The `settings` collection is used to store user preferences and settings. Each user has a document in this collection. The document ID is the user's email address.

## Chart layouts

Users chart layouts are stored inside the settings collection. The document path looks like this:

```
/settings/{email}/layouts/{layoutId}
```

The document structure is as follows:

```json
{
  "name": "quad",
  "id": "1753008073737-9ej0jt8yg",
  "userId": "anssip@gmail.com",
  "createdAt": "2025-07-20T10:41:13.737Z",
  "updatedAt": "2025-07-21T07:13:45.420Z",
  "layout": {
    "type": "split",
    "direction": "horizontal",
    "ratio": 0.5,
    "sizes": [50, 50],
    "children": [
      {
        "type": "split",
        "direction": "vertical",
        "ratio": 0.5,
        "sizes": [50.1753360608, 49.8246639392],
        "children": [
          {
            "type": "chart",
            "id": "layout-1753008073737-minfum493",
            "size": 50.1753360608,
            "chart": {
              "id": "chart-1753008073737-gr4ojwgj3",
              "symbol": "SOL-USD",
              "granularity": "ONE_DAY",
              "indicators": []
            }
          },
          {
            "type": "chart",
            "id": "layout-1753008073737-fw9x1v48n",
            "size": 49.8246639392,
            "chart": {
              "id": "chart-1753008073737-eha8xxw6y",
              "symbol": "ETH-USD",
              "granularity": "ONE_HOUR",
              "indicators": []
            }
          }
        ]
      },
      {
        "type": "split",
        "direction": "vertical",
        "ratio": 0.5,
        "sizes": [50, 50],
        "children": [
          {
            "type": "chart",
            "id": "layout-1753008073737-b9q5u8cey",
            "size": 50,
            "chart": {
              "id": "chart-1753008073737-kd0dipuap",
              "symbol": "BTC-USD",
              "granularity": "FIFTEEN_MINUTE",
              "indicators": []
            }
          },
          {
            "type": "chart",
            "id": "layout-1753008073737-m9dokfux1",
            "size": 50,
            "chart": {
              "id": "chart-1753008073737-s33dnafb8",
              "symbol": "DOGE-USD",
              "granularity": "ONE_HOUR",
              "indicators": []
            }
          }
        ]
      }
    ]
  }
}
```

**Layout Structure:**
- `type`: "split" or "chart"
- `direction`: "horizontal" or "vertical" (for splits only)
- `ratio`: Split position (0.0 to 1.0) (for splits only)
- `sizes`: Array of actual sizes for child elements (for splits only)
- `children`: Array of child nodes (for splits only)
- `id`: Unique identifier for layout nodes
- `size`: Current size of the node
- `chart`: Embedded chart configuration (for chart nodes only)

**Chart Configuration (embedded within chart nodes):**
- `id`: Unique chart identifier
- `symbol`: Trading pair (e.g., "BTC-USD", "ETH-USD")
- `granularity`: Time interval ("ONE_MINUTE", "FIVE_MINUTE", "FIFTEEN_MINUTE", "THIRTY_MINUTE", "ONE_HOUR", "TWO_HOUR", "SIX_HOUR", "ONE_DAY")
- `indicators`: Array of technical indicators (e.g., ["RSI", "MACD"])

### Restoration algorithm:

The layout can be restored from a JSON object like so.

1. Parse the layout description from the `layout` property
2. Recursively traverse the tree structure
3. For each split node, create a splitter container with the specified direction and ratio
4. For each chart node, instantiate a chart panel using the embedded chart configuration
5. Apply the size ratios and actual sizes to set initial dimensions
6. Configure each chart with its symbol, granularity, and indicators from the embedded chart object


# Symbols

Trading pairs (symbols) are in Firestore in the following path:

```
/exchanges/{exchangeId}/products/{symbol}
```

Each symbol is a document with the following structure:

The live candles for the active symbols are the ones that our backend is currently processing and fetching live prices for. The live prices are stored in path:

```
/exchanges/{exchangeId}/products/{symbol}/intervals/{intervalId}
```

The document in this path look like so:

```json
{
  "close": 1.2121,
  "high": 1.2123,
  "lastUpdate": "December 8, 2024 at 1:24:41.658 PM UTC+2",
  "low": 1.2043,
  "open": 1.2056,
  "timestamp": 1733656800,
  "volume": 138295.41579799
}
```

The active symbols are the ones who have been updated during the last hour or so. Our repository can filter the symbols to find out the active ones.

Intervals (granularities) are the following:

"ONE_MINUTE",
"FIVE_MINUTE",
"FIFTEEN_MINUTE",
"THIRTY_MINUTE",
"ONE_HOUR",
"TWO_HOUR",
"SIX_HOUR",
"ONE_DAY",
