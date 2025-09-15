import OpenAI from "openai";
import { Firestore } from "firebase-admin/firestore";
import { chartTools } from "./chart-tools.js";
import { priceTools } from "./price-tools.js";

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
  chartContext?: any;
  db: Firestore;
  onStream: (chunk: string) => void;
  onToolCall: (toolCall: any) => Promise<void>;
}

export async function processChat({
  message,
  userId,
  sessionId,
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
    )} to $${chartContext.priceRange.max.toFixed(2)}

    IMPORTANT - When using ANY price data tools (get_price_data, analyze_price_points):
    - symbol: "${chartContext.symbol}"
    - interval: "${chartContext.granularity}"
    - startTime: ${chartContext.timeRange.start}
    - endTime: ${chartContext.timeRange.end}

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
      content: message,
    },
  ];

  // Create streaming chat completion
  const client = getOpenAI();
  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools,
    tool_choice: "auto",
    stream: true,
    temperature: 0.3,
    max_tokens: 2000,
  });

  let functionCalls: any[] = [];
  let assistantMessage = "";

  // Process stream
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

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
          // Special handling for API-based support/resistance levels
          if (toolCall.function.name === "fetch_support_resistance_levels") {
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
                const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
                const day = date.getUTCDate();
                const hours = date.getUTCHours().toString().padStart(2, '0');
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
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
                `Using exact UTC timestamps - Start: ${args.startTime} (${new Date(args.startTime).toISOString()}), ` +
                `End: ${args.endTime} (${new Date(args.endTime).toISOString()})`
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
                  `\n📊 Support/Resistance Analysis Summary:\n\n` +
                  `---\n\n`
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
                if (confidence >= 80) return 'VERY HIGH';
                if (confidence >= 60) return 'HIGH';
                if (confidence >= 40) return 'MEDIUM';
                return 'LOW';
              };

              const getRelativeTime = (timestamp: number | string): string => {
                const now = new Date();
                const date = new Date(timestamp);
                const diffMs = now.getTime() - date.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays === 0) return 'Today';
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
                return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
              };

              const generateLevelNote = (level: any, type: 'support' | 'resistance'): string => {
                const notes = [];

                if (level.type === 'swing') {
                  notes.push('Major reversal point');
                } else {
                  notes.push('Consolidation zone');
                }

                if (level.tests >= 4) {
                  notes.push(`strong ${type === 'support' ? 'buyer' : 'seller'} interest`);
                } else if (level.tests >= 2) {
                  notes.push(`moderate ${type === 'support' ? 'buying' : 'selling'} pressure`);
                }

                if (level.adjustedConfidence && level.adjustedConfidence > level.confidence) {
                  notes.push('indicators confirm strength');
                }

                return notes.join(', ');
              };

              // Define color schemes for different level types
              const colors = {
                swing: {
                  support: '#00FF00',     // Bright green (full saturation)
                  resistance: '#FF0000'   // Bright red (full saturation)
                },
                horizontal: {
                  support: '#66CC66',     // Soft green (60% saturation)
                  resistance: '#CC6666'   // Soft red (60% saturation)
                }
              };

              // Output support levels header if we have supports
              if (levelsData.supports.length > 0) {
                onStream(`\n🟢 SUPPORT LEVELS (${levelsData.supports.length} found):\n\n`);
              }

              // Draw horizontal lines for each support level
              for (let index = 0; index < levelsData.supports.length; index++) {
                const support = levelsData.supports[index];
                const levelType: 'swing' | 'horizontal' = support.type || 'horizontal';
                const adjustedConfidence = support.adjustedConfidence || support.confidence;

                // Determine line style based on adjusted confidence
                let lineStyle = "solid";
                if (adjustedConfidence < 50) {
                  lineStyle = "dotted";
                } else if (adjustedConfidence < 70) {
                  lineStyle = "dashed";
                }

                // Create a horizontal line at the support price
                const supportLineArgs = {
                  start: {
                    timestamp: args.startTime,
                    price: support.price,
                  },
                  end: {
                    timestamp: args.endTime,
                    price: support.price,
                  },

                  // Enhanced visual properties based on level type
                  color: colors[levelType].support,
                  lineWidth: levelType === 'swing' ? 3 : 1.5,
                  style: lineStyle,
                  opacity: 0.5 + (adjustedConfidence / 100) * 0.5,

                  // New properties for advanced visualization
                  levelType: levelType,
                  zIndex: levelType === 'swing' ? 100 : 90,
                  markers: levelType === 'swing' ? {
                    enabled: true,
                    symbol: 'diamond' as const,
                    size: 4,
                    spacing: 100,
                    color: colors[levelType].support
                  } : undefined,

                  // Existing properties
                  extendLeft: true,
                  extendRight: true,
                  name: `${levelType === 'swing' ? '◆' : '—'} ${granularityLabel}: Support $${support.price.toFixed(
                    2
                  )}`,
                  description: support.description || `Confidence: ${adjustedConfidence.toFixed(
                    0
                  )}%${
                    adjustedConfidence !== support.confidence
                      ? ` (adjusted from ${support.confidence.toFixed(0)}% by indicators)`
                      : ''
                  } | Tests: ${support.tests}`,
                  // Add lastTest field for browser to convert to local timezone
                  lastTest: support.lastTest || undefined,
                };

                // Create the add_trend_line command
                const supportLineToolCall = {
                  ...toolCall,
                  function: {
                    name: "add_trend_line",
                    arguments: JSON.stringify(supportLineArgs),
                  },
                };

                // Write trend line command to Firestore
                await onToolCall(supportLineToolCall);

                // Output detailed information for this support level
                onStream(
                  `\n**${index + 1}. ${levelType === 'swing' ? '◆ Strong Swing' : '— Horizontal'} Support at $${support.price.toFixed(2)}**\n` +
                  `- **Type:** ${levelType === 'swing' ? 'Swing Level (Precise Reversal Point)' : 'Horizontal Level (Consolidation Zone)'}\n` +
                  `- **Confidence:** ${adjustedConfidence.toFixed(0)}%${
                    adjustedConfidence !== support.confidence
                      ? ` (adjusted from ${support.confidence.toFixed(0)}% by indicators)`
                      : ''
                  }\n` +
                  `- **Strength:** ${getStrengthLabel(adjustedConfidence)} - Tested ${support.tests} time${support.tests !== 1 ? 's' : ''}\n` +
                  `- **Last Test:** ${getRelativeTime(support.lastTest)} <span class="timestamp-utc" data-timestamp="${support.lastTest}">(loading time...)</span>\n` +
                  `- **Visual:** ${lineStyle === 'solid' ? 'Solid' : lineStyle === 'dashed' ? 'Dashed' : 'Dotted'} line${
                    levelType === 'swing' ? ' with diamond markers' : ', no markers'
                  }\n` +
                  `- **Note:** ${generateLevelNote(support, 'support')}\n\n`
                );
              }

              // Output resistance levels header if we have resistances
              if (levelsData.resistances.length > 0) {
                onStream(`\n🔴 RESISTANCE LEVELS (${levelsData.resistances.length} found):\n\n`);
              }

              // Draw horizontal lines for each resistance level
              for (let index = 0; index < levelsData.resistances.length; index++) {
                const resistance = levelsData.resistances[index];
                const levelType: 'swing' | 'horizontal' = resistance.type || 'horizontal';
                const adjustedConfidence = resistance.adjustedConfidence || resistance.confidence;

                // Determine line style based on adjusted confidence
                let lineStyle = "solid";
                if (adjustedConfidence < 50) {
                  lineStyle = "dotted";
                } else if (adjustedConfidence < 70) {
                  lineStyle = "dashed";
                }

                // Create a horizontal line at the resistance price
                const resistanceLineArgs = {
                  start: {
                    timestamp: args.startTime,
                    price: resistance.price,
                  },
                  end: {
                    timestamp: args.endTime,
                    price: resistance.price,
                  },

                  // Enhanced visual properties based on level type
                  color: colors[levelType].resistance,
                  lineWidth: levelType === 'swing' ? 3 : 1.5,
                  style: lineStyle,
                  opacity: 0.5 + (adjustedConfidence / 100) * 0.5,

                  // New properties for advanced visualization
                  levelType: levelType,
                  zIndex: levelType === 'swing' ? 100 : 90,
                  markers: levelType === 'swing' ? {
                    enabled: true,
                    symbol: 'diamond' as const,
                    size: 4,
                    spacing: 100,
                    color: colors[levelType].resistance
                  } : undefined,

                  // Existing properties
                  extendLeft: true,
                  extendRight: true,
                  name: `${levelType === 'swing' ? '◆' : '—'} ${granularityLabel}: Resistance $${resistance.price.toFixed(
                    2
                  )}`,
                  description: resistance.description || `Confidence: ${adjustedConfidence.toFixed(
                    0
                  )}%${
                    adjustedConfidence !== resistance.confidence
                      ? ` (adjusted from ${resistance.confidence.toFixed(0)}% by indicators)`
                      : ''
                  } | Tests: ${resistance.tests}`,
                  // Add lastTest field for browser to convert to local timezone
                  lastTest: resistance.lastTest || undefined,
                };

                // Create the add_trend_line command
                const resistanceLineToolCall = {
                  ...toolCall,
                  function: {
                    name: "add_trend_line",
                    arguments: JSON.stringify(resistanceLineArgs),
                  },
                };

                // Write trend line command to Firestore
                await onToolCall(resistanceLineToolCall);

                // Output detailed information for this resistance level
                onStream(
                  `\n**${index + 1}. ${levelType === 'swing' ? '◆ Strong Swing' : '— Horizontal'} Resistance at $${resistance.price.toFixed(2)}**\n` +
                  `- **Type:** ${levelType === 'swing' ? 'Swing Level (Precise Reversal Point)' : 'Horizontal Level (Consolidation Zone)'}\n` +
                  `- **Confidence:** ${adjustedConfidence.toFixed(0)}%${
                    adjustedConfidence !== resistance.confidence
                      ? ` (adjusted from ${resistance.confidence.toFixed(0)}% by indicators)`
                      : ''
                  }\n` +
                  `- **Strength:** ${getStrengthLabel(adjustedConfidence)} - Tested ${resistance.tests} time${resistance.tests !== 1 ? 's' : ''}\n` +
                  `- **Last Test:** ${getRelativeTime(resistance.lastTest)} <span class="timestamp-utc" data-timestamp="${resistance.lastTest}">(loading time...)</span>\n` +
                  `- **Visual:** ${lineStyle === 'solid' ? 'Solid' : lineStyle === 'dashed' ? 'Dashed' : 'Dotted'} line${
                    levelType === 'swing' ? ' with diamond markers' : ', no markers'
                  }\n` +
                  `- **Note:** ${generateLevelNote(resistance, 'resistance')}\n\n`
                );
              }

              // Add comprehensive summary at the end
              const totalLines = levelsData.supports.length + levelsData.resistances.length;

              if (totalLines > 0) {
                // Find strongest levels
                const strongestSupport = levelsData.supports.length > 0
                  ? levelsData.supports.reduce((max: any, s: any) =>
                      (s.adjustedConfidence || s.confidence || 0) > (max.adjustedConfidence || max.confidence || 0) ? s : max
                    , levelsData.supports[0])
                  : null;

                const strongestResistance = levelsData.resistances.length > 0
                  ? levelsData.resistances.reduce((max: any, r: any) =>
                      (r.adjustedConfidence || r.confidence || 0) > (max.adjustedConfidence || max.confidence || 0) ? r : max
                    , levelsData.resistances[0])
                  : null;

                const swingLevelsCount = [...levelsData.supports, ...levelsData.resistances].filter((l: any) => l.type === 'swing').length;
                const horizontalLevelsCount = [...levelsData.supports, ...levelsData.resistances].filter((l: any) => l.type === 'horizontal').length;

                onStream(
                  `\n## 📈 **Analysis Summary**\n\n` +
                  `---\n\n` +
                  `**Total Levels Identified:** ${totalLines}\n` +
                  `• Support Levels: ${levelsData.supports.length}\n` +
                  `• Resistance Levels: ${levelsData.resistances.length}\n\n` +
                  `**Level Types:**\n` +
                  `• Swing Levels (Precise Reversals): ${swingLevelsCount}\n` +
                  `• Horizontal Levels (Consolidation Zones): ${horizontalLevelsCount}\n\n` +
                  `**Key Levels to Watch:**\n` +
                  (strongestSupport ?
                    `• Strongest Support: $${strongestSupport.price.toFixed(2)} ` +
                    `(${(strongestSupport.adjustedConfidence || strongestSupport.confidence || 0).toFixed(0)}% confidence, ` +
                    `${strongestSupport.tests || 1} test${(strongestSupport.tests || 1) > 1 ? 's' : ''})\n` : '') +
                  (strongestResistance ?
                    `• Strongest Resistance: $${strongestResistance.price.toFixed(2)} ` +
                    `(${(strongestResistance.adjustedConfidence || strongestResistance.confidence || 0).toFixed(0)}% confidence, ` +
                    `${strongestResistance.tests || 1} test${(strongestResistance.tests || 1) > 1 ? 's' : ''})\n` : '') +
                  `\n**Visual Guide:**\n` +
                  `• 🟢 Green lines = Support levels (price floor)\n` +
                  `• 🔴 Red lines = Resistance levels (price ceiling)\n` +
                  `• Thicker lines = Swing levels (strong reversal points)\n` +
                  `• Thinner lines = Horizontal levels (consolidation areas)\n` +
                  `• Line style indicates confidence: Solid (>70%), Dashed (40-70%), Dotted (<40%)\n\n` +
                  `💡 **Trading Tip:** Pay special attention to levels with high confidence and multiple tests, ` +
                  `as these tend to be more reliable for planning entry/exit points.\n\n` +
                  `✅ Successfully drew ${totalLines} support and resistance level${totalLines > 1 ? 's' : ''} on the chart.\n`
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
                  model: "gpt-5",
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
          // Price data tools are executed immediately
          console.log(`Executing price tool: ${toolCall.function.name}`);
          const result = await priceTools.execute(
            toolCall.function.name,
            args,
            db
          );

          console.log(`Price tool result:`, result);

          // Send result summary
          const summary = priceTools.formatResult(
            toolCall.function.name,
            result
          );
          onStream("\n\n" + summary);
          assistantMessage += "\n\n" + summary;
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

  return assistantMessage;
}
