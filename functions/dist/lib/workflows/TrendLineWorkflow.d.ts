import { Workflow, TrendLineInput, TrendLineResult } from "./types.js";
export declare class TrendLineWorkflow implements Workflow<TrendLineInput, TrendLineResult> {
    name: string;
    description: string;
    validateInput(input: TrendLineInput): boolean;
    execute(input: TrendLineInput): Promise<TrendLineResult>;
    private fetchPriceData;
    private findPeaks;
    private findValleys;
    private ransac;
    private randomSample;
    private fitLine;
    private pointToLineDistance;
    private generateTrendLineParams;
    private getIntervalMilliseconds;
}
//# sourceMappingURL=TrendLineWorkflow.d.ts.map