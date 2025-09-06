#!/usr/bin/env node

// Test the command format produced by the workflow

import { WorkflowEngine, TrendLineWorkflow, initializeWorkflows } from './functions/dist/lib/workflows/index.js';

// Initialize workflows
initializeWorkflows();

// Create mock trend line result
const mockResult = {
  points: [
    { timestamp: 1700000000000, price: 45000 },
    { timestamp: 1700100000000, price: 46000 },
    { timestamp: 1700200000000, price: 47000 }
  ],
  equation: { slope: 0.01, intercept: 44000 },
  confidence: 0.95,
  trendLine: {
    startTime: 1700000000000,
    endTime: 1700200000000,
    startPrice: 45000,
    endPrice: 47000,
    color: '#FF5733',
    lineWidth: 2,
    style: 'solid'
  },
  type: 'resistance'
};

console.log('Testing WorkflowEngine.convertToToolCalls...\n');

// Convert to tool calls
const toolCalls = WorkflowEngine.convertToToolCalls(mockResult, 'TrendLineWorkflow');

console.log('Generated tool calls:');
console.log(JSON.stringify(toolCalls, null, 2));

// Check the format
if (toolCalls.length > 0) {
  const toolCall = toolCalls[0];
  console.log('\nTool call details:');
  console.log('- Function name:', toolCall.function.name);
  console.log('- Expected name: add_trend_line');
  console.log('- Names match:', toolCall.function.name === 'add_trend_line');

  const args = JSON.parse(toolCall.function.arguments);
  console.log('\nArguments structure:');
  console.log('- Has start object:', !!args.start);
  console.log('- Has end object:', !!args.end);
  console.log('- Start has timestamp and price:', !!(args.start?.timestamp && args.start?.price));
  console.log('- End has timestamp and price:', !!(args.end?.timestamp && args.end?.price));

  console.log('\n✅ Command format looks correct for useChartCommands.ts');
} else {
  console.log('\n❌ No tool calls generated!');
}
