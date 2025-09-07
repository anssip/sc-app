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
              // First, analyze price points
              const analysisArgs = {
                symbol: args.symbol,
                interval: args.interval,
                startTime: args.startTime,
                endTime: args.endTime,
                type: args.type === "resistance" ? "highs" : "lows",
                count: args.count || 2,
              };

              const analysisResult = await priceTools.execute(
                "analyze_price_points",
                analysisArgs,
                db
              );

              console.log("Analysis result for trend line:", analysisResult);

              // Extract price points
              const points =
                args.type === "resistance"
                  ? analysisResult.highs
                  : analysisResult.lows;

              if (points.length >= 2) {
                // Sort points by timestamp to connect them chronologically
                const sortedPoints = points
                  .slice()
                  .sort((a: any, b: any) => a.timestamp - b.timestamp);

                // For a proper trend line, select points that span a good time range
                // Use first and last chronologically, or if we have many points,
                // use the most extreme ones that are far apart in time
                let startPoint = sortedPoints[0];
                let endPoint = sortedPoints[sortedPoints.length - 1];

                // Calculate minimum time separation based on granularity
                // Common heuristic in technical analysis: trend lines should span enough time
                // to be meaningful. The standard approach is:
                // - Intraday charts (1-30 min): Points should be 30-120 minutes apart
                // - Hourly charts: Points should be at least 1-2 days apart
                // - Daily charts: Points should be at least 10-20 days apart
                // This ensures the trend line captures actual price movement patterns
                // rather than noise or very short-term fluctuations
                const getMinSeparation = (interval: string): number => {
                  const intervalMs =
                    {
                      ONE_MINUTE: 60 * 1000,
                      FIVE_MINUTE: 5 * 60 * 1000,
                      FIFTEEN_MINUTE: 15 * 60 * 1000,
                      THIRTY_MINUTE: 30 * 60 * 1000,
                      ONE_HOUR: 60 * 60 * 1000,
                      TWO_HOUR: 2 * 60 * 60 * 1000,
                      FOUR_HOUR: 4 * 60 * 60 * 1000,
                      SIX_HOUR: 6 * 60 * 60 * 1000,
                      ONE_DAY: 24 * 60 * 60 * 1000,
                    }[interval] || 60 * 60 * 1000;

                  // Minimum separation rules based on granularity
                  // These values represent the minimum number of candles between trend line points
                  // The heuristic follows standard technical analysis practices:
                  // - Shorter timeframes need proportionally more candles for stability
                  // - Longer timeframes can work with fewer candles as each represents more time
                  const minCandles =
                    {
                      ONE_MINUTE: 30, // 30 minutes apart (captures micro-trends)
                      FIVE_MINUTE: 24, // 2 hours apart (filters out noise)
                      FIFTEEN_MINUTE: 16, // 4 hours apart (half trading session)
                      THIRTY_MINUTE: 12, // 6 hours apart (quarter trading day)
                      ONE_HOUR: 24, // 1 day apart (full trading cycle)
                      TWO_HOUR: 24, // 2 days apart (multi-day trend)
                      FOUR_HOUR: 18, // 3 days apart (short-term swing)
                      SIX_HOUR: 16, // 4 days apart (weekly pattern)
                      ONE_DAY: 10, // 10 days apart (2 trading weeks)
                    }[interval] || 24;

                  return intervalMs * minCandles;
                };

                const minRequiredSeparation = getMinSeparation(
                  analysisArgs.interval
                );

                // If we have more than 2 points, try to find better endpoints
                if (sortedPoints.length > 2) {
                  const timeSpan = endPoint.timestamp - startPoint.timestamp;
                  // Use the greater of: minimum required separation or 30% of total span
                  const minTimeSpan = Math.max(
                    minRequiredSeparation,
                    timeSpan * 0.3
                  );

                  // For resistance, we want the highest points that are far apart
                  // For support, we want the lowest points that are far apart
                  if (args.type === "resistance") {
                    // Find two highest points that are far enough apart in time
                    const highestPoints = sortedPoints
                      .slice()
                      .sort((a: any, b: any) => b.price - a.price);
                    for (let i = 0; i < highestPoints.length - 1; i++) {
                      for (let j = i + 1; j < highestPoints.length; j++) {
                        const timeDiff = Math.abs(
                          highestPoints[j].timestamp -
                            highestPoints[i].timestamp
                        );
                        if (timeDiff >= minTimeSpan) {
                          // Order by timestamp for proper line direction
                          if (
                            highestPoints[i].timestamp <
                            highestPoints[j].timestamp
                          ) {
                            startPoint = highestPoints[i];
                            endPoint = highestPoints[j];
                          } else {
                            startPoint = highestPoints[j];
                            endPoint = highestPoints[i];
                          }
                          break;
                        }
                      }
                      if (
                        startPoint !== sortedPoints[0] ||
                        endPoint !== sortedPoints[sortedPoints.length - 1]
                      )
                        break;
                    }
                  } else {
                    // For support, find two lowest points that are far enough apart in time
                    const lowestPoints = sortedPoints
                      .slice()
                      .sort((a: any, b: any) => a.price - b.price);
                    for (let i = 0; i < lowestPoints.length - 1; i++) {
                      for (let j = i + 1; j < lowestPoints.length; j++) {
                        const timeDiff = Math.abs(
                          lowestPoints[j].timestamp - lowestPoints[i].timestamp
                        );
                        if (timeDiff >= minTimeSpan) {
                          // Order by timestamp for proper line direction
                          if (
                            lowestPoints[i].timestamp <
                            lowestPoints[j].timestamp
                          ) {
                            startPoint = lowestPoints[i];
                            endPoint = lowestPoints[j];
                          } else {
                            startPoint = lowestPoints[j];
                            endPoint = lowestPoints[i];
                          }
                          break;
                        }
                      }
                      if (
                        startPoint !== sortedPoints[0] ||
                        endPoint !== sortedPoints[sortedPoints.length - 1]
                      )
                        break;
                    }
                  }
                }

                // Check if selected points meet minimum separation requirement
                const selectedTimeDiff = Math.abs(
                  endPoint.timestamp - startPoint.timestamp
                );
                if (selectedTimeDiff < minRequiredSeparation) {
                  console.warn(
                    `Selected points are too close in time (${selectedTimeDiff}ms < ${minRequiredSeparation}ms required). ` +
                      `Looking for points with better separation...`
                  );

                  // Try to find points with adequate separation
                  let bestStart = sortedPoints[0];
                  let bestEnd = sortedPoints[sortedPoints.length - 1];
                  let maxSeparation = 0;

                  for (let i = 0; i < sortedPoints.length - 1; i++) {
                    for (let j = i + 1; j < sortedPoints.length; j++) {
                      const separation =
                        sortedPoints[j].timestamp - sortedPoints[i].timestamp;
                      if (
                        separation >= minRequiredSeparation &&
                        separation > maxSeparation
                      ) {
                        maxSeparation = separation;
                        bestStart = sortedPoints[i];
                        bestEnd = sortedPoints[j];
                      }
                    }
                  }

                  if (maxSeparation >= minRequiredSeparation) {
                    startPoint = bestStart;
                    endPoint = bestEnd;
                    console.log(
                      `Found points with adequate separation: ${maxSeparation}ms`
                    );
                  } else {
                    console.warn(
                      `Could not find points with minimum separation (${minRequiredSeparation}ms). ` +
                        `Using best available with ${maxSeparation}ms separation.`
                    );
                    startPoint = bestStart;
                    endPoint = bestEnd;
                  }
                }

                // Ensure we have valid start and end points
                if (
                  !startPoint ||
                  !endPoint ||
                  startPoint.timestamp === endPoint.timestamp
                ) {
                  console.warn(
                    "Invalid points selected, falling back to first and last chronologically"
                  );
                  startPoint = sortedPoints[0];
                  endPoint = sortedPoints[sortedPoints.length - 1];
                }

                console.log(
                  `Analysis found ${points.length} ${args.type} points:`
                );
                points.forEach((point: any, index: number) => {
                  console.log(
                    `  ${index + 1}. ${new Date(
                      point.timestamp
                    ).toISOString()} - $${point.price.toFixed(2)}`
                  );
                });

                console.log(
                  `Selected trend line points: Start(${new Date(
                    startPoint.timestamp
                  ).toISOString()}, $${startPoint.price.toFixed(
                    2
                  )}) -> End(${new Date(
                    endPoint.timestamp
                  ).toISOString()}, $${endPoint.price.toFixed(2)})`
                );

                const trendLineArgs = {
                  start: {
                    timestamp: startPoint.timestamp,
                    price: startPoint.price,
                  },
                  end: {
                    timestamp: endPoint.timestamp,
                    price: endPoint.price,
                  },
                  color: args.color || "#2962ff",
                  lineWidth: args.lineWidth || 2,
                  style: args.style || "solid",
                  extendLeft: args.extendLeft || false,
                  extendRight: args.extendRight || false,
                };

                // Create the actual add_trend_line command for Firestore
                const trendLineToolCall = {
                  ...toolCall,
                  function: {
                    name: "add_trend_line",
                    arguments: JSON.stringify(trendLineArgs),
                  },
                };

                // Write trend line command to Firestore
                await onToolCall(trendLineToolCall);

                // Send success message
                const analysisMessage = priceTools.formatResult(
                  "analyze_price_points",
                  analysisResult
                );

                // Calculate time separation for user info
                const timeDiff = endPoint.timestamp - startPoint.timestamp;
                const daysDiff = Math.round(timeDiff / (24 * 60 * 60 * 1000));
                const hoursDiff = Math.round(timeDiff / (60 * 60 * 1000));
                const separationText =
                  daysDiff > 0 ? `${daysDiff} days` : `${hoursDiff} hours`;

                const trendMessage = `✓ Drew ${
                  args.type
                } trend line (${separationText} span) connecting:\n  • ${new Date(
                  startPoint.timestamp
                ).toLocaleDateString()} at $${startPoint.price.toFixed(
                  2
                )}\n  • ${new Date(
                  endPoint.timestamp
                ).toLocaleDateString()} at $${endPoint.price.toFixed(2)}`;
                onStream("\n\n" + analysisMessage + "\n" + trendMessage);
                assistantMessage +=
                  "\n\n" + analysisMessage + "\n" + trendMessage;
              } else {
                onStream(
                  `\n\nCould not find enough ${args.type} points (found ${points.length}, need at least 2) to draw trend line`
                );
                assistantMessage += `\n\nCould not find enough ${args.type} points to draw trend line`;
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
