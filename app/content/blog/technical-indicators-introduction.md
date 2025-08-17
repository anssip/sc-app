---
title: "Introducing Technical Indicators in Spot Canvas"
excerpt: "We're stoked to unveil the biggest upgrade yet to Spot Canvas - a full toolbox of technical indicators for our upcoming charting product. These indicators are for all charting pros and also for all newbies in this area."
author: "Spot Canvas Team"
publishDate: "2025-01-30"
category: "Product Updates"
---

We're stoked to unveil the biggest upgrade yet to Spot Canvas - a full toolbox of technical indicators for our upcoming charting product. These indicators are for all charting pros and also for all newbies in this area. These new tools will help you spot trends, catch reversals, and trade with more confidence. We here at Spot Canvas just need to finish the rest of the product and after that you will be able to start using these indicators for real.

Heads up: At the time of this writing, end of January 2025, Spot Canvas is still pretty much in the development phase. While you can play with these indicators right now (check out the live example on our homepage!), we're still working on key features like user accounts for saving your setups. Our goal is to serve up the full meal deal by end of 2025.

## How it works

This section is primarily for developers and others interested in the technical implementation details.

The indicators are evaluated on the server. The "evaluation engine" fetches the required number of candles from the database (or from exchange APIs) and runs the indicator evaluation logic over those candles. This process generates one or more evaluated indicator values per candle, depending on the specific evaluator being used. These results are then returned to the client, which is the chart running in the user's web browser.

In addition to the evaluation results, the indicator server also returns plotting instructions. These instructions vary for each indicator, though some share commonalities. For example, simple line plotting works the same way for all indicators that use lines. In any case, the key idea is that plotting instructions are also part of the indicator implementation. This approach prepares for the future, where Spot Canvas will support user-authored indicators. Users will be able to implement indicators using a standard programming language, such as Python. Their implementation will not only calculate the indicator values but also specify how these values should be plotted and displayed on the chart.

One design decision we made when structuring the evaluation architecture was to ensure the efficient delivery of indicator data to client charts. We accomplished this by packaging all timeline data into a single request payload. The client makes one request to the server, and the server responds with both the candles and all indicator data for the indicators the user has enabled in the chart. Some optimization work is still ongoing, but the results look promising.

Below is an explanation of each indicator we have implemented so far. More will be added, including a scripting framework that will allow users to create and deploy custom indicators.

## What's New

Our technical indicators suite includes all the essential tools you need for comprehensive market analysis:

- **Moving Averages** - Simple moving averages to identify trends
- **Oscillators** - RSI, MACD, and Stochastict to spot overbought/oversold conditions
- **Volume Indicator** - Volume analysis tools to confirm price movements
- **Volatility Indicators** - Bollinger Bands, ATR, for measuring volatility

## Why Technical Indicators Matter

Technical indicators are mathematical calculations based on price, volume, or open interest data. They help traders:

- Identify potential entry and exit points
- Confirm trend direction and strength
- Spot potential reversals before they happen
- Manage risk more effectively
- Remove emotion from trading decisions

## Popular Indicators Explained

### Moving Averages

Moving averages smooth out price action to help identify trends. The Simple Moving Average (SMA) calculates the average price over a specific period, while the Exponential Moving Average (EMA) gives more weight to recent prices, making it more responsive to new information.

### RSI (Relative Strength Index)

The RSI measures momentum and helps identify overbought or oversold conditions. Values above 70 typically indicate overbought conditions, while values below 30 suggest oversold conditions.

### MACD (Moving Average Convergence Divergence)

MACD shows the relationship between two moving averages and helps identify changes in momentum, direction, and duration of a trend. It's particularly useful for spotting potential buy and sell signals.

### Bollinger Bands

These bands expand and contract based on market volatility, helping traders identify potential support and resistance levels, as well as overbought and oversold conditions.

## What's Next

This is just the beginning. We're continuously working on expanding our indicator library and improving the user experience.

## Community and Support

Join our growing community of traders using Spot Canvas indicators:

- **Discord Community** - Connect with other traders, share strategies, and get real-time help
- **Support** - Our team is always here to help you succeed
