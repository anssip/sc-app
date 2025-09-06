import OpenAI from "openai";
import { Firestore } from "firebase-admin/firestore";
import { chartTools } from "./chart-tools.js";
import { firestoreTools } from "./firestore-tools.js";
import { WorkflowEngine, initializeWorkflows } from "./workflows/index.js";

// Initialize workflows on module load
initializeWorkflows();

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
const tools: any[] = [...chartTools.definitions, ...firestoreTools.definitions];

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
    // Analyze intent to determine if workflow is needed
    const intent = WorkflowEngine.analyzeIntent(message, chartContext);

    if (intent.requiresWorkflow && intent.workflowType) {
      // Handle with workflow
      return await processWithWorkflow({
        intent,
        message,
        userId,
        sessionId,
        chartContext,
        db,
        onStream,
        onToolCall,
      });
    } else {
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
    }
  } catch (error) {
    console.error("Chat processing error:", error);
    throw error;
  }
}

async function processWithWorkflow({
  intent,
  message,
  userId,
  sessionId,
  chartContext,
  db,
  onStream,
  onToolCall,
}: ProcessChatOptions & { intent: any }): Promise<string> {
  try {
    const workflow = WorkflowEngine.getWorkflow(intent.workflowType);
    if (!workflow) {
      // Fallback to LLM if workflow not found
      return await processWithLLM({
        message,
        userId,
        sessionId,
        chartContext,
        db,
        onStream,
        onToolCall,
      });
    }

    // Use OpenAI to extract workflow parameters from the message
    console.log("Extracting parameters from message:", message);
    const extractedParams = await extractWorkflowParameters(
      message,
      intent.workflowType,
      chartContext
    );
    console.log(
      "Extracted parameters:",
      JSON.stringify(extractedParams, null, 2)
    );

    // Prepare input based on workflow type and extracted parameters
    const workflowInput = prepareWorkflowInput(
      intent.workflowType,
      { ...intent.parameters, ...extractedParams },
      chartContext
    );
    console.log(
      "Final workflow input:",
      JSON.stringify(workflowInput, null, 2)
    );

    // Execute workflow with progress callback
    const result = await WorkflowEngine.executeWorkflow(
      intent.workflowType,
      workflowInput,
      (message: string) => onStream(message + "\n")
    );

    // Convert workflow result to tool calls
    const toolCalls = WorkflowEngine.convertToToolCalls(
      result,
      intent.workflowType
    );

    // Execute tool calls
    for (const toolCall of toolCalls) {
      await onToolCall(toolCall);
    }

    // Get confirmation message
    const confirmationMessage = WorkflowEngine.getConfirmationMessage(
      intent.workflowType,
      result
    );
    onStream(confirmationMessage);

    return confirmationMessage;
  } catch (error: any) {
    console.error("Workflow execution error:", error);
    onStream(`\n\n⚠️ Error: ${error.message}`);

    // Fallback to LLM
    return await processWithLLM({
      message: `${message} (Note: automated analysis failed, please provide manual assistance)`,
      userId,
      sessionId,
      chartContext,
      db,
      onStream,
      onToolCall,
    });
  }
}

async function extractWorkflowParameters(
  message: string,
  workflowType: string,
  chartContext: any
): Promise<any> {
  try {
    const client = getOpenAI();

    // Create a specialized prompt for extracting parameters
    // Using 2025 date to match the mock data in the market API
    const currentDate = new Date("2025-09-06T12:00:00Z");
    const systemPrompt = `You are a parameter extraction assistant. Extract specific parameters from the user's message for the ${workflowType}.

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
Current chart context:
- Symbol: ${chartContext?.symbol || "BTC-USD"}
- Interval: ${chartContext?.granularity || "ONE_HOUR"}
- Current visible time range: ${
      chartContext?.timeRange
        ? `${new Date(
            chartContext.timeRange.start
          ).toISOString()} to ${new Date(
            chartContext.timeRange.end
          ).toISOString()}`
        : "unknown"
    }

Extract the following parameters:
1. Time range: If the user mentions a specific time period:
   - "four months" or "past four months" = start: ${
     currentDate.getTime() - 120 * 24 * 60 * 60 * 1000
   } (${new Date(
      currentDate.getTime() - 120 * 24 * 60 * 60 * 1000
    ).toISOString()}), end: ${currentDate.getTime()} (${currentDate.toISOString()})
   - "six months" = start: ${
     currentDate.getTime() - 180 * 24 * 60 * 60 * 1000
   } (${new Date(
      currentDate.getTime() - 180 * 24 * 60 * 60 * 1000
    ).toISOString()}), end: ${currentDate.getTime()} (${currentDate.toISOString()})
   - "one year" = start: ${
     currentDate.getTime() - 365 * 24 * 60 * 60 * 1000
   } (${new Date(
      currentDate.getTime() - 365 * 24 * 60 * 60 * 1000
    ).toISOString()}), end: ${currentDate.getTime()} (${currentDate.toISOString()})
   - Always use TODAY as the END timestamp: ${currentDate.getTime()}
   - Calculate the START by subtracting the period from TODAY

2. Interval/granularity: Map these EXACTLY:
   - "one day candles" or "daily" or "day candles" → "ONE_DAY"
   - "hourly" or "one hour" → "ONE_HOUR"
   - "4-hour" or "four hour" → "FOUR_HOUR"
   - If no interval is specified but a time range is mentioned, suggest an appropriate interval:
     - For 1 year or more: use ONE_DAY
     - For 3-12 months: use SIX_HOUR or ONE_DAY
     - For 1-3 months: use FOUR_HOUR or SIX_HOUR
     - For 1-4 weeks: use ONE_HOUR or TWO_HOUR
     - For less than 1 week: use THIRTY_MINUTE or ONE_HOUR
3. Type: For trend lines, determine if it's "resistance" or "support"

Return a JSON object with the parameters extracted or intelligently inferred from the message.
If a time range is mentioned, include:
{
  "timeRange": {
    "start": <timestamp_in_milliseconds>,
    "end": <timestamp_in_milliseconds>
  },
  "interval": "<APPROPRIATE_GRANULARITY_FOR_TIME_RANGE>"
}

Valid granularities: ONE_MINUTE, FIVE_MINUTE, FIFTEEN_MINUTE, THIRTY_MINUTE, ONE_HOUR, TWO_HOUR, FOUR_HOUR, SIX_HOUR, ONE_DAY

Only return valid JSON, nothing else.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || "{}";
    console.log("OpenAI extraction response:", response);

    try {
      const parsed = JSON.parse(response);
      console.log("Successfully parsed parameters:", parsed);
      return parsed;
    } catch (e) {
      console.error("Failed to parse extracted parameters:", response);
      return {};
    }
  } catch (error) {
    console.error("Error extracting workflow parameters:", error);
    return {};
  }
}

function prepareWorkflowInput(
  workflowType: string,
  parameters: any,
  chartContext: any
): any {
  console.log("prepareWorkflowInput - parameters:", parameters);
  console.log(
    "prepareWorkflowInput - chartContext timeRange:",
    chartContext?.timeRange
  );

  // Use extracted timeRange if provided, otherwise fall back to chart context or default
  let timeRange;
  if (parameters.timeRange) {
    console.log("Using extracted time range from OpenAI");
    timeRange = parameters.timeRange;
  } else if (chartContext?.timeRange) {
    console.log(
      "WARNING: No extracted time range, falling back to chart context"
    );
    timeRange = chartContext.timeRange;
  } else {
    console.log("WARNING: No time range found, using default 7 days");
    timeRange = {
      start: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      end: Date.now(),
    };
  }

  // Use extracted interval if provided, otherwise fall back to chart context or default
  const interval =
    parameters.interval || chartContext?.granularity || "ONE_HOUR";

  console.log("Final timeRange being used:", timeRange);
  console.log("Final interval being used:", interval);

  const baseInput = {
    symbol: chartContext?.symbol || "BTC-USD",
    interval: interval,
    timeRange: timeRange,
  };

  switch (workflowType) {
    case "TrendLineWorkflow":
      return {
        ...baseInput,
        type: parameters?.type || "resistance",
        minPoints: parameters?.minPoints || 3,
        threshold: parameters?.threshold || 0.02,
        maxIterations: parameters?.maxIterations || 1000,
      };

    case "PatternRecognitionWorkflow":
      return {
        ...baseInput,
        patterns: parameters?.patterns || [
          "head_and_shoulders",
          "triangle",
          "flag",
        ],
      };

    case "BacktestingWorkflow":
      return {
        ...baseInput,
        strategy: parameters?.strategy || {
          name: "simple_ma_crossover",
          parameters: { fastPeriod: 10, slowPeriod: 30 },
        },
        initialCapital: parameters?.initialCapital || 10000,
        positionSize: parameters?.positionSize || 0.1,
      };

    default:
      return { ...baseInput, ...parameters };
  }
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

    Valid granularities: ONE_MINUTE, FIVE_MINUTE, FIFTEEN_MINUTE, THIRTY_MINUTE, ONE_HOUR, TWO_HOUR, SIX_HOUR, ONE_DAY
    Valid symbols include: BTC-USD, ETH-USD, SOL-USD, etc.`;

  // Add chart context if available
  if (chartContext) {
    systemPrompt += `\n\nCurrent Chart Context:
    - Symbol: ${chartContext.symbol}
    - Timeframe/Interval: ${chartContext.granularity}
    - Visible Time Range: from ${chartContext.timeRange.start} to ${
      chartContext.timeRange.end
    } (timestamps in milliseconds)
    - Visible Price Range: $${chartContext.priceRange.min.toFixed(
      2
    )} to $${chartContext.priceRange.max.toFixed(2)}

    IMPORTANT - When using ANY price data tools (get_price_data, analyze_price_points):
    - symbol: "${chartContext.symbol}"
    - interval: "${chartContext.granularity}"
    - startTime: ${chartContext.timeRange.start}
    - endTime: ${chartContext.timeRange.end}

    Example for analyze_price_points:
    {
      "symbol": "${chartContext.symbol}",
      "interval": "${chartContext.granularity}",
      "startTime": ${chartContext.timeRange.start},
      "endTime": ${chartContext.timeRange.end},
      "type": "highs",
      "count": 3
    }

    When drawing trend lines:
    1. First call analyze_price_points to find significant highs or lows
    2. Use the returned timestamps and prices for add_trend_line
    3. For resistance: use type: 'highs'
    4. For support: use type: 'lows'`;
  }

  systemPrompt += `\n\nWhen the user asks you to perform chart actions, use the appropriate tools.
    When analyzing data, be concise and focus on key insights.
    Always confirm when you've executed commands on the chart.`;

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
    model: "gpt-4-turbo-preview",
    messages,
    tools,
    tool_choice: "auto",
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
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
  for (const toolCall of functionCalls) {
    if (toolCall.function.name && toolCall.function.arguments) {
      try {
        // Parse arguments
        const args = JSON.parse(toolCall.function.arguments);

        // Check if it's a chart command or data fetch
        if (chartTools.isChartTool(toolCall.function.name)) {
          // Chart commands are written to Firestore for execution
          await onToolCall(toolCall);

          // Send confirmation message
          const confirmationMessage = chartTools.getConfirmationMessage(
            toolCall.function.name,
            args
          );
          onStream("\n\n" + confirmationMessage);
          assistantMessage += "\n\n" + confirmationMessage;
        } else if (firestoreTools.isFirestoreTool(toolCall.function.name)) {
          // Firestore data tools are executed immediately
          const result = await firestoreTools.execute(
            toolCall.function.name,
            args,
            db
          );

          // Send result summary
          const summary = firestoreTools.formatResult(
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
    }
  }

  return assistantMessage;
}
