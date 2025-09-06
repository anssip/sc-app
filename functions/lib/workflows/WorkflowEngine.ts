import { Workflow, WorkflowIntent } from "./types.js";

export class WorkflowEngine {
  private static workflows = new Map<string, Workflow<any, any>>();

  static registerWorkflow(workflow: Workflow<any, any>): void {
    this.workflows.set(workflow.name, workflow);
  }

  static getWorkflow(name: string): Workflow<any, any> | undefined {
    return this.workflows.get(name);
  }

  static getAllWorkflows(): Workflow<any, any>[] {
    return Array.from(this.workflows.values());
  }

  static analyzeIntent(message: string, _chartContext?: any): WorkflowIntent {
    const lowerMessage = message.toLowerCase();

    // Check for trend line related keywords
    if (
      lowerMessage.includes("trend line") ||
      lowerMessage.includes("trendline") ||
      lowerMessage.includes("collinear") ||
      lowerMessage.includes("resistance line") ||
      lowerMessage.includes("support line") ||
      lowerMessage.includes("draw a line through") ||
      lowerMessage.includes("find points that align")
    ) {
      const type = lowerMessage.includes("resistance")
        ? "resistance"
        : lowerMessage.includes("support")
        ? "support"
        : "resistance"; // default

      return {
        requiresWorkflow: true,
        workflowType: "TrendLineWorkflow",
        parameters: {
          type,
          minPoints: 3,
          threshold: 0.02,
        },
        confidence: 0.9,
      };
    }

    // Check for pattern recognition keywords
    if (
      lowerMessage.includes("pattern") ||
      lowerMessage.includes("head and shoulders") ||
      lowerMessage.includes("triangle") ||
      lowerMessage.includes("flag") ||
      lowerMessage.includes("pennant")
    ) {
      return {
        requiresWorkflow: true,
        workflowType: "PatternRecognitionWorkflow",
        parameters: {},
        confidence: 0.85,
      };
    }

    // Check for backtesting keywords
    if (
      lowerMessage.includes("backtest") ||
      lowerMessage.includes("test strategy") ||
      lowerMessage.includes("historical performance") ||
      lowerMessage.includes("simulate trades")
    ) {
      return {
        requiresWorkflow: true,
        workflowType: "BacktestingWorkflow",
        parameters: {},
        confidence: 0.85,
      };
    }

    // No workflow needed - use LLM
    return {
      requiresWorkflow: false,
      confidence: 0.0,
    };
  }

  static async executeWorkflow<T, R>(
    workflowName: string,
    input: T,
    onProgress?: (message: string) => void
  ): Promise<R> {
    const workflow = this.getWorkflow(workflowName);

    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    if (!workflow.validateInput(input)) {
      throw new Error(`Invalid input for workflow ${workflowName}`);
    }

    return await workflow.execute(input, onProgress);
  }

  static convertToToolCalls(result: any, workflowType: string): any[] {
    const toolCalls = [];

    switch (workflowType) {
      case "TrendLineWorkflow":
        if (result.trendLine) {
          // Add the trend line to the chart
          // Note: We don't change the chart's time range - let the user control the view
          toolCalls.push({
            id: `call_${Date.now()}_trendline`,
            type: "function",
            function: {
              name: "add_trend_line",
              arguments: JSON.stringify({
                start: {
                  timestamp: result.trendLine.startTime,
                  price: result.trendLine.startPrice,
                },
                end: {
                  timestamp: result.trendLine.endTime,
                  price: result.trendLine.endPrice,
                },
                color: result.trendLine.color || "#FF5733",
                lineWidth: result.trendLine.lineWidth || 2,
                style: result.trendLine.style || "solid",
              }),
            },
          });
        }
        break;

      case "PatternRecognitionWorkflow":
        result.patterns?.forEach((pattern: any) => {
          toolCalls.push({
            id: `call_${Date.now()}_${pattern.type}`,
            type: "function",
            function: {
              name: "highlightPattern",
              arguments: JSON.stringify({
                type: pattern.type,
                points: pattern.points,
                confidence: pattern.confidence,
              }),
            },
          });
        });
        break;

      case "BacktestingWorkflow":
        // Add markers for trades
        result.trades?.forEach((trade: any, index: number) => {
          toolCalls.push({
            id: `call_${Date.now()}_entry_${index}`,
            type: "function",
            function: {
              name: "addMarker",
              arguments: JSON.stringify({
                time: trade.entryTime,
                price: trade.entryPrice,
                type: "entry",
                direction: trade.type,
                label: `Entry ${index + 1}`,
              }),
            },
          });

          toolCalls.push({
            id: `call_${Date.now()}_exit_${index}`,
            type: "function",
            function: {
              name: "addMarker",
              arguments: JSON.stringify({
                time: trade.exitTime,
                price: trade.exitPrice,
                type: "exit",
                direction: trade.type,
                label: `Exit ${index + 1}`,
                profit: trade.profit,
              }),
            },
          });
        });
        break;
    }

    return toolCalls;
  }

  static getConfirmationMessage(workflowType: string, result: any): string {
    switch (workflowType) {
      case "TrendLineWorkflow":
        return `Found ${result.points.length} ${result.type} points with ${(
          result.confidence * 100
        ).toFixed(1)}% confidence. Added ${result.type} line to chart.`;

      case "PatternRecognitionWorkflow":
        const patterns = result.patterns.map((p: any) => p.type).join(", ");
        return `Identified patterns: ${patterns}. Highlighted on chart.`;

      case "BacktestingWorkflow":
        return `Backtesting complete: ${
          result.performance.totalTrades
        } trades, ${(result.performance.winRate * 100).toFixed(
          1
        )}% win rate, ${(result.performance.totalReturn * 100).toFixed(
          2
        )}% return.`;

      default:
        return "Workflow completed successfully.";
    }
  }
}
