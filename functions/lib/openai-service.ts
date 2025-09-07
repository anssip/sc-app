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
  // Get recent chat history for context
  const historySnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("chat_history")
    .where("sessionId", "==", sessionId)
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  const history = historySnapshot.docs.reverse().map((doc) => ({
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

    TREND LINE WORKFLOW - USE COMBINED TOOL:
    When user asks for trend lines (resistance, support, or any trend line):
    1. Use "draw_trend_line_from_analysis" - this does BOTH analysis and drawing in one call
    2. For resistance lines: use type: "resistance"
    3. For support lines: use type: "support"
    4. This tool automatically finds price points AND draws the line
    5. NEVER use separate analyze_price_points + add_trend_line calls for trend lines

    KEYWORDS that trigger trend line workflow (use draw_trend_line_from_analysis):
    - "trend line", "trendline", "resistance", "support", "draw line"
    - "connect highs", "connect lows", "resistance line", "support line"
    - "add trend line", "draw trend line", "show resistance", "show support"
    - "based on price action", "based on highs/lows", "technical analysis"

    COMMON USER REQUESTS that use draw_trend_line_from_analysis:
    - "Add a resistance trend line" → type: "resistance"
    - "Draw support based on recent lows" → type: "support"
    - "Show me a trend line for the past week" → type: "resistance" or "support"
    - "Connect the highs/lows" → type: "resistance" or "support"
    - "Draw a line connecting recent peaks" → type: "resistance"

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
    } to ${chartContext.timeRange.end} (timestamps in milliseconds)
    - Visible Price Range: $${chartContext.priceRange.min.toFixed(
      2
    )} to $${chartContext.priceRange.max.toFixed(2)}

    IMPORTANT - When using ANY price data tools (get_price_data, analyze_price_points):
    - symbol: "${chartContext.symbol}"
    - interval: "${chartContext.granularity}"
    - startTime: ${chartContext.timeRange.start}
    - endTime: ${chartContext.timeRange.end}

    CRITICAL: All timestamps MUST be integers (no decimals). Use Math.floor() if needed.

    Example for analyze_price_points:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "type": "highs",
      "count": 3
    }

    TREND LINE DRAWING PROCESS (USE COMBINED TOOL):
    Use draw_trend_line_from_analysis - this does everything in ONE call

    Example for drawing a resistance trend line:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "type": "resistance",
      "count": 2,
      "color": "#FF0000",
      "extendRight": true
    }

    Example for drawing a support trend line:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${Math.floor(chartContext.timeRange.start)},
      "endTime": ${Math.floor(chartContext.timeRange.end)},
      "type": "support",
      "count": 2,
      "color": "#00FF00",
      "extendRight": true
    }

    ONE TOOL CALL DOES EVERYTHING - analysis + drawing!`;
  }

  systemPrompt += `\n\nWhen the user asks you to perform chart actions, use the appropriate tools.
    When analyzing data, be concise and focus on key insights.
    Always confirm when you've executed commands on the chart.

    CRITICAL REMINDERS:
    - For ANY trend line request: Use draw_trend_line_from_analysis (ONE tool call)
    - Resistance trend lines: type="resistance"
    - Support trend lines: type="support"
    - This tool does analysis AND drawing automatically
    - NEVER use analyze_price_points + add_trend_line for trend lines

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
          // Special handling for combined trend line tool
          if (toolCall.function.name === "draw_trend_line_from_analysis") {
            try {
              console.log("Using OpenAI to analyze trend lines...");

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

              // Prepare candles for OpenAI analysis
              const candles = candleData.candles.map((c: any) => ({
                timestamp: c.timestamp || c.time || c.t,
                open: c.open || c.o,
                high: c.high || c.h,
                low: c.low || c.l,
                close: c.close || c.c,
                volume: c.volume || c.v || 0,
              }));

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

                  // Determine color based on type
                  const color =
                    line.type === "resistance"
                      ? args.color || "#ff5252" // Red for resistance
                      : args.color || "#4caf50"; // Green for support

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
