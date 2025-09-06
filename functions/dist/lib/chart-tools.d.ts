interface ToolDefinition {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}
export declare const chartTools: {
    definitions: ToolDefinition[];
    isChartTool(name: string): boolean;
    getConfirmationMessage(toolName: string, args: any): string;
};
export {};
//# sourceMappingURL=chart-tools.d.ts.map