import { Workflow, WorkflowIntent } from "./types.js";
export declare class WorkflowEngine {
    private static workflows;
    static registerWorkflow(workflow: Workflow<any, any>): void;
    static getWorkflow(name: string): Workflow<any, any> | undefined;
    static getAllWorkflows(): Workflow<any, any>[];
    static analyzeIntent(message: string, _chartContext?: any): WorkflowIntent;
    static executeWorkflow<T, R>(workflowName: string, input: T): Promise<R>;
    static convertToToolCalls(result: any, workflowType: string): any[];
    static getConfirmationMessage(workflowType: string, result: any): string;
}
//# sourceMappingURL=WorkflowEngine.d.ts.map