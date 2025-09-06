// Export all workflow modules
export * from './types.js';
export { WorkflowEngine } from './WorkflowEngine.js';
export { TrendLineWorkflow } from './TrendLineWorkflow.js';

// Initialize workflows
import { WorkflowEngine } from './WorkflowEngine.js';
import { TrendLineWorkflow } from './TrendLineWorkflow.js';

// Register all workflows
export function initializeWorkflows(): void {
  WorkflowEngine.registerWorkflow(new TrendLineWorkflow());
  // Future workflows will be registered here:
  // WorkflowEngine.registerWorkflow(new PatternRecognitionWorkflow());
  // WorkflowEngine.registerWorkflow(new BacktestingWorkflow());
}
