import OpenAI from "openai";
import { Firestore } from "firebase-admin/firestore";
import { chartTools } from "./chart-tools.js";
import { priceTools } from "./price-tools.js";
import { createUsageService } from "./usage-service.js";

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;
const getOpenAI = (): OpenAI => {
  // Always create a new instance to ensure we use the latest API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  console.log(
    "Initializing OpenAI with key ending:",
    apiKey.substring(apiKey.length - 4)
  );
  openai = new OpenAI({ apiKey });
  return openai;
};

// Combine all tool definitions
const tools: any[] = [...chartTools.definitions, ...priceTools.definitions];

interface ProcessChatOptions {
  message: string;
  userId: string;
  sessionId: string;
  subscriptionId?: string | null;
  isPreview?: boolean;
  chartContext?: any;
  db: Firestore;
  onStream: (chunk: string) => void;
  onToolCall: (toolCall: any) => Promise<void>;
}

export async function processChat({
  message,
  userId,
  sessionId,
  subscriptionId,
  isPreview,
  chartContext,
  db,
  onStream,
  onToolCall,
}: ProcessChatOptions): Promise<string> {
  try {
    // Handle with LLM
    return await processWithLLM({
      message,
      userId,
      sessionId,
      subscriptionId,
      isPreview,
      chartContext,
      db,
      onStream,
      onToolCall,
    });
  } catch (error) {
    console.error("Chat processing error:", error);
    throw error;
  }
}

function getTimeframeExtractionPrompt(): String {
  // Use actual current date
  const currentDate = new Date();
  return `
IMPORTANT - Today's actual date: ${currentDate.toISOString()}
Today is: ${currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
Current timestamp in milliseconds: ${currentDate.getTime()}

When calculating time ranges:
- "one year" or "past year" means from exactly one year before today to today (end: ${currentDate.getTime()})
- "last 6 months" means from 6 months before today to today
- Always use TODAY (${currentDate.toLocaleDateString()}) as the end point unless specifically stated otherwise
- Be sure to use the correct year - we are currently in ${currentDate.getFullYear()}

1. If the user mentions a specific time period:
   - "four months" or "past four months" = start: ${Math.floor(
     currentDate.getTime() - 120 * 24 * 60 * 60 * 1000
   )} (${new Date(
    Math.floor(currentDate.getTime() - 120 * 24 * 60 * 60 * 1000)
  ).toISOString()}), end: ${Math.floor(
    currentDate.getTime()
  )} (${currentDate.toISOString()})
   - "six months" = start: ${Math.floor(
     currentDate.getTime() - 180 * 24 * 60 * 60 * 1000
   )} (${new Date(
    Math.floor(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000)
  ).toISOString()}), end: ${Math.floor(
    currentDate.getTime()
  )} (${currentDate.toISOString()})
   - "one year" = start: ${Math.floor(
     currentDate.getTime() - 365 * 24 * 60 * 60 * 1000
   )} (${new Date(
    Math.floor(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000)
  ).toISOString()}), end: ${Math.floor(
    currentDate.getTime()
  )} (${currentDate.toISOString()})
   - Always use TODAY as the END timestamp: ${Math.floor(currentDate.getTime())}
   - Calculate the START by subtracting the period from TODAY
   - ALWAYS ensure timestamps are integers (no decimals) by using Math.floor()

2. Use the chart Visible Time Range if the user did not mention to use a specific timer range.
`;
}

async function processWithLLM({
  message,
  userId,
  sessionId,
  subscriptionId,
  isPreview,
  chartContext,
  db,
  onStream,
  onToolCall,
}: ProcessChatOptions): Promise<string> {
  // Get all chat history from current session for full context
  const historySnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("chat_history")
    .where("sessionId", "==", sessionId)
    .orderBy("timestamp", "asc")
    .get();

  const history = historySnapshot.docs.map((doc) => ({
    role: doc.data().role,
    content: doc.data().content,
  }));

  // Build system prompt with chart context
  let systemPrompt = `You are an AI assistant for a cryptocurrency trading chart application.
    You can control the chart through various tools including changing symbols, timeframes,
    adding indicators, drawing trend lines, and fetching price data.

    Important guidelines for indicators:
    - Available indicator IDs: 'volume', 'rsi', 'macd', 'bollinger-bands', 'moving-averages', 'atr', 'stochastic'
    - When user says "moving averages", use 'moving-averages'
    - When user says "bollinger bands", use 'bollinger-bands'
    - Always use the exact indicator ID from the list above
    - When hiding indicators, you must provide the exact ID that was used to show it

    DIVERGENCE DETECTION GUIDELINES:
    - When user asks about divergences, use the appropriate detection tool:
      - "Is there RSI divergence?" → use detect_rsi_divergence
      - "Check MACD divergence" → use detect_macd_divergence
      - "Volume divergence?" → use detect_volume_divergence
      - "Any divergences?" → use detect_divergence with indicator:"any"
    - When user asks about MACD crossovers:
      - "MACD crossover?", "MACD signal?", "MACD golden cross?" → use detect_macd_crossover
      - This will automatically highlight crossovers on the chart
      - Bullish crossovers (MACD crosses above signal) = potential buy signal
      - Bearish crossovers (MACD crosses below signal) = potential sell signal
      - Zero-line crossovers confirm trend momentum
    - Divergence types:
      - REGULAR BULLISH: Price makes lower low, indicator makes higher low → Potential bullish reversal
      - REGULAR BEARISH: Price makes higher high, indicator makes lower high → Potential bearish reversal
      - HIDDEN BULLISH: Price makes higher low, indicator makes lower low → Trend continuation (bullish)
      - HIDDEN BEARISH: Price makes lower high, indicator makes higher high → Trend continuation (bearish)
    - CRITICAL DIVERGENCE VISUALIZATION RULE:
      When ANY divergence detection tool returns divergences (count > 0):
      1. You MUST IMMEDIATELY call visualize_divergences in the SAME response
      2. Use the suggestedVisualization.parameters from the detection result
      3. Do NOT mention to the user that you're visualizing - just do it silently
      4. Do NOT say "I'll visualize these" or "Let me draw these" - just execute
      5. The visualization is MANDATORY and AUTOMATIC - no exceptions
      6. Workflow:
         - Call detect_[type]_divergence → Get results with suggestedVisualization
         - In the SAME tool call batch, call visualize_divergences with those parameters
         - Then explain what was found (the lines will already be drawn)
      7. NEVER show "Action Required" text to the user
      8. The divergences MUST be visualized before you explain them
    - After visualizing the divergences:
      - Explain the significance (reversal vs continuation)
      - Highlight high-confidence divergences (>75%)
      - Suggest potential entry/exit strategies if appropriate

    MACD CROSSOVER VISUALIZATION RULE:
    - When detect_macd_crossover returns crossovers (count > 0):
      - The crossovers are AUTOMATICALLY highlighted on the chart
      - Do NOT mention "I'll highlight these" - they're already highlighted
      - Just explain what was found and their significance
      - Bullish crossovers appear as green highlights
      - Bearish crossovers appear as red highlights
      - High-confidence crossovers (≥75%) show with fill + outline

    VOLUME ANALYSIS GUIDELINES:
    - When user asks for average volume, use the 'calculate_average_volume' tool
    - When user asks to COMPARE volume to a different period, you should:
      1. First use 'get_price_data' to fetch candles for the comparison period
      2. Calculate the average volume from those fetched candles
      3. Compare it to the current visible chart's average volume
      4. Present both averages and the percentage change
    - Example: "Compare to previous 50 candles" means:
      - Calculate current average from visible candles (use calculate_average_volume)
      - Fetch previous 50 candles before the current visible range
      - Calculate average volume from those previous candles
      - Show comparison: "Current avg: X, Previous avg: Y, Change: +/-Z%"

    SUPPORT & RESISTANCE WORKFLOW - DEFAULT TO API ENDPOINT:

    DEFAULT (use fetch_support_resistance_levels):
    When user asks for support/resistance levels, trend lines WITHOUT specifying AI:
    - "show support and resistance", "draw trend lines", "find levels"
    - "resistance levels", "support levels", "key levels"
    - This tool fetches pre-calculated levels from the market API
    - Draws horizontal lines at each level with confidence scores
    - More efficient and faster than AI analysis

    AI ANALYSIS (use draw_trend_line_from_analysis):
    ONLY when user explicitly asks for AI-based analysis:
    - "AI detected trend lines", "use AI to find support"
    - "analyze with AI", "AI-based resistance"
    - This tool uses OpenAI to analyze candle data
    - Draws diagonal trend lines connecting price points
    - More flexible but slower and costs more

    KEYWORDS for API-based levels (use fetch_support_resistance_levels):
    - "support", "resistance", "levels", "key levels"
    - "horizontal support", "horizontal resistance"
    - Default for any support/resistance request

    KEYWORDS for AI analysis (use draw_trend_line_from_analysis):
    - "AI detected", "AI analyzed", "use AI"
    - "connect highs", "connect lows" (diagonal lines)
    - "trend line analysis with AI"

    Interval/granularity: Map these EXACTLY:
       - "one day candles" or "daily" or "day candles" → "ONE_DAY"
       - "hourly" or "one hour" → "ONE_HOUR"
       - "4-hour" or "four hour" → "FOUR_HOUR"
       - If no interval is specified but a time range is mentioned, suggest an appropriate interval:
         - For 1 year or more: use ONE_DAY
         - For 3-12 months: use SIX_HOUR or ONE_DAY
         - For 1-3 months: use FOUR_HOUR or SIX_HOUR
         - For 1-4 weeks: use ONE_HOUR or TWO_HOUR
         - For less than 1 week: use THIRTY_MINUTE or ONE_HOUR

    Valid granularities: ONE_MINUTE, FIVE_MINUTE, FIFTEEN_MINUTE, THIRTY_MINUTE, ONE_HOUR, TWO_HOUR, SIX_HOUR, ONE_DAY
    `;

  // Add chart context if available
  if (chartContext) {
    systemPrompt += `\n\nCurrent Chart Context:
    - Symbol: ${chartContext.symbol}
    - Timeframe/Interval: ${chartContext.granularity}
    - Visible Time Range, use only if the user does not specify otherwise in the prompt: from ${
      chartContext.timeRange.start
    } to ${chartContext.timeRange.end} (timestamps in UTC milliseconds)
    - Visible Price Range: $${chartContext.priceRange.min.toFixed(
      2
    )} to $${chartContext.priceRange.max.toFixed(2)}`;

    // Add candles data context if available
    if (chartContext.candles && chartContext.candles.length > 0) {
      const latestCandle =
        chartContext.candles[chartContext.candles.length - 1];
      const oldestCandle = chartContext.candles[0];
      const totalVolume = chartContext.candles.reduce(
        (sum: number, c: any) => sum + (c.volume || 0),
        0
      );
      const avgVolume = totalVolume / chartContext.candles.length;

      // Calculate price trend
      const priceChange =
        ((latestCandle.close - oldestCandle.open) / oldestCandle.open) * 100;
      const isUptrend = priceChange > 0;

      // Find highest and lowest prices in visible candles
      const highestHigh = Math.max(
        ...chartContext.candles.map((c: any) => c.high)
      );
      const lowestLow = Math.min(
        ...chartContext.candles.map((c: any) => c.low)
      );

      systemPrompt += `

    PRICE AND VOLUME DATA (${chartContext.candles.length} visible candles):
    - Latest Price: $${latestCandle.close.toFixed(2)} (${new Date(
        latestCandle.timestamp
      ).toISOString()})
    - Price Change: ${priceChange.toFixed(2)}% (${
        isUptrend ? "UP" : "DOWN"
      } from $${oldestCandle.open.toFixed(2)})
    - Highest Price in View: $${highestHigh.toFixed(2)}
    - Lowest Price in View: $${lowestLow.toFixed(2)}
    - Total Volume: ${totalVolume.toLocaleString()}
    - Average Volume per Candle: ${avgVolume.toLocaleString()}
    - Latest Candle Volume: ${latestCandle.volume.toLocaleString()}

    When analyzing price action:
    - The chart shows ${chartContext.candles.length} candles of ${
        chartContext.granularity
      } timeframe
    - Each candle includes: open, high, low, close (OHLC), and volume
    - High volume on price increases suggests strong buying pressure
    - High volume on price decreases suggests strong selling pressure
    - Low volume moves may be less significant or lack conviction
    - Volume spikes often indicate important price levels or trend changes
    - Compare current volume to average volume to assess significance
    - Green/bullish candles: close > open, Red/bearish candles: close < open

    CANDLESTICK PATTERN ANALYSIS:
    When users ask about candlestick patterns (doji, hammer, shooting star, engulfing, etc.):
    - ALWAYS use the analyze_candlestick_patterns tool to detect patterns
    - This tool provides accurate pattern detection with significance levels
    - It will automatically highlight detected patterns on the chart
    - Includes support/resistance level context for better analysis

    Keywords that should trigger pattern analysis tool:
    - "patterns", "candlestick patterns", "doji", "hammer", "shooting star"
    - "engulfing", "morning star", "evening star", "reversal patterns"
    - "find patterns", "detect patterns", "analyze patterns"
    - "what patterns do you see", "any patterns forming"

    IMPORTANT: Do NOT try to calculate patterns manually from candle data.
    Always use the analyze_candlestick_patterns tool for accurate detection.`;
    }

    // Add indicators context if available
    if (chartContext.indicators && chartContext.indicators.length > 0) {
      systemPrompt += `

    ACTIVE INDICATORS (${chartContext.indicators.length} indicators):`;

      chartContext.indicators.forEach((indicator: any) => {
        systemPrompt += `
    - ${indicator.name || indicator.id} (ID: ${indicator.id})`;
        if (indicator.params) {
          systemPrompt += ` | Parameters: ${JSON.stringify(indicator.params)}`;
        }
        if (indicator.display) {
          systemPrompt += ` | Display: ${indicator.display}`;
        }
      });

      systemPrompt += `

    When discussing indicators:
    - Reference the specific indicators that are currently visible on the chart
    - Consider their parameters when giving interpretations
    - RSI: Look for overbought (>70) or oversold (<30) conditions
    - Moving Averages: Analyze trend direction and support/resistance levels
    - MACD: Check for momentum shifts and signal line crossovers
    - Bollinger Bands: Assess volatility and potential breakout/breakdown levels
    - Volume: Confirm price movements with corresponding volume changes
    - Stochastic: Identify potential reversal points in overbought/oversold zones
    - ATR: Gauge market volatility for position sizing and stop-loss placement
    - Always relate indicator signals to the current price action and volume`;
    }

    systemPrompt += `

    IMPORTANT - When using ANY price data tools (get_price_data, analyze_price_points):
    - symbol: "${chartContext.symbol}"
    - interval: "${chartContext.granularity}"
    - startTime: ${chartContext.timeRange.start}
    - endTime: ${chartContext.timeRange.end}

    VOLUME COMPARISON EXAMPLE:
    When user says "Compare that to the period of the previous 50 candles":
    1. Current visible candles already analyzed${
      chartContext.candles && chartContext.candles.length > 0
        ? `: ${chartContext.candles.length} candles`
        : ""
    }
    2. To get previous 50 candles, use get_price_data with:
       - symbol: "${chartContext.symbol}"
       - interval: "${chartContext.granularity}"
       - endTime: ${
         chartContext.timeRange.start
       } (start of current visible range)
       - limit: 50
    3. Calculate average volume from the fetched candles
    4. Compare: "Previous 50 candles avg: X, Current visible avg: Y, Change: +/-Z%"

    CRITICAL:
    - All timestamps are already in UTC milliseconds including time of day
    - All timestamps MUST be integers (no decimals). Use Math.floor() if needed.
    - Preserve the exact time values from the chart context (they include hours, minutes, seconds)

    Example for analyze_price_points:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "type": "highs",
      "count": 3
    }

    SUPPORT & RESISTANCE DRAWING:

    DEFAULT - Use fetch_support_resistance_levels for automatic levels:
    {
      "symbol": "${chartContext.symbol}",
      "granularity": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "maxSupports": 3,
      "maxResistances": 3
    }

    AI ANALYSIS - ONLY when explicitly requested:
    Use draw_trend_line_from_analysis for AI-detected trend lines:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "type": "resistance",
      "count": 2,
      "color": "#FF0000",
      "extendRight": true
    }`;
  }

  systemPrompt += `\n\nWhen the user asks you to perform chart actions, use the appropriate tools.
    When analyzing data, be concise and focus on key insights.
    Always confirm when you've executed commands on the chart.

    CRITICAL REMINDERS:
    - DEFAULT for support/resistance: Use fetch_support_resistance_levels (API-based)
    - ONLY use draw_trend_line_from_analysis when user explicitly asks for AI analysis
    - fetch_support_resistance_levels draws horizontal lines at price levels
    - draw_trend_line_from_analysis draws diagonal trend lines connecting points
    - NEVER use analyze_price_points + add_trend_line separately

    DRAWING HORIZONTAL LINES - USE THE DEDICATED TOOL:
    When user asks for horizontal lines, ALWAYS use draw_horizontal_line_at_price:
    - "draw horizontal line at current price" → use draw_horizontal_line_at_price with priceType="current"
    - "horizontal trend line at current price" → use draw_horizontal_line_at_price with priceType="current"
    - "draw line at current price" → use draw_horizontal_line_at_price with priceType="current"
    - "horizontal line at recent high" → use draw_horizontal_line_at_price with priceType="high"
    - "horizontal line at recent low" → use draw_horizontal_line_at_price with priceType="low"
    - "horizontal line at [specific price]" → use draw_horizontal_line_at_price with priceType="specific" and price=[value]

    NEVER use get_latest_price + add_trend_line for horizontal lines.
    ALWAYS use the draw_horizontal_line_at_price tool instead.

    ${getTimeframeExtractionPrompt()}`;

  // Build messages array
  const messages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    ...history,
    {
      role: "user" as const,
      content:
        message +
        // Add context hint when user asks for comparisons
        (message.toLowerCase().includes("compare") &&
        message.toLowerCase().includes("previous") &&
        message.toLowerCase().includes("candles")
          ? "\n\n[System hint: Use get_price_data to fetch historical candles for the comparison period, then calculate and compare the average volumes]"
          : ""),
    },
  ];

  // Create streaming chat completion with usage tracking
  const client = getOpenAI();
  const stream = await client.chat.completions.create({
    model: "gpt-4.1",
    messages,
    tools,
    tool_choice: "auto",
    stream: true,
    stream_options: {
      include_usage: true,
    },
    temperature: 0.3,
    max_tokens: 2000,
  });

  let functionCalls: any[] = [];
  let assistantMessage = "";
  let usageData: any = null;

  // Process stream
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    // Check for usage data in the chunk
    if (chunk.usage) {
      usageData = chunk.usage;
    }

    if (delta?.content) {
      // Stream content to client
      onStream(delta.content);
      assistantMessage += delta.content;
    }

    if (delta?.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        if (toolCall.index !== undefined) {
          if (!functionCalls[toolCall.index]) {
            functionCalls[toolCall.index] = {
              id: toolCall.id || "",
              function: {
                name: toolCall.function?.name || "",
                arguments: "",
              },
            };
          }

          const fc = functionCalls[toolCall.index];
          if (toolCall.id) fc.id = toolCall.id;
          if (toolCall.function?.name)
            fc.function.name = toolCall.function.name;
          if (toolCall.function?.arguments) {
            fc.function.arguments += toolCall.function.arguments;
          }
        }
      }
    }
  }

  // Execute tool calls
  console.log(`=== Processing ${functionCalls.length} tool calls ===`);
  for (const toolCall of functionCalls) {
    if (toolCall.function.name && toolCall.function.arguments) {
      console.log(`Executing tool: ${toolCall.function.name}`);
      console.log(`Arguments: ${toolCall.function.arguments}`);

      try {
        // Parse arguments
        const args = JSON.parse(toolCall.function.arguments);

        // Check if it's a chart command or data fetch
        if (chartTools.isChartTool(toolCall.function.name)) {
          // Special handling for drawing horizontal line at price
          if (toolCall.function.name === "draw_horizontal_line_at_price") {
            try {
              console.log("Drawing horizontal line at price:", args);

              let targetPrice: number;
              let lineName: string;

              // Determine the price based on priceType
              if (args.priceType === "current") {
                // Fetch the current price
                const API_BASE_URL =
                  "https://market-evaluators-dev-346028322665.europe-west1.run.app";
                const now = Date.now();
                const oneHourAgo = now - 60 * 60 * 1000;

                const params = new URLSearchParams({
                  symbol: chartContext.symbol,
                  granularity: "ONE_MINUTE",
                  start_time: Math.floor(oneHourAgo).toString(),
                  end_time: Math.floor(now).toString(),
                  exchange: "coinbase",
                });

                const response = await fetch(
                  `${API_BASE_URL}/history?${params}`
                );

                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch current price: ${response.statusText}`
                  );
                }

                const data: any = await response.json();
                const candles = data.candles || data || [];

                if (candles.length === 0) {
                  throw new Error("No price data available");
                }

                const latestCandle = candles[candles.length - 1];
                targetPrice = latestCandle.close || latestCandle.c;
                lineName =
                  args.name || `Current Price: $${targetPrice.toFixed(2)}`;

                onStream(
                  `\n\n📍 Drawing horizontal line at current price: $${targetPrice.toFixed(
                    2
                  )}`
                );
              } else if (args.priceType === "high") {
                // Get the high from visible candles
                const visibleCandles = chartContext.candles || [];
                if (visibleCandles.length === 0) {
                  throw new Error("No visible candles to determine high");
                }
                targetPrice = Math.max(
                  ...visibleCandles.map((c: any) => c.high || c.h || 0)
                );
                lineName =
                  args.name || `Recent High: $${targetPrice.toFixed(2)}`;

                onStream(
                  `\n\n📈 Drawing horizontal line at recent high: $${targetPrice.toFixed(
                    2
                  )}`
                );
              } else if (args.priceType === "low") {
                // Get the low from visible candles
                const visibleCandles = chartContext.candles || [];
                if (visibleCandles.length === 0) {
                  throw new Error("No visible candles to determine low");
                }
                targetPrice = Math.min(
                  ...visibleCandles.map(
                    (c: any) => c.low || c.l || Number.MAX_VALUE
                  )
                );
                lineName =
                  args.name || `Recent Low: $${targetPrice.toFixed(2)}`;

                onStream(
                  `\n\n📉 Drawing horizontal line at recent low: $${targetPrice.toFixed(
                    2
                  )}`
                );
              } else if (args.priceType === "specific") {
                if (args.price === undefined || args.price === null) {
                  throw new Error(
                    "Price is required when priceType is 'specific'"
                  );
                }
                targetPrice = args.price;
                lineName =
                  args.name || `Price Level: $${targetPrice.toFixed(2)}`;

                onStream(
                  `\n\n📊 Drawing horizontal line at $${targetPrice.toFixed(2)}`
                );
              } else {
                throw new Error(`Invalid priceType: ${args.priceType}`);
              }

              // Create the horizontal price line arguments
              const priceLineArgs = {
                price: targetPrice,
                color: args.color || "#2962ff",
                lineWidth: args.lineWidth || 2,
                style: args.style || "solid",
                extendLeft:
                  args.extendLeft !== undefined ? args.extendLeft : true,
                extendRight:
                  args.extendRight !== undefined ? args.extendRight : true,
                label: {
                  text: lineName,
                  position: "left" as const,
                  backgroundColor: (args.color || "#2962ff") + "66", // 40% opacity (66 in hex)
                  textColor: "#ffffff",
                  fontSize: 11,
                },
                showPriceLabel: true,
                draggable: false,
                levelType: "horizontal",
                opacity: args.opacity || 0.8,
              };

              // Create the add_price_line command
              const priceLineToolCall = {
                ...toolCall,
                function: {
                  name: "add_price_line",
                  arguments: JSON.stringify(priceLineArgs),
                },
              };

              // Execute the price line command
              await onToolCall(priceLineToolCall);

              // Send confirmation
              const confirmationMessage = chartTools.getConfirmationMessage(
                toolCall.function.name,
                args
              );
              onStream("\n\n" + confirmationMessage);
              assistantMessage += "\n\n" + confirmationMessage;
            } catch (error: any) {
              console.error("Error drawing horizontal line:", error);
              onStream(
                `\n\n❌ Failed to draw horizontal line: ${error.message}`
              );
              assistantMessage += `\n\n❌ Failed to draw horizontal line: ${error.message}`;
            }
          } else if (
            toolCall.function.name === "fetch_support_resistance_levels"
          ) {
            try {
              console.log("Fetching support/resistance levels from API...");

              // Helper function to format granularity for display
              const formatGranularity = (granularity: string): string => {
                const formatMap: Record<string, string> = {
                  ONE_MINUTE: "1m",
                  FIVE_MINUTE: "5m",
                  FIFTEEN_MINUTE: "15m",
                  THIRTY_MINUTE: "30m",
                  ONE_HOUR: "1h",
                  TWO_HOUR: "2h",
                  FOUR_HOUR: "4h",
                  SIX_HOUR: "6h",
                  ONE_DAY: "1d",
                };
                return (
                  formatMap[granularity] ||
                  granularity.toLowerCase().replace(/_/g, " ")
                );
              };

              // Format dates for display in UTC with time component
              const formatUTCDateTime = (timestamp: number): string => {
                const date = new Date(timestamp);
                const year = date.getUTCFullYear();
                const month = date.toLocaleString("en-US", {
                  month: "short",
                  timeZone: "UTC",
                });
                const day = date.getUTCDate();
                const hours = date.getUTCHours().toString().padStart(2, "0");
                const minutes = date
                  .getUTCMinutes()
                  .toString()
                  .padStart(2, "0");
                return `${month} ${day}, ${year} ${hours}:${minutes} UTC`;
              };

              const startDateTime = formatUTCDateTime(args.startTime);
              const endDateTime = formatUTCDateTime(args.endTime);

              // Stream initial status to user with UTC times
              onStream(
                `\n\n📊 Fetching support and resistance levels for ${
                  args.symbol
                } (${formatGranularity(
                  args.granularity
                )}) from ${startDateTime} to ${endDateTime}...`
              );

              // Log the exact timestamps being used for debugging
              console.log(
                `Using exact UTC timestamps - Start: ${
                  args.startTime
                } (${new Date(args.startTime).toISOString()}), ` +
                  `End: ${args.endTime} (${new Date(
                    args.endTime
                  ).toISOString()})`
              );

              // Call the price tool to get levels from API
              const levelsData = await priceTools.execute(
                "get_support_resistance_levels",
                {
                  symbol: args.symbol,
                  granularity: args.granularity,
                  startTime: args.startTime,
                  endTime: args.endTime,
                  maxSupports: args.maxSupports || 3,
                  maxResistances: args.maxResistances || 3,
                },
                db
              );

              console.log(
                `API returned ${levelsData.supports.length} support and ${levelsData.resistances.length} resistance levels`,
                JSON.stringify(levelsData, null, 2)
              );

              // Stream summary header to user
              if (
                levelsData.supports.length > 0 ||
                levelsData.resistances.length > 0
              ) {
                onStream(
                  `\n📊 Support/Resistance Analysis Summary:\n\n` + `---\n\n`
                );
              } else {
                onStream(
                  "\n⚠️ No significant support or resistance levels found in the current data\n"
                );
                continue; // Skip to next tool call if no levels found
              }

              const granularityLabel = formatGranularity(args.granularity);

              // Helper functions for enhanced output
              const getStrengthLabel = (confidence: number): string => {
                if (confidence >= 80) return "VERY HIGH";
                if (confidence >= 60) return "HIGH";
                if (confidence >= 40) return "MEDIUM";
                return "LOW";
              };

              const getRelativeTime = (timestamp: number | string): string => {
                const now = new Date();
                const date = new Date(timestamp);
                const diffMs = now.getTime() - date.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays === 0) return "Today";
                if (diffDays === 1) return "Yesterday";
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30)
                  return `${Math.floor(diffDays / 7)} week${
                    Math.floor(diffDays / 7) > 1 ? "s" : ""
                  } ago`;
                return `${Math.floor(diffDays / 30)} month${
                  Math.floor(diffDays / 30) > 1 ? "s" : ""
                } ago`;
              };

              const generateLevelNote = (
                level: any,
                type: "support" | "resistance"
              ): string => {
                const notes = [];

                if (level.type === "spike") {
                  notes.push("⚠️ Extreme reversal with high volatility");
                } else if (level.type === "swing") {
                  notes.push("Major reversal point");
                } else {
                  notes.push("Consolidation zone");
                }

                if (level.tests >= 4) {
                  notes.push(
                    `strong ${type === "support" ? "buyer" : "seller"} interest`
                  );
                } else if (level.tests >= 2) {
                  notes.push(
                    `moderate ${
                      type === "support" ? "buying" : "selling"
                    } pressure`
                  );
                }

                if (
                  level.adjustedConfidence &&
                  level.adjustedConfidence > level.confidence
                ) {
                  notes.push("indicators confirm strength");
                }

                return notes.join(", ");
              };

              // Define color schemes for different level types
              const colors = {
                spike: {
                  support: "#00FF00", // Electric green (maximum saturation)
                  resistance: "#FF0000", // Electric red (maximum saturation)
                },
                swing: {
                  support: "#22DD22", // Bright green (85% saturation)
                  resistance: "#DD2222", // Bright red (85% saturation)
                },
                horizontal: {
                  support: "#66CC66", // Soft green (60% saturation)
                  resistance: "#CC6666", // Soft red (60% saturation)
                },
              };

              // Output support levels header if we have supports
              if (levelsData.supports.length > 0) {
                onStream(
                  `\n🟢 SUPPORT LEVELS (${levelsData.supports.length} found):\n\n`
                );
              }

              // Draw horizontal lines for each support level
              for (let index = 0; index < levelsData.supports.length; index++) {
                const support = levelsData.supports[index];
                const levelType: "spike" | "swing" | "horizontal" =
                  support.type || "horizontal";
                const adjustedConfidence =
                  support.adjustedConfidence || support.confidence;

                // Determine line style based on adjusted confidence
                let lineStyle = "solid";
                if (adjustedConfidence < 50) {
                  lineStyle = "dotted";
                } else if (adjustedConfidence < 70) {
                  lineStyle = "dashed";
                }

                // Create a horizontal price line at the support price
                const supportLineArgs = {
                  price: support.price,

                  // Enhanced visual properties based on level type
                  color: colors[levelType].support,
                  lineWidth:
                    levelType === "spike" ? 4 : levelType === "swing" ? 3 : 1.5,
                  style: lineStyle,
                  opacity: 0.5 + (adjustedConfidence / 100) * 0.5,

                  // Label configuration
                  label: {
                    text: `${
                      levelType === "spike"
                        ? "⚡ Spike"
                        : levelType === "swing"
                        ? "◆ Swing"
                        : "— Horizontal"
                    } ${granularityLabel}: Support $${support.price.toFixed(
                      2
                    )}`,
                    position: "left" as const,
                    backgroundColor: colors[levelType].support + "66", // 40% opacity (66 in hex)
                    textColor: "#ffffff",
                    fontSize: 11,
                  },

                  // New properties for advanced visualization
                  levelType: levelType,
                  zIndex:
                    levelType === "spike"
                      ? 110
                      : levelType === "swing"
                      ? 100
                      : 90,
                  markers:
                    levelType === "spike"
                      ? {
                          enabled: true,
                          symbol: "triangle" as const,
                          size: 6,
                          spacing: 80,
                          color: colors[levelType].support,
                        }
                      : levelType === "swing"
                      ? {
                          enabled: true,
                          symbol: "diamond" as const,
                          size: 4,
                          spacing: 100,
                          color: colors[levelType].support,
                        }
                      : undefined,

                  // Add pulsating animation for spike levels
                  animation:
                    levelType === "spike"
                      ? {
                          type: "pulse" as const,
                          duration: 2000,
                          intensity: 0.3,
                          enabled: true,
                        }
                      : undefined,

                  // Price line specific properties
                  draggable: false,
                  extendLeft: true,
                  extendRight: true,
                  showPriceLabel: true,

                  // Store metadata
                  metadata: {
                    description:
                      support.description ||
                      `${
                        levelType === "spike"
                          ? "Spike Level (Extreme Reversal)"
                          : levelType === "swing"
                          ? "Swing Level"
                          : "Horizontal Level"
                      } | Confidence: ${adjustedConfidence.toFixed(0)}%${
                        adjustedConfidence !== support.confidence
                          ? ` (adjusted from ${support.confidence.toFixed(
                              0
                            )}% by indicators)`
                          : ""
                      } | Tests: ${support.tests}`,
                    levelType: levelType,
                    confidence: adjustedConfidence,
                    tests: support.tests,
                  },

                  // Add lastTest field for browser to convert to local timezone
                  lastTest: support.lastTest || undefined,
                };

                // Create the add_price_line command
                const supportLineToolCall = {
                  ...toolCall,
                  function: {
                    name: "add_price_line",
                    arguments: JSON.stringify(supportLineArgs),
                  },
                };

                // Write trend line command to Firestore
                await onToolCall(supportLineToolCall);

                // Output detailed information for this support level
                onStream(
                  `\n**${index + 1}. ${
                    levelType === "spike"
                      ? "⚡ Critical Spike"
                      : levelType === "swing"
                      ? "◆ Strong Swing"
                      : "— Horizontal"
                  } Support at $${support.price.toFixed(2)}**\n` +
                    `- **Type:** ${
                      levelType === "spike"
                        ? "Spike Level (Extreme Price Rejection)"
                        : levelType === "swing"
                        ? "Swing Level (Precise Reversal Point)"
                        : "Horizontal Level (Consolidation Zone)"
                    }\n` +
                    `- **Confidence:** ${adjustedConfidence.toFixed(0)}%${
                      adjustedConfidence !== support.confidence
                        ? ` (adjusted from ${support.confidence.toFixed(
                            0
                          )}% by indicators)`
                        : ""
                    }\n` +
                    `- **Strength:** ${getStrengthLabel(
                      adjustedConfidence
                    )} - Tested ${support.tests} time${
                      support.tests !== 1 ? "s" : ""
                    }\n` +
                    `- **Last Test:** ${getRelativeTime(
                      support.lastTest
                    )} <span class="timestamp-utc" data-timestamp="${
                      support.lastTest
                    }">(loading time...)</span>\n` +
                    `- **Visual:** ${
                      lineStyle === "solid"
                        ? "Solid"
                        : lineStyle === "dashed"
                        ? "Dashed"
                        : "Dotted"
                    } line${
                      levelType === "spike"
                        ? " with triangle markers and pulsating animation"
                        : levelType === "swing"
                        ? " with diamond markers"
                        : ", no markers"
                    }\n` +
                    `- **Note:** ${generateLevelNote(support, "support")}\n\n`
                );
              }

              // Output resistance levels header if we have resistances
              if (levelsData.resistances.length > 0) {
                onStream(
                  `\n🔴 RESISTANCE LEVELS (${levelsData.resistances.length} found):\n\n`
                );
              }

              // Draw horizontal lines for each resistance level
              for (
                let index = 0;
                index < levelsData.resistances.length;
                index++
              ) {
                const resistance = levelsData.resistances[index];
                const levelType: "spike" | "swing" | "horizontal" =
                  resistance.type || "horizontal";
                const adjustedConfidence =
                  resistance.adjustedConfidence || resistance.confidence;

                // Determine line style based on adjusted confidence
                let lineStyle = "solid";
                if (adjustedConfidence < 50) {
                  lineStyle = "dotted";
                } else if (adjustedConfidence < 70) {
                  lineStyle = "dashed";
                }

                // Create a horizontal price line at the resistance price
                const resistanceLineArgs = {
                  price: resistance.price,

                  // Enhanced visual properties based on level type
                  color: colors[levelType].resistance,
                  lineWidth:
                    levelType === "spike" ? 4 : levelType === "swing" ? 3 : 1.5,
                  style: lineStyle,
                  opacity: 0.5 + (adjustedConfidence / 100) * 0.5,

                  // Label configuration
                  label: {
                    text: `${
                      levelType === "spike"
                        ? "⚡ Spike"
                        : levelType === "swing"
                        ? "◆ Swing"
                        : "— Horizontal"
                    } ${granularityLabel}: Resistance $${resistance.price.toFixed(
                      2
                    )}`,
                    position: "left" as const,
                    backgroundColor: colors[levelType].resistance + "66", // 40% opacity (66 in hex)
                    textColor: "#ffffff",
                    fontSize: 11,
                  },

                  // New properties for advanced visualization
                  levelType: levelType,
                  zIndex:
                    levelType === "spike"
                      ? 110
                      : levelType === "swing"
                      ? 100
                      : 90,
                  markers:
                    levelType === "spike"
                      ? {
                          enabled: true,
                          symbol: "triangle" as const,
                          size: 6,
                          spacing: 80,
                          color: colors[levelType].resistance,
                        }
                      : levelType === "swing"
                      ? {
                          enabled: true,
                          symbol: "diamond" as const,
                          size: 4,
                          spacing: 100,
                          color: colors[levelType].resistance,
                        }
                      : undefined,

                  // Add pulsating animation for spike levels
                  animation:
                    levelType === "spike"
                      ? {
                          type: "pulse" as const,
                          duration: 2000,
                          intensity: 0.3,
                          enabled: true,
                        }
                      : undefined,

                  // Price line specific properties
                  draggable: false,
                  extendLeft: true,
                  extendRight: true,
                  showPriceLabel: true,

                  // Store metadata
                  metadata: {
                    description:
                      resistance.description ||
                      `${
                        levelType === "spike"
                          ? "Spike Level (Extreme Reversal)"
                          : levelType === "swing"
                          ? "Swing Level"
                          : "Horizontal Level"
                      } | Confidence: ${adjustedConfidence.toFixed(0)}%${
                        adjustedConfidence !== resistance.confidence
                          ? ` (adjusted from ${resistance.confidence.toFixed(
                              0
                            )}% by indicators)`
                          : ""
                      } | Tests: ${resistance.tests}`,
                    levelType: levelType,
                    confidence: adjustedConfidence,
                    tests: resistance.tests,
                  },

                  // Add lastTest field for browser to convert to local timezone
                  lastTest: resistance.lastTest || undefined,
                };

                // Create the add_price_line command
                const resistanceLineToolCall = {
                  ...toolCall,
                  function: {
                    name: "add_price_line",
                    arguments: JSON.stringify(resistanceLineArgs),
                  },
                };

                // Write trend line command to Firestore
                await onToolCall(resistanceLineToolCall);

                // Output detailed information for this resistance level
                onStream(
                  `\n**${index + 1}. ${
                    levelType === "spike"
                      ? "⚡ Critical Spike"
                      : levelType === "swing"
                      ? "◆ Strong Swing"
                      : "— Horizontal"
                  } Resistance at $${resistance.price.toFixed(2)}**\n` +
                    `- **Type:** ${
                      levelType === "spike"
                        ? "Spike Level (Extreme Price Rejection)"
                        : levelType === "swing"
                        ? "Swing Level (Precise Reversal Point)"
                        : "Horizontal Level (Consolidation Zone)"
                    }\n` +
                    `- **Confidence:** ${adjustedConfidence.toFixed(0)}%${
                      adjustedConfidence !== resistance.confidence
                        ? ` (adjusted from ${resistance.confidence.toFixed(
                            0
                          )}% by indicators)`
                        : ""
                    }\n` +
                    `- **Strength:** ${getStrengthLabel(
                      adjustedConfidence
                    )} - Tested ${resistance.tests} time${
                      resistance.tests !== 1 ? "s" : ""
                    }\n` +
                    `- **Last Test:** ${getRelativeTime(
                      resistance.lastTest
                    )} <span class="timestamp-utc" data-timestamp="${
                      resistance.lastTest
                    }">(loading time...)</span>\n` +
                    `- **Visual:** ${
                      lineStyle === "solid"
                        ? "Solid"
                        : lineStyle === "dashed"
                        ? "Dashed"
                        : "Dotted"
                    } line${
                      levelType === "spike"
                        ? " with triangle markers and pulsating animation"
                        : levelType === "swing"
                        ? " with diamond markers"
                        : ", no markers"
                    }\n` +
                    `- **Note:** ${generateLevelNote(
                      resistance,
                      "resistance"
                    )}\n\n`
                );
              }

              // Add comprehensive summary at the end
              const totalLines =
                levelsData.supports.length + levelsData.resistances.length;

              if (totalLines > 0) {
                // Find strongest levels
                const strongestSupport =
                  levelsData.supports.length > 0
                    ? levelsData.supports.reduce(
                        (max: any, s: any) =>
                          (s.adjustedConfidence || s.confidence || 0) >
                          (max.adjustedConfidence || max.confidence || 0)
                            ? s
                            : max,
                        levelsData.supports[0]
                      )
                    : null;

                const strongestResistance =
                  levelsData.resistances.length > 0
                    ? levelsData.resistances.reduce(
                        (max: any, r: any) =>
                          (r.adjustedConfidence || r.confidence || 0) >
                          (max.adjustedConfidence || max.confidence || 0)
                            ? r
                            : max,
                        levelsData.resistances[0]
                      )
                    : null;

                const spikeLevelsCount = [
                  ...levelsData.supports,
                  ...levelsData.resistances,
                ].filter((l: any) => l.type === "spike").length;
                const swingLevelsCount = [
                  ...levelsData.supports,
                  ...levelsData.resistances,
                ].filter((l: any) => l.type === "swing").length;
                const horizontalLevelsCount = [
                  ...levelsData.supports,
                  ...levelsData.resistances,
                ].filter((l: any) => l.type === "horizontal").length;

                onStream(
                  `\n## 📈 **Analysis Summary**\n\n` +
                    `---\n\n` +
                    `**Total Levels Identified:** ${totalLines}\n` +
                    `• Support Levels: ${levelsData.supports.length}\n` +
                    `• Resistance Levels: ${levelsData.resistances.length}\n\n` +
                    `**Level Types:**\n` +
                    (spikeLevelsCount > 0
                      ? `• ⚡ Spike Levels (Extreme Reversals): ${spikeLevelsCount}\n`
                      : "") +
                    `• ◆ Swing Levels (Precise Reversals): ${swingLevelsCount}\n` +
                    `• — Horizontal Levels (Consolidation Zones): ${horizontalLevelsCount}\n\n` +
                    `**Key Levels to Watch:**\n` +
                    (strongestSupport
                      ? `• Strongest Support: $${strongestSupport.price.toFixed(
                          2
                        )} ` +
                        `(${(
                          strongestSupport.adjustedConfidence ||
                          strongestSupport.confidence ||
                          0
                        ).toFixed(0)}% confidence, ` +
                        `${strongestSupport.tests || 1} test${
                          (strongestSupport.tests || 1) > 1 ? "s" : ""
                        })\n`
                      : "") +
                    (strongestResistance
                      ? `• Strongest Resistance: $${strongestResistance.price.toFixed(
                          2
                        )} ` +
                        `(${(
                          strongestResistance.adjustedConfidence ||
                          strongestResistance.confidence ||
                          0
                        ).toFixed(0)}% confidence, ` +
                        `${strongestResistance.tests || 1} test${
                          (strongestResistance.tests || 1) > 1 ? "s" : ""
                        })\n`
                      : "") +
                    `\n**Visual Guide:**\n` +
                    `• 🟢 Green lines = Support levels (price floor)\n` +
                    `• 🔴 Red lines = Resistance levels (price ceiling)\n` +
                    `• ⚡ Pulsating lines = Spike levels (extreme reversals with highest priority)\n` +
                    `• ◆ Diamond markers = Swing levels (strong reversal points)\n` +
                    `• — No markers = Horizontal levels (consolidation areas)\n` +
                    `• Line thickness: Spike (4px) > Swing (3px) > Horizontal (1.5px)\n` +
                    `• Line style indicates confidence: Solid (>70%), Dashed (40-70%), Dotted (<40%)\n\n` +
                    `💡 **Trading Tip:** Pay special attention to levels with high confidence and multiple tests, ` +
                    `as these tend to be more reliable for planning entry/exit points.\n\n` +
                    `✅ Successfully drew ${totalLines} support and resistance level${
                      totalLines > 1 ? "s" : ""
                    } on the chart.\n`
                );
              }
            } catch (error: any) {
              console.error("Error fetching support/resistance levels:", error);
              onStream(
                `\n\nFailed to fetch support/resistance levels: ${error.message}`
              );
              assistantMessage += `\n\nFailed to fetch support/resistance levels: ${error.message}`;
            }
          }
          // Special handling for calculate_average_volume tool
          else if (toolCall.function.name === "calculate_average_volume") {
            try {
              console.log("Calculating average volume from chart candles...");

              // Check if we have candles data in the chart context
              if (
                !chartContext ||
                !chartContext.candles ||
                chartContext.candles.length === 0
              ) {
                onStream(
                  "\n\n⚠️ No candle data available to calculate volume statistics."
                );
                assistantMessage +=
                  "\n\n⚠️ No candle data available to calculate volume statistics.";
                continue;
              }

              const candles = chartContext.candles;

              // Calculate volume statistics
              const totalVolume = candles.reduce(
                (sum: number, c: any) => sum + (c.volume || 0),
                0
              );
              const avgVolume = totalVolume / candles.length;

              // Find highest and lowest volume candles
              let highestVolumeCandle = candles[0];
              let lowestVolumeCandle = candles[0];

              candles.forEach((candle: any) => {
                if (candle.volume > highestVolumeCandle.volume) {
                  highestVolumeCandle = candle;
                }
                if (candle.volume < lowestVolumeCandle.volume) {
                  lowestVolumeCandle = candle;
                }
              });

              // Calculate volume trend (comparing first half to second half)
              const midPoint = Math.floor(candles.length / 2);
              const firstHalfVolume =
                candles
                  .slice(0, midPoint)
                  .reduce((sum: number, c: any) => sum + (c.volume || 0), 0) /
                midPoint;
              const secondHalfVolume =
                candles
                  .slice(midPoint)
                  .reduce((sum: number, c: any) => sum + (c.volume || 0), 0) /
                (candles.length - midPoint);
              const volumeTrendPercent =
                ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100;

              // Calculate volume volatility (standard deviation)
              const volumeVariance =
                candles.reduce((sum: number, c: any) => {
                  const diff = (c.volume || 0) - avgVolume;
                  return sum + diff * diff;
                }, 0) / candles.length;
              const volumeStdDev = Math.sqrt(volumeVariance);
              const volumeCoefficient = (volumeStdDev / avgVolume) * 100;

              // Format large numbers
              const formatVolume = (volume: number): string => {
                if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
                if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
                if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
                return volume.toFixed(2);
              };

              // Format timestamp for display
              const formatTimestamp = (timestamp: number): string => {
                const date = new Date(timestamp);
                return date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                  timeZoneName: "short",
                });
              };

              // Count green vs red candles with volume
              const bullishVolume = candles
                .filter((c: any) => c.close > c.open)
                .reduce((sum: number, c: any) => sum + (c.volume || 0), 0);
              const bearishVolume = candles
                .filter((c: any) => c.close <= c.open)
                .reduce((sum: number, c: any) => sum + (c.volume || 0), 0);
              const bullishVolumePercent = (bullishVolume / totalVolume) * 100;

              // Generate the output
              let output = `\n\n📊 **Volume Analysis Report**\n\n`;
              output += `---\n\n`;
              output += `**Overview:**\n`;
              output += `- Symbol: ${chartContext.symbol}\n`;
              output += `- Timeframe: ${chartContext.granularity}\n`;
              output += `- Candles Analyzed: ${candles.length}\n\n`;

              output += `**Volume Statistics:**\n`;
              output += `- **Total Volume:** ${formatVolume(totalVolume)}\n`;
              output += `- **Average Volume per Candle:** ${formatVolume(
                avgVolume
              )}\n`;
              output += `- **Volume Volatility:** ${volumeCoefficient.toFixed(
                1
              )}% (${
                volumeCoefficient < 30
                  ? "Low"
                  : volumeCoefficient < 60
                  ? "Moderate"
                  : "High"
              })\n\n`;

              output += `**Volume Extremes:**\n`;
              output += `- **Highest Volume:** ${formatVolume(
                highestVolumeCandle.volume
              )} at ${formatTimestamp(highestVolumeCandle.timestamp)}\n`;
              output += `  - Price: $${highestVolumeCandle.close.toFixed(2)} (${
                highestVolumeCandle.close > highestVolumeCandle.open
                  ? "🟢 Bullish"
                  : "🔴 Bearish"
              } candle)\n`;
              output += `- **Lowest Volume:** ${formatVolume(
                lowestVolumeCandle.volume
              )} at ${formatTimestamp(lowestVolumeCandle.timestamp)}\n`;
              output += `  - Price: $${lowestVolumeCandle.close.toFixed(2)} (${
                lowestVolumeCandle.close > lowestVolumeCandle.open
                  ? "🟢 Bullish"
                  : "🔴 Bearish"
              } candle)\n\n`;

              output += `**Volume Trend Analysis:**\n`;
              output += `- **First Half Avg:** ${formatVolume(
                firstHalfVolume
              )}\n`;
              output += `- **Second Half Avg:** ${formatVolume(
                secondHalfVolume
              )}\n`;
              output += `- **Trend:** ${
                volumeTrendPercent > 10
                  ? "📈 Increasing"
                  : volumeTrendPercent < -10
                  ? "📉 Decreasing"
                  : "➡️ Stable"
              } (${
                volumeTrendPercent > 0 ? "+" : ""
              }${volumeTrendPercent.toFixed(1)}%)\n\n`;

              output += `**Volume Distribution:**\n`;
              output += `- **Bullish Volume:** ${formatVolume(
                bullishVolume
              )} (${bullishVolumePercent.toFixed(1)}%)\n`;
              output += `- **Bearish Volume:** ${formatVolume(
                bearishVolume
              )} (${(100 - bullishVolumePercent).toFixed(1)}%)\n`;
              output += `- **Buy/Sell Pressure:** ${
                bullishVolumePercent > 55
                  ? "🟢 Buying pressure dominant"
                  : bullishVolumePercent < 45
                  ? "🔴 Selling pressure dominant"
                  : "⚪ Balanced"
              }\n\n`;

              // Add interpretation
              output += `**💡 Interpretation:**\n`;

              // Volume trend interpretation
              if (volumeTrendPercent > 20) {
                output += `- Volume is significantly increasing, suggesting growing market interest and potential trend acceleration.\n`;
              } else if (volumeTrendPercent < -20) {
                output += `- Volume is declining, which may indicate decreasing market interest or consolidation.\n`;
              }

              // Volume distribution interpretation
              if (bullishVolumePercent > 60) {
                output += `- Strong buying volume dominates, supporting bullish momentum.\n`;
              } else if (bullishVolumePercent < 40) {
                output += `- Heavy selling volume suggests bearish pressure in the market.\n`;
              }

              // Volatility interpretation
              if (volumeCoefficient > 60) {
                output += `- High volume volatility indicates irregular trading patterns, possibly from news events or whale activity.\n`;
              } else if (volumeCoefficient < 30) {
                output += `- Low volume volatility suggests consistent trading activity without major disruptions.\n`;
              }

              // Relative volume interpretation
              if (candles.length >= 10) {
                const recentAvg =
                  candles
                    .slice(-5)
                    .reduce((sum: number, c: any) => sum + (c.volume || 0), 0) /
                  5;
                const relativeVolume = (recentAvg / avgVolume) * 100;
                if (relativeVolume > 120) {
                  output += `- Recent volume (${formatVolume(recentAvg)}) is ${(
                    relativeVolume - 100
                  ).toFixed(
                    0
                  )}% above average, signaling increased activity.\n`;
                } else if (relativeVolume < 80) {
                  output += `- Recent volume (${formatVolume(recentAvg)}) is ${(
                    100 - relativeVolume
                  ).toFixed(0)}% below average, indicating reduced activity.\n`;
                }
              }

              onStream(output);
              assistantMessage += output;
            } catch (error: any) {
              console.error("Error calculating volume statistics:", error);
              onStream(
                `\n\nFailed to calculate volume statistics: ${error.message}`
              );
              assistantMessage += `\n\nFailed to calculate volume statistics: ${error.message}`;
            }
          }
          // Special handling for AI-based trend line tool
          else if (toolCall.function.name === "draw_trend_line_from_analysis") {
            try {
              console.log("Using OpenAI to analyze trend lines...");

              // Stream initial status to user
              onStream("\n\n🔍 Analyzing chart data for trend lines...");

              // Fetch candle data for the time range
              const candleData = await priceTools.execute(
                "get_price_data",
                {
                  symbol: args.symbol,
                  interval: args.interval,
                  startTime: args.startTime,
                  endTime: args.endTime,
                },
                db
              );

              console.log(
                `Fetched ${candleData.candles.length} candles for analysis`
              );

              // Update user on progress
              onStream(
                `\n📊 Processing ${candleData.candles.length} candles for ${
                  args.type || "trend line"
                } patterns...`
              );

              // Prepare candles for OpenAI analysis
              const candles = candleData.candles.map((c: any) => ({
                timestamp: c.timestamp || c.time || c.t,
                open: c.open || c.o,
                high: c.high || c.h,
                low: c.low || c.l,
                close: c.close || c.c,
                volume: c.volume || c.v || 0,
              }));

              // Inform user we're starting analysis
              onStream(`\n🤖 Identifying key levels...`);

              // Build prompt for OpenAI to analyze trend lines
              const trendLinePrompt = `Analyze the following cryptocurrency price candle data and identify significant trend lines.

CANDLE DATA (${args.symbol}, ${args.interval}):
${JSON.stringify(candles.slice(0, 100), null, 2)} ${
                candles.length > 100
                  ? `... and ${candles.length - 100} more candles`
                  : ""
              }

TIME RANGE CONTEXT:
- Start: ${new Date(args.startTime).toISOString()}
- End: ${new Date(args.endTime).toISOString()}
- User requested: ${args.type || "both support and resistance"} trend lines

1. Look for obvious swing highs and lows
2. Mark zones, not single lines. Support/resistance works better as zones because price rarely reacts to a single tick.
3. Recent vs. older levels. Most recent levels matter most for immediate trading.
4. Volume context. If volume was high at a rejection → strong resistance. If volume was high at a support → strong defense from buyers.
5. Don't add more than 4 trend lines of one type. Favor the lines with strong confidence.

If breakouts through these zones happen with high volume, you’d expect continuation.

Return your analysis in this JSON format:
{
  "trendLines": [
    {
      "type": "support" or "resistance",
      "start": { "timestamp": <ms>, "price": <number> },
      "end": { "timestamp": <ms>, "price": <number> },
      "confidence": "high" | "medium" | "low",
      "explanation": "Brief explanation"
    }
  ],
  "summary": "Overall market structure analysis"
}`;

              // Notify user that AI is analyzing
              onStream(
                `\n⚡ Analyzing price action and volume patterns (this can take 2-3 minutes)...\n`
              );

              // Call OpenAI for trend line analysis
              const openaiClient = getOpenAI();
              const analysisResponse =
                await openaiClient.chat.completions.create({
                  model: "gpt-4.1",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a technical analysis expert specializing in identifying trend lines, support, and resistance levels in cryptocurrency markets. Analyze price and volume data to find the most significant trend lines.",
                    },
                    {
                      role: "user",
                      content: trendLinePrompt,
                    },
                  ],
                  response_format: { type: "json_object" },
                });

              const trendAnalysis = JSON.parse(
                analysisResponse.choices[0].message.content || "{}"
              );
              console.log("OpenAI trend analysis:", trendAnalysis);

              // Notify user we're drawing the lines
              if (
                trendAnalysis.trendLines &&
                trendAnalysis.trendLines.length > 0
              ) {
                onStream(
                  `\n📈 Drawing ${trendAnalysis.trendLines.length} trend line${
                    trendAnalysis.trendLines.length > 1 ? "s" : ""
                  } on chart...`
                );
              }

              // Stream the summary to the user
              if (trendAnalysis.summary) {
                onStream("\n\n" + trendAnalysis.summary + "\n");
              }

              // Process each identified trend line
              if (
                trendAnalysis.trendLines &&
                Array.isArray(trendAnalysis.trendLines)
              ) {
                for (const line of trendAnalysis.trendLines) {
                  if (!line.start || !line.end) continue;

                  // Stream explanation for this line
                  if (line.explanation) {
                    onStream(
                      `\n${line.type === "resistance" ? "🔴" : "🟢"} ${
                        line.type.charAt(0).toUpperCase() + line.type.slice(1)
                      } line: ${line.explanation}`
                    );
                  }

                  // Determine color: use user-specified color if provided, otherwise use type-based defaults
                  const color =
                    args.color ||
                    (line.type === "resistance"
                      ? "#ff5252" // Red for resistance
                      : "#4caf50"); // Green for support

                  // Generate name based on confidence and type
                  const confidenceLevel = line.confidence || "medium";
                  const lineType =
                    line.type === "resistance" ? "resistance" : "support";
                  const name = `${confidenceLevel} confidence ${lineType}`;

                  const trendLineArgs = {
                    start: {
                      timestamp: line.start.timestamp,
                      price: line.start.price,
                    },
                    end: {
                      timestamp: line.end.timestamp,
                      price: line.end.price,
                    },
                    color: color,
                    lineWidth: args.lineWidth || 2,
                    style:
                      args.style || line.confidence === "high"
                        ? "solid"
                        : line.CONTEXT === "medium"
                        ? "dashed"
                        : "dotted",
                    extendLeft: args.extendLeft || false,
                    extendRight: args.extendRight || true, // Default to extending right
                    name: name,
                    description: line.explanation || undefined, // Use the explanation as description
                  };

                  // Create the add_trend_line command
                  const trendLineToolCall = {
                    ...toolCall,
                    function: {
                      name: "add_trend_line",
                      arguments: JSON.stringify(trendLineArgs),
                    },
                  };

                  // Write trend line command to Firestore
                  await onToolCall(trendLineToolCall);

                  console.log(
                    `Added ${line.type} trend line from ${new Date(
                      line.start.timestamp
                    ).toISOString()} to ${new Date(
                      line.end.timestamp
                    ).toISOString()}`
                  );
                }

                // Confirm to user
                const lineCount = trendAnalysis.trendLines.length;
                onStream(
                  `\n\n✓ Drew ${lineCount} trend line${
                    lineCount > 1 ? "s" : ""
                  } on the chart.`
                );
              } else {
                onStream(
                  "\n\nNo significant trend lines identified in the current data."
                );
              }
            } catch (error: any) {
              console.error("Error in combined trend line tool:", error);
              onStream(`\n\nFailed to draw trend line: ${error.message}`);
              assistantMessage += `\n\nFailed to draw trend line: ${error.message}`;
            }
          } else {
            // Regular chart commands are written to Firestore for execution
            await onToolCall(toolCall);

            // Send confirmation message
            const confirmationMessage = chartTools.getConfirmationMessage(
              toolCall.function.name,
              args
            );
            onStream("\n\n" + confirmationMessage);
            assistantMessage += "\n\n" + confirmationMessage;
          }
        } else if (priceTools.isPriceTool(toolCall.function.name)) {
          // Special handling for pattern analysis with chart animations
          if (toolCall.function.name === "analyze_candlestick_patterns") {
            console.log(
              "Starting candlestick pattern analysis with animations..."
            );

            // Start pulse wave animation on the chart
            const pulseWaveCommand = {
              function: {
                name: "pulse_wave",
                arguments: JSON.stringify({
                  speed: 15,
                  color: "#60a5fa", // Blue color for scanning
                  numCandles: 25,
                }),
              },
            };
            await onToolCall(pulseWaveCommand);
            onStream("\n\n🔍 Scanning chart for candlestick patterns...");

            // Execute the pattern detection
            const result = await priceTools.execute(
              toolCall.function.name,
              args,
              db
            );

            console.log(`Pattern detection result:`, result);

            // Stop the pulse wave animation
            const stopPulseCommand = {
              function: {
                name: "stop_pulse_wave",
                arguments: JSON.stringify({}),
              },
            };
            await onToolCall(stopPulseCommand);

            // Transform detected patterns for chart highlighting
            if (result.patterns && result.patterns.length > 0) {
              const patternHighlights = result.patterns.map(
                (pattern: any, index: number) => {
                  // Determine color based on pattern type
                  let color = "#60a5fa"; // Default blue
                  const patternType = pattern.type.toLowerCase();

                  // Bullish patterns - bright green (lighter for better visibility)
                  if (
                    patternType.includes("bullish") ||
                    patternType.includes("hammer") ||
                    patternType.includes("morning")
                  ) {
                    color = "#86efac"; // Lighter green
                  }
                  // Bearish patterns - bright red (lighter for better visibility)
                  else if (
                    patternType.includes("bearish") ||
                    patternType.includes("shooting") ||
                    patternType.includes("evening")
                  ) {
                    color = "#fca5a5"; // Lighter red
                  }
                  // Neutral/indecision patterns - bright yellow (lighter for better visibility)
                  else if (
                    patternType.includes("doji") ||
                    patternType.includes("spinning") ||
                    patternType.includes("inside")
                  ) {
                    color = "#fde047"; // Lighter yellow
                  }

                  // Use the name field from the pattern if available, otherwise format from type
                  const displayName =
                    pattern.name ||
                    pattern.type
                      .split("_")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ");

                  return {
                    id: `pattern_${index}_${Date.now()}`,
                    type: "pattern",
                    patternType: pattern.type,
                    name: displayName,
                    description:
                      pattern.description ||
                      `${displayName} pattern${
                        pattern.nearLevel
                          ? ` near ${
                              pattern.nearLevel.type
                            } at $${pattern.nearLevel.price.toFixed(2)}`
                          : ""
                      }`,
                    candleTimestamps: pattern.candleTimestamps || [
                      pattern.timestamp,
                    ],
                    significance: pattern.significance || "medium",
                    color: color,
                    opacity: 0.9, // High opacity for better visibility
                    style: "both", // Always use both fill and outline for maximum distinction
                    nearLevel: pattern.nearLevel,
                  };
                }
              );

              // Send highlight patterns command to the chart
              const highlightCommand = {
                function: {
                  name: "highlight_patterns",
                  arguments: JSON.stringify({
                    patterns: patternHighlights,
                  }),
                },
              };
              await onToolCall(highlightCommand);

              onStream(
                `\n\n✨ Highlighted ${patternHighlights.length} pattern${
                  patternHighlights.length !== 1 ? "s" : ""
                } on the chart.\n`
              );
            }

            // Send formatted result summary
            const summary = priceTools.formatResult(
              toolCall.function.name,
              result
            );
            onStream("\n" + summary);
            assistantMessage += "\n\n" + summary;
          } else {
            // Standard price tool execution
            console.log(`Executing price tool: ${toolCall.function.name}`);
            const result = await priceTools.execute(
              toolCall.function.name,
              args,
              db
            );

            console.log(`Price tool result:`, result);

            // Check if this is a divergence detection tool and auto-visualize if divergences found
            const isDivergenceTool = [
              "detect_divergence",
              "detect_rsi_divergence",
              "detect_macd_divergence",
              "detect_volume_divergence",
            ].includes(toolCall.function.name);

            // Check if this is MACD crossover detection tool
            const isMACDCrossoverTool =
              toolCall.function.name === "detect_macd_crossover";

            if (
              isDivergenceTool &&
              result.divergences &&
              result.divergences.length > 0
            ) {
              console.log(
                `Auto-visualizing ${result.divergences.length} divergences...`
              );

              // Create visualize_divergences command
              const visualizeCommand = {
                function: {
                  name: "visualize_divergences",
                  arguments: JSON.stringify({
                    divergences: result.divergences,
                    drawOnPrice: true,
                    drawOnIndicator: true,
                    showLabels: true,
                    bullishColor: "#10b981",
                    bearishColor: "#ef4444",
                  }),
                },
              };

              // Execute the visualization command
              await onToolCall(visualizeCommand);

              // Add a subtle confirmation that divergences were visualized
              onStream("\n\n📊 Divergences have been drawn on the chart.\n");
              assistantMessage +=
                "\n\n📊 Divergences have been drawn on the chart.\n";
            }

            // Auto-highlight MACD crossovers if found
            if (
              isMACDCrossoverTool &&
              result.crossovers &&
              result.crossovers.length > 0
            ) {
              console.log(
                `Auto-highlighting ${result.crossovers.length} MACD crossovers...`
              );

              // Convert MACD crossovers to pattern highlights
              const crossoverHighlights = result.crossovers.map(
                (crossover: any, index: number) => {
                  // Determine color based on crossover type
                  let color = "#6b7280"; // Default gray
                  let patternType = "macd_crossover";
                  let displayName = "MACD Crossover";

                  if (
                    crossover.type === "bullish" ||
                    crossover.type === "bullish_zero"
                  ) {
                    color = "#10b981"; // Green for bullish
                    patternType =
                      crossover.type === "bullish"
                        ? "macd_bullish_crossover"
                        : "macd_bullish_zero_crossover";
                    displayName =
                      crossover.type === "bullish"
                        ? "Bullish MACD Crossover"
                        : "Bullish Zero-Line Crossover";
                  } else if (
                    crossover.type === "bearish" ||
                    crossover.type === "bearish_zero"
                  ) {
                    color = "#ef4444"; // Red for bearish
                    patternType =
                      crossover.type === "bearish"
                        ? "macd_bearish_crossover"
                        : "macd_bearish_zero_crossover";
                    displayName =
                      crossover.type === "bearish"
                        ? "Bearish MACD Crossover"
                        : "Bearish Zero-Line Crossover";
                  }

                  // Determine significance based on confidence
                  let significance = "medium";
                  if (crossover.confidence >= 85) {
                    significance = "very high";
                  } else if (crossover.confidence >= 75) {
                    significance = "high";
                  } else if (crossover.confidence < 50) {
                    significance = "low";
                  }

                  // Determine style based on confidence
                  const style = crossover.confidence >= 75 ? "both" : "outline";

                  return {
                    id: `macd_crossover_${index}_${Date.now()}`,
                    type: "pattern",
                    patternType: patternType,
                    name: displayName,
                    description:
                      crossover.description ||
                      `${displayName} - MACD: ${crossover.macdValue.toFixed(
                        2
                      )}, Signal: ${crossover.signalValue.toFixed(
                        2
                      )} at $${crossover.price.toFixed(2)}`,
                    candleTimestamps: [crossover.timestamp],
                    significance: significance,
                    color: color,
                    style: style,
                    // Include additional metadata for reference
                    metadata: {
                      macdValue: crossover.macdValue,
                      signalValue: crossover.signalValue,
                      histogramValue: crossover.histogramValue,
                      strength: crossover.strength,
                      confidence: crossover.confidence,
                    },
                  };
                }
              );

              // Send highlight patterns command to the chart
              const highlightCommand = {
                function: {
                  name: "highlight_patterns",
                  arguments: JSON.stringify({
                    patterns: crossoverHighlights,
                  }),
                },
              };
              await onToolCall(highlightCommand);

              onStream(
                `\n\n✨ Highlighted ${
                  crossoverHighlights.length
                } MACD crossover${
                  crossoverHighlights.length !== 1 ? "s" : ""
                } on the chart.\n`
              );
              assistantMessage += `\n\n✨ Highlighted ${
                crossoverHighlights.length
              } MACD crossover${
                crossoverHighlights.length !== 1 ? "s" : ""
              } on the chart.\n`;
            }

            // Send result summary
            const summary = priceTools.formatResult(
              toolCall.function.name,
              result
            );
            onStream("\n\n" + summary);
            assistantMessage += "\n\n" + summary;
          }
        }
      } catch (error: any) {
        console.error(
          `Error processing tool call ${toolCall.function.name}:`,
          error
        );
        onStream(
          `\n\nFailed to execute ${toolCall.function.name}: ${error.message}`
        );
      }
    } else {
      console.log("Incomplete tool call:", toolCall);
    }
  }

  // Record usage if we have the data
  if (usageData) {
    try {
      const usageService = createUsageService(db);
      await usageService.recordUsage({
        sessionId,
        userId,
        subscriptionId: subscriptionId || null,
        promptTokens: usageData.prompt_tokens || 0,
        completionTokens: usageData.completion_tokens || 0,
        totalTokens: usageData.total_tokens || 0,
        model: "gpt-4.1",
        isPreview: isPreview || false,
      });
      console.log(
        `Recorded usage for session ${sessionId}: ${usageData.total_tokens} tokens`
      );
    } catch (error) {
      console.error("Error recording usage:", error);
      // Don't throw - usage tracking shouldn't break the chat
    }
  } else {
    console.warn("No usage data received from OpenAI API");
  }

  return assistantMessage;
}
