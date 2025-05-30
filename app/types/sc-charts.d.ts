declare module '@anssipiirainen/sc-charts' {
  export interface ChartState {
    symbol: string;
    granularity: string;
    loading: boolean;
    indicators: IndicatorConfig[];
  }

  export interface IndicatorConfig {
    type: string;
    parameters?: Record<string, any>;
  }

  export interface ChartContainer extends HTMLElement {
    // Web component interface
  }

  export interface App {
    cleanup(): void;
  }

  export function initChart(
    container: ChartContainer,
    firebaseConfig: any,
    initialState?: Partial<ChartState>
  ): App;

  export function createChartContainer(): ChartContainer;

  export const logger: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };

  export function setProductionLogging(): void;
}