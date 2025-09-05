# Symbols (trading pairs) in Firestore

The pricing information is stored in the following path in Firestore:

```
/exchanges/coinbase/products/[symbol]/intervals/[interval]
```

In the above, the `symbol` is the identifier for the symbol, for example BTC-USD. `interval` is one of the following.

## Intervals

- FIFTEEN_MINUTE
- FIFTEEN_MINUTES
- FIVE_MINUTE
- FIVE_MINUTES
. ONE_DAY
- ONE_HOUR
- ONE_MINUTE
- SIX_HOUR
- SIX_HOURS
- THIRTY_MINUTE
- THIRTY_MINUTES
- TWO_HOUR
- TWO_HOURS
