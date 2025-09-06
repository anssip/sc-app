// Core workflow interfaces and types

export interface Workflow<T, R> {
  name: string;
  description: string;
  validateInput(input: T): boolean;
  execute(input: T, onProgress?: (message: string) => void): Promise<R>;
}

export interface WorkflowContext {
  chartContext: ChartContext;
  priceData: PriceCandle[];
  userId: string;
  sessionId: string;
}

export interface ChartContext {
  symbol?: string;
  interval?: string;
  startTime?: number;
  endTime?: number;
  indicators?: any[];
  drawings?: any[];
}

export interface PriceCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TrendLineInput {
  type: "resistance" | "support";
  symbol: string;
  interval: string;
  timeRange: {
    start: number;
    end: number;
  };
  minPoints?: number;
  threshold?: number;
  maxIterations?: number;
}

export interface TrendLineResult {
  points: Array<{
    timestamp: number;
    price: number;
  }>;
  equation: {
    slope: number;
    intercept: number;
  };
  confidence: number;
  trendLine: TrendLineParams;
  type: "resistance" | "support";
}

export interface TrendLineParams {
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  color?: string;
  lineWidth?: number;
  style?: "solid" | "dashed" | "dotted";
}

export interface PatternRecognitionInput {
  symbol: string;
  interval: string;
  timeRange: {
    start: number;
    end: number;
  };
  patterns?: Array<
    | "head_and_shoulders"
    | "triangle"
    | "flag"
    | "pennant"
    | "support_resistance"
  >;
}

export interface PatternRecognitionResult {
  patterns: Array<{
    type: string;
    confidence: number;
    points: Array<{ timestamp: number; price: number }>;
    description: string;
  }>;
}

export interface BacktestingInput {
  strategy: {
    name: string;
    parameters: Record<string, any>;
  };
  symbol: string;
  interval: string;
  timeRange: {
    start: number;
    end: number;
  };
  initialCapital?: number;
  positionSize?: number;
}

export interface BacktestingResult {
  performance: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    profitableTrades: number;
  };
  trades: Array<{
    entryTime: number;
    exitTime: number;
    entryPrice: number;
    exitPrice: number;
    profit: number;
    type: "long" | "short";
  }>;
}

export interface WorkflowIntent {
  requiresWorkflow: boolean;
  workflowType?: string;
  parameters?: any;
  confidence: number;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}
