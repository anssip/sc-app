---
title: "Spotlight AI Assistant Guide"
excerpt: "Master the Spotlight AI assistant for intelligent chart analysis. Learn how to use example prompts, understand visual indicators, and leverage AI-powered pattern detection and divergence analysis."
publishDate: "2025-09-25"
author: "Spot Canvas Team"
category: "AI & Analysis"
published: true
featured: false
order: 1
---

<style>
.ai-prompt {
  font-family: var(--font-secondary);
  color: var(--color-gray-500);
  font-weight: 500;
  letter-spacing: -0.02em;
}

.workflow-list {
  counter-reset: workflow-counter;
  padding-left: 0;
  list-style: none;
}

.workflow-list li {
  counter-increment: workflow-counter;
  margin-bottom: 16px;
  padding-left: 40px;
  position: relative;
}

.workflow-list li::before {
  content: counter(workflow-counter);
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  background: var(--color-accent-1);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.workflow-desc {
  color: var(--color-gray-300);
  font-size: 15px;
  margin-top: 4px;
  line-height: 1.5;
}

/* Enhanced table styling for better visibility */
table {
  border-collapse: separate;
  border-spacing: 0;
  border: 2px solid var(--color-gray-600, #4a5568);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  margin: 20px 0;
}

table thead {
  background: var(--color-gray-800, #1a202c);
}

table th {
  border: 1px solid var(--color-gray-600, #4a5568);
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-100, #f7fafc);
}

table td {
  border: 1px solid var(--color-gray-700, #2d3748);
  padding: 10px 12px;
  color: var(--color-gray-200, #e2e8f0);
}

table tbody tr {
  background: var(--color-gray-900, #0a0b0d);
}

table tbody tr:nth-child(even) {
  background: var(--color-gray-850, #12131a);
}

table tbody tr:hover {
  background: var(--color-gray-800, #1a202c);
}
</style>

## Overview
The Spotlight AI assistant is your intelligent companion for chart analysis, providing real-time insights and automated chart interactions. It can analyze patterns, detect divergences, manage indicators, and draw trend lines directly on your charts.

## Common Workflows

These step-by-step workflows demonstrate the power of the Spotlight AI assistant by combining multiple analysis techniques to make informed trading decisions. Later on in this article, you can find a lot of examples of prompts that you can use with Spotlight – you can combine those example prompts, and any prompts of your own, in these workflows. These workflows are just examples, but should give you an idea of what kind of prompting style leads to best results.

### Complete Chart Analysis
<ol class="workflow-list">
<li>
  <span class="ai-prompt">"Draw support and resistance levels"</span>
  <div class="workflow-desc">Establishes the key price boundaries where the market has historically reversed. These levels form the foundation of your analysis by identifying critical decision points.</div>
</li>
<li>
  <span class="ai-prompt">"What patterns do you see in the candles?"</span>
  <div class="workflow-desc">Identifies candlestick formations that signal potential reversals or continuations. Patterns near the support/resistance levels from step 1 carry extra significance.</div>
</li>
<li>
  <span class="ai-prompt">"Show the RSI indicator"</span>
  <div class="workflow-desc">We are interested in RSI (Relative Strength Index) next and we'll show the indicator in the chart..</div>
</li>
<li>
  <span class="ai-prompt">"Check for RSI divergences"</span>
  <div class="workflow-desc">Reveals when momentum diverges from price action, often preceding major moves. Bullish divergences at support or bearish divergences at resistance are particularly powerful signals.</div>
</li>
<li>
  <span class="ai-prompt">"Show the MACD indicator"</span>
  <div class="workflow-desc">Next, we'll show the Moving Average Convergence Divergence (MACD) indicator and analyze divergencies.</div>
</li>
<li>
  <span class="ai-prompt">"Are there any MACD crossovers?"</span>
  <div class="workflow-desc">Confirms trend changes with momentum crossovers. When aligned with patterns and divergences, these provide high-confidence entry/exit signals.</div>
</li>
<li>
  <span class="ai-prompt">"Analyze volume and price action"</span>
  <div class="workflow-desc">Validates the strength of the move. Rising volume confirms breakouts, while declining volume on rallies suggests weakness.</div>
</li>
<li>
  <span class="ai-prompt">"Propose two different trading scenarios with this chart and analysis"</span>
  <div class="workflow-desc">This should give you some trading ideas.</div>
</li>
<li>
  <span class="ai-prompt">"Clear all candle highlights"</span>
  <div class="workflow-desc">Clearing the highlighed candles (that indicatge candle patterns) will improve the panning and zooming performance of the chart. (We are working to fix this issue)</div>
</li>
</ol>

### Trend Reversal Detection
<ol class="workflow-list">
<li>
  <span class="ai-prompt">"Find bearish divergences in RSI"</span>
  <div class="workflow-desc">Spots weakening upward momentum when price makes new highs but RSI doesn't follow. This early warning often precedes trend reversals.</div>
</li>
<li>
  <span class="ai-prompt">"Check for reversal candlestick patterns"</span>
  <div class="workflow-desc">Confirms the divergence signal with specific reversal formations like shooting stars or evening stars at market tops, providing a precise entry point.</div>
</li>
<li>
  <span class="ai-prompt">"Is volume supporting this trend?"</span>
  <div class="workflow-desc">Verifies whether the current trend has conviction. Declining volume during uptrends suggests the move is losing steam and reversal is likely.</div>
</li>
</ol>

### Entry Point Analysis
<ol class="workflow-list">
<li>
  <span class="ai-prompt">"Draw horizontal line at current price"</span>
  <div class="workflow-desc">Creates a reference point for your potential entry, making it easy to visualize risk/reward ratios relative to support and resistance.</div>
</li>
<li>
  <span class="ai-prompt">"Show me support levels below current price"</span>
  <div class="workflow-desc">Identifies potential stop-loss levels and bounce zones. The distance to support helps calculate position sizing and risk management.</div>
</li>
<li>
  <span class="ai-prompt">"Find bullish patterns near support"</span>
  <div class="workflow-desc">Looks for confirmation signals like hammers or bullish engulfing patterns at support levels, increasing the probability of a successful long entry.</div>
</li>
</ol>

## Prompt Categories & Examples

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span> Indicators
**Chart Interaction**: Toggles indicator overlays on/off

#### Example Prompts:
- **Enable/Disable Indicators**:
  - <span class="ai-prompt">"Enable the RSI indicator"</span> - Adds RSI overlay below chart
  - <span class="ai-prompt">"Disable the RSI indicator"</span> - Removes RSI overlay
  - <span class="ai-prompt">"Enable the MACD indicator"</span> - Adds MACD overlay below chart
  - <span class="ai-prompt">"Disable the MACD indicator"</span> - Removes MACD overlay
  - <span class="ai-prompt">"Enable the Moving Average indicator"</span> - Adds MA overlay on price chart
  - <span class="ai-prompt">"Enable the Volume indicator"</span> - Adds volume bars below chart
  - <span class="ai-prompt">"Enable Bollinger Bands"</span> - Adds bands overlay on price chart

- **Information & Analysis**:
  - <span class="ai-prompt">"Show me all available indicators"</span> - Lists all indicator options
  - <span class="ai-prompt">"What do the current active indicators suggest?"</span> - Analyzes active indicators
  - <span class="ai-prompt">"Explain the RSI indicator"</span> - Educational explanation
  - <span class="ai-prompt">"What does the MACD crossover indicate?"</span> - Interpretation guide
  - <span class="ai-prompt">"Are there any MACD crossovers in this chart?"</span> - Scans for crossovers

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span> Granularity
**Chart Interaction**: Changes the time interval of candles

#### Example Prompts:
- <span class="ai-prompt">"Switch to 5 minute granularity"</span> - Shows 5-minute candles
- <span class="ai-prompt">"Switch to 15 minute granularity"</span> - Shows 15-minute candles
- <span class="ai-prompt">"Switch to 1 hour granularity"</span> - Shows hourly candles
- <span class="ai-prompt">"Switch to 4 hour granularity"</span> - Shows 4-hour candles
- <span class="ai-prompt">"Switch to one day granularity"</span> - Shows daily candles
- <span class="ai-prompt">"Switch to 1 week granularity"</span> - Shows weekly candles
- <span class="ai-prompt">"Switch to 1 month granularity"</span> - Shows monthly candles
- <span class="ai-prompt">"What's the current time frame?"</span> - Reports current interval

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><circle cx="9" cy="9" r="7"></circle><circle cx="15" cy="15" r="7"></circle></svg></span> Symbols
**Chart Interaction**: Changes the trading pair displayed

#### Example Prompts:
- <span class="ai-prompt">"Switch to BTC-USD symbol"</span> - Displays Bitcoin/USD
- <span class="ai-prompt">"Switch to ETH-USD symbol"</span> - Displays Ethereum/USD
- <span class="ai-prompt">"Switch to SOL-USD symbol"</span> - Displays Solana/USD
- <span class="ai-prompt">"Switch to ADA-USD symbol"</span> - Displays Cardano/USD
- <span class="ai-prompt">"Switch to DOGE-USD symbol"</span> - Displays Dogecoin/USD

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></span> Trend Lines
**Chart Interaction**: ✅ **Adds visual lines to chart**

#### Example Prompts:
- **<span class="ai-prompt">"Draw lines for support and resistance levels to this chart"</span>**
  - Automatically detects and draws horizontal lines at key price levels
  - Support lines appear at price floors (potential bounce points)
  - Resistance lines appear at price ceilings (potential reversal points)

- **<span class="ai-prompt">"Draw a horizontal line at current price"</span>**
  - Adds a reference line at the current market price

- **<span class="ai-prompt">"Draw a horizontal line at recent high"</span>**
  - Marks the highest point in the visible range

- **<span class="ai-prompt">"Clear all drawings from the chart"</span>**
  - Removes all drawn lines and annotations

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg></span> Pattern Detection
**Chart Interaction**: ✅ **Highlights candlestick patterns on chart**

#### Example Prompts:
- **<span class="ai-prompt">"What pattern do you see in the candles on this chart?"</span>**
  - Scans for and highlights candlestick patterns including:
    - **Doji** - Indecision patterns (highlighted with markers)
    - **Hammer** - Potential bullish reversal (marked at pattern location)
    - **Shooting Star** - Potential bearish reversal (marked at pattern location)
    - **Engulfing** - Strong reversal patterns (highlighted across both candles)
    - **Morning Star** - Bullish reversal pattern (3-candle pattern highlighted)
    - **Evening Star** - Bearish reversal pattern (3-candle pattern highlighted)
  - Patterns near support/resistance levels are emphasized with higher significance

- **<span class="ai-prompt">"Remove all pattern highlights"</span>**
  - Clears pattern markers from the chart

- **<span class="ai-prompt">"Can you help me analyze this chart?"</span>**
  - Comprehensive pattern and trend analysis

### <span style="color: var(--color-accent-1)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; color: var(--color-accent-1)"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></span> Divergence Detection
**Chart Interaction**: ✅ **Draws trend lines showing divergences**

#### RSI Divergences
- **<span class="ai-prompt">"Visualize the divergences in RSI that you see in the chart"</span>**
  - Draws trend lines on both price chart and RSI indicator
  - <span style="color: #22c55e">Green lines</span> for bullish divergences (price down, RSI up)
  - <span style="color: #ef4444">Red lines</span> for bearish divergences (price up, RSI down)
  - Solid lines for regular divergences (potential reversals)
  - Dashed lines for hidden divergences (trend continuation)

- **<span class="ai-prompt">"Find bearish divergences in RSI"</span>**
  - Specifically looks for bearish RSI divergences

#### MACD Divergences
- **<span class="ai-prompt">"Visualize the divergences in indicators that you see in the chart"</span>**
  - Comprehensive scan of all indicator divergences
  - Draws connecting lines between divergence points

- **<span class="ai-prompt">"Find bullish divergences in MACD"</span>**
  - Detects when MACD makes higher lows while price makes lower lows
  - Draws green trend lines on both price and MACD panels

#### MACD Crossovers
- **<span class="ai-prompt">"Are there any MACD crossovers in this chart?"</span>**
  - Marks signal line crossovers with colored dots
  - <span style="color: #22c55e">Green markers</span> for bullish crossovers (MACD crosses above signal)
  - <span style="color: #ef4444">Red markers</span> for bearish crossovers (MACD crosses below signal)
  - Adds labels showing crossover strength and confidence

#### Volume Divergences
- **<span class="ai-prompt">"Show volume divergences with price"</span>**
  - Highlights when price moves up on declining volume (weakness)
  - Marks volume bars that show divergence from price action

- **<span class="ai-prompt">"Analyze the price action and volume in the visible chart"</span>**
  - Comprehensive volume analysis with visual markers

#### General Divergence Commands
- **<span class="ai-prompt">"Highlight all indicator divergences"</span>**
  - Scans all active indicators for divergences
  - Draws all detected divergence lines

- **<span class="ai-prompt">"Remove all divergence trend lines"</span>**
  - Clears divergence visualizations

- **<span class="ai-prompt">"Is there a divergence between price and momentum?"</span>**
  - Analyzes without necessarily drawing

- **<span class="ai-prompt">"Check for hidden divergences"</span>**
  - Looks for trend continuation signals

## Visual Interactions Summary

| Prompt Category | Adds Visual Elements | Visual Type | Color Coding |
|-----------------|---------------------|-------------|--------------|
| **Indicators** | ✓ | Indicator panels below chart | Varies by indicator |
| **Granularity** | - | Changes candle width/timeframe | - |
| **Symbols** | - | Changes displayed asset | - |
| **Trend Lines** | ✅ **Yes** | Horizontal lines on price chart | Blue/Gray lines |
| **Pattern Detection** | ✅ **Yes** | Highlights and labels on candles | Pattern-specific colors |
| **Divergence - RSI** | ✅ **Yes** | Trend lines on price & RSI | <span style="color: #22c55e">Green</span> Bullish / <span style="color: #ef4444">Red</span> Bearish |
| **Divergence - MACD** | ✅ **Yes** | Trend lines on price & MACD | <span style="color: #22c55e">Green</span> Bullish / <span style="color: #ef4444">Red</span> Bearish |
| **Divergence - Volume** | ✅ **Yes** | Highlighted volume bars | <span style="color: #ef4444">Red</span> Weak moves |
| **MACD Crossovers** | ✅ **Yes** | Dots and labels on MACD | <span style="color: #22c55e">Green</span> Buy / <span style="color: #ef4444">Red</span> Sell signals |

> Regarding the highlights and labels on candles that are used to denote detected patterns: You can click on the pattern name labels to view more information about the pattern.

## Visual Indicators Guide

### Color Coding
- **<span style="color: #22c55e">Green</span>**: Bullish signals, buy opportunities, positive divergences
- **<span style="color: #ef4444">Red</span>**: Bearish signals, sell opportunities, negative divergences
- **<span style="color: #3b82f6">Blue</span>**: Neutral reference lines, support levels
- **<span style="color: #f97316">Orange</span>**: Warning signals, resistance levels

### Line Styles
- **Solid Lines**: Regular divergences (potential trend reversals)
- **Dashed Lines**: Hidden divergences (trend continuation signals)
- **Dotted Lines**: Weak or unconfirmed patterns
- **Thick Lines**: High-confidence signals (>75% confidence)

### Marker Types
- **Circles**: Crossover points
- **Triangles**: Pattern peaks/troughs
- **Squares**: Support/resistance touches
- **Labels**: Include confidence percentages and pattern names

## Tips for Best Results

### Effective Prompting
1. **Be Specific**: Instead of "analyze", say "find bullish divergences in RSI"
2. **Mention Timeframe**: Normally the AI uses the visible timeframe of the current chart. If you want something else, include the visible chart period in your analysis request. Alternatively, adjust the chart's timeframe first and prompt after that – this has the advantage that all highlights that are draws will be visible immediately.
3. **Combine Analyses**: Ask for multiple indicators to confirm signals

### Understanding Visual Feedback
1. **Confidence Levels**: Higher confidence signals use thicker lines or larger markers
2. **Multiple Confirmations**: Look for overlapping signals from different indicators
3. **Context Matters**: Patterns near support/resistance levels are more significant

### Advanced Usage
1. **Layer Your Analysis**:
   - Start with support/resistance levels
   - Add pattern detection
   - Check for divergences
   - Confirm with volume analysis

2. **Clean Slate Approach**:
   - Use "Clear all drawings" between different analyses
   - Build up layers of insight progressively

3. **Educational Queries**:
   - Ask "why" questions to understand the analysis
   - Request explanations of detected patterns

## Performance Notes
- Visual elements are rendered in real-time
- Multiple divergences/patterns can be displayed simultaneously
- All drawings persist until explicitly cleared or chart is refreshed
- Heavy analysis may take a few seconds for calculation

## Limitations
- Historical data availability depends on selected timeframe
- Pattern detection accuracy improves with more data points
- Some complex patterns may require manual confirmation
- Divergences are suggestions, not guaranteed predictions
