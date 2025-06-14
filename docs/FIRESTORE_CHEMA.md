# Settings collection

The `settings` collection is used to store user preferences and settings. Each user has a document in this  collection. The document ID is the user's email address.

## Chart layouts

Users chart layouts are stored inside the settings collection. The document path looks like this:

```
/settings/{userId}/layouts/{layoutId}
```
The document structure is as follows:

```json
{
  "name": "string",
  "charts": [
    {
      "type": "split",
      "direction": "horizontal",
      "ratio": 0.6,
      "children": [
        {
          "type": "chart",
          "id": 1,
        },
        {
          "type": "split",
          "direction": "vertical",
          "ratio": 0.4,
          "children": [
            {
              "type": "chart",
              "id": 2,
            },
            {
              "type": "chart",
              "id": 3,
            }
          ]
        }
      ]
    }
  ]
}
```

- type: "split" or "panel"
- direction: "horizontal" or "vertical" (for splits)
- ratio: Split position (0.0 to 1.0)
- children: Array of child nodes (for splits)
- id/content: Chart identifier (for leaves)

### Restoration algorithm:

The layout can be restored from a JSON object like so.

1. Parse the layout description
2. Recursively traverse the tree
3. For each split node, create a splitter container
4. For each panel node, instantiate the actual panel
5. Apply the size ratios to set initial dimensions

## Charts

The chart settings are stored inside the settings collection in the following path:

```
/settings/{userId}/charts/{chartId}
```

 An example chart document:

```json
{
  "title": "ETC to the moon!",
  "id": 1,
  "symbol": 'ETH-USD',
  "granularity": '1d',
  "indicators": ["RSI", "MACD"]
}
```

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
