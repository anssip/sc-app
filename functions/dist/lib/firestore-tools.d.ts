import { Firestore } from "firebase-admin/firestore";
interface ToolDefinition {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}
interface PriceDataArgs {
    symbol: string;
    interval: string;
    limit?: number;
    startTime?: number;
    endTime?: number;
}
interface LatestPriceArgs {
    symbol: string;
}
interface AnalyzePricePointsArgs {
    symbol: string;
    interval: string;
    startTime: number;
    endTime: number;
    type?: "highs" | "lows" | "both";
    count?: number;
}
export declare const firestoreTools: {
    definitions: ToolDefinition[];
    isFirestoreTool(name: string): boolean;
    execute(toolName: string, args: any, db: Firestore): Promise<any>;
    getPriceData({ symbol, interval, limit, startTime, endTime, }: PriceDataArgs): Promise<any>;
    getLatestPrice({ symbol }: LatestPriceArgs): Promise<any>;
    getAvailableSymbols(db: Firestore): Promise<any>;
    analyzePricePoints({ symbol, interval, startTime, endTime, type, count, }: AnalyzePricePointsArgs): Promise<any>;
    formatResult(toolName: string, result: any): string;
};
export {};
//# sourceMappingURL=firestore-tools.d.ts.map