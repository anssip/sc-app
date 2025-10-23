/**
 * Market API client for fetching price data
 * Handles batching and rate limiting for the market.spotcanvas.com API
 *
 * This is a shared module used by both client and server code.
 */
export interface IndicatorValue {
    name: string;
    timestamp: number;
    value: number;
    plot_ref?: string;
}
export interface Evaluation {
    id: string;
    name?: string;
    values: IndicatorValue[];
    plot_styles?: any;
}
export interface PriceCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    evaluations?: Evaluation[];
}
export interface TimeRange {
    start: number;
    end: number;
}
export declare class MarketAPI {
    private readonly API_BASE_URL;
    private readonly MAX_CANDLES_PER_REQUEST;
    /**
     * Fetches price data for a given symbol and time range
     * Automatically handles batching for large time ranges
     *
     * @param symbol Trading symbol (e.g., "BTC-USD")
     * @param interval Granularity (e.g., "ONE_HOUR", "ONE_DAY")
     * @param startTime Start timestamp in milliseconds
     * @param endTime End timestamp in milliseconds
     * @param onProgress Optional progress callback
     * @param evaluators Optional list of evaluator IDs (e.g., ["moving-averages", "rsi"])
     * @returns Array of price candles with optional indicator evaluations
     */
    fetchPriceData(symbol: string, interval: string, startTime: number, endTime: number, onProgress?: (message: string) => void, evaluators?: string[]): Promise<PriceCandle[]>;
    /**
     * Fetches a single batch of candles (up to MAX_CANDLES_PER_REQUEST)
     */
    private fetchSingleBatch;
    /**
     * Converts interval string to milliseconds
     */
    getIntervalMilliseconds(interval: string): number;
    /**
     * Generates realistic mock data for testing when API is unavailable
     */
    generateMockData(startTime: number, endTime: number, interval: string): PriceCandle[];
}
export declare const marketAPI: MarketAPI;
//# sourceMappingURL=MarketAPI.d.ts.map