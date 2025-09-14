import type {
  LayoutNode,
  ChartLayoutNode,
  SplitLayoutNode,
  ChartConfig,
} from "~/types";
import type { PanelLayout } from "~/components/ChartPanel";
import type { Granularity } from "@anssip/rs-charts";

/**
 * Converts from the new repository layout format to the existing ChartPanel format
 */
export function convertToChartPanelLayout(
  layoutNode: LayoutNode,
  charts: Map<string, ChartConfig> = new Map()
): PanelLayout {
  if (layoutNode.type === "chart") {
    const chartNode = layoutNode as ChartLayoutNode;
    // First check for embedded chart, then fall back to chartId lookup
    const chartConfig =
      chartNode.chart || charts.get(chartNode.chartId || chartNode.id);

    return {
      id: chartNode.id,
      type: "chart",
      chart: chartConfig || {
        id: chartNode.id,
        symbol: "BTC-USD",
        granularity: "ONE_HOUR" as Granularity,
        indicators: [],
      },
      defaultSize: chartNode.size || 50,
      size: chartNode.size,
      minSize: 20,
    };
  } else {
    const splitNode = layoutNode as SplitLayoutNode;

    return {
      id: generateId(),
      type: "group",
      direction: splitNode.direction,
      children: splitNode.children.map((child, index) => {
        const childLayout = convertToChartPanelLayout(child, charts);
        // Apply size from parent's sizes array if available
        if (splitNode.sizes && splitNode.sizes[index] !== undefined) {
          return {
            ...childLayout,
            size: splitNode.sizes[index],
            defaultSize: splitNode.sizes[index],
          };
        }
        return childLayout;
      }),
      defaultSize: splitNode.sizes
        ? splitNode.sizes[0]
        : Math.round(splitNode.ratio * 100),
      sizes: splitNode.sizes,
      minSize: 20,
    };
  }
}

/**
 * Converts from the existing ChartPanel format to the new repository layout format
 */
export function convertFromChartPanelLayout(
  panelLayout: PanelLayout,
  charts: Map<string, ChartConfig> = new Map()
): LayoutNode {
  if (panelLayout.type === "chart" && panelLayout.chart) {
    // Store the chart configuration for reference
    charts.set(panelLayout.chart.id, panelLayout.chart);

    const chartNode: any = {
      type: "chart",
      id: panelLayout.id,
      chart: panelLayout.chart, // Embed the chart directly
    };

    // Only include size if it's defined
    if (panelLayout.size !== undefined) {
      chartNode.size = panelLayout.size;
    }

    return chartNode;
  } else if (panelLayout.type === "group" && panelLayout.children) {
    const splitNode: any = {
      type: "split",
      direction: panelLayout.direction || "horizontal",
      ratio: (panelLayout.defaultSize || 50) / 100,
      children: panelLayout.children.map((child) =>
        convertFromChartPanelLayout(child, charts)
      ),
    };

    // Only include sizes if they're defined and don't contain undefined values
    const sizes =
      panelLayout.sizes ||
      panelLayout.children.map(
        (child) => child.size || child.defaultSize || 50
      );

    if (sizes && sizes.every((size) => size !== undefined)) {
      splitNode.sizes = sizes;
    }

    return splitNode;
  } else {
    throw new Error("Invalid panel layout structure");
  }
}

/**
 * Extracts all chart configurations from a ChartPanel layout
 */
export function extractChartsFromPanelLayout(
  panelLayout: PanelLayout
): ChartConfig[] {
  const charts: ChartConfig[] = [];

  function traverse(layout: PanelLayout) {
    if (layout.type === "chart" && layout.chart) {
      charts.push(layout.chart);
    } else if (layout.type === "group" && layout.children) {
      layout.children.forEach((child: PanelLayout) => traverse(child));
    }
  }

  traverse(panelLayout);
  return charts;
}

/**
 * Extracts all chart configurations from a repository layout
 */
export function extractChartsFromRepositoryLayout(
  layoutNode: LayoutNode
): string[] {
  const chartIds: string[] = [];

  function traverse(node: LayoutNode) {
    if (node.type === "chart") {
      const chartNode = node as ChartLayoutNode;
      // Extract from embedded chart first, then fall back to chartId
      if (chartNode.chart) {
        chartIds.push(chartNode.chart.id);
      } else if (chartNode.chartId) {
        chartIds.push(chartNode.chartId);
      } else {
        chartIds.push(chartNode.id);
      }
    } else if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      splitNode.children.forEach(traverse);
    }
  }

  traverse(layoutNode);
  return chartIds;
}

/**
 * Validates a repository layout structure
 */
export function validateRepositoryLayout(layoutNode: LayoutNode): void {
  if (!layoutNode.type || !["split", "chart"].includes(layoutNode.type)) {
    throw new Error("Invalid layout node type");
  }

  if (layoutNode.type === "split") {
    const splitNode = layoutNode as SplitLayoutNode;

    if (
      !splitNode.direction ||
      !["horizontal", "vertical"].includes(splitNode.direction)
    ) {
      throw new Error("Invalid split direction");
    }

    if (
      typeof splitNode.ratio !== "number" ||
      splitNode.ratio < 0 ||
      splitNode.ratio > 1
    ) {
      throw new Error("Invalid split ratio");
    }

    if (!Array.isArray(splitNode.children) || splitNode.children.length === 0) {
      throw new Error("Split node must have children");
    }

    splitNode.children.forEach((child) => validateRepositoryLayout(child));
  } else if (layoutNode.type === "chart") {
    const chartNode = layoutNode as ChartLayoutNode;

    if (!chartNode.id || typeof chartNode.id !== "string") {
      throw new Error("Chart node must have a valid ID");
    }
  }
}

/**
 * Validates a ChartPanel layout structure
 */
export function validateChartPanelLayout(panelLayout: PanelLayout): void {
  if (!panelLayout.type || !["chart", "group"].includes(panelLayout.type)) {
    throw new Error("Invalid panel layout type");
  }

  if (!panelLayout.id || typeof panelLayout.id !== "string") {
    throw new Error("Panel layout must have a valid ID");
  }

  if (panelLayout.type === "group") {
    if (
      panelLayout.direction &&
      !["horizontal", "vertical"].includes(panelLayout.direction)
    ) {
      throw new Error("Invalid group direction");
    }

    if (panelLayout.children && Array.isArray(panelLayout.children)) {
      panelLayout.children.forEach((child: PanelLayout) =>
        validateChartPanelLayout(child)
      );
    }
  } else if (panelLayout.type === "chart") {
    if (!panelLayout.chart) {
      throw new Error("Chart panel must have chart configuration");
    }

    if (!panelLayout.chart.symbol || !panelLayout.chart.granularity) {
      throw new Error("Chart configuration must have symbol and granularity");
    }
  }
}

/**
 * Creates a simple single chart layout in repository format
 */
export function createSingleChartRepositoryLayout(
  chart: ChartConfig
): LayoutNode {
  return {
    type: "chart",
    id: generateId(),
    chart,
  };
}

/**
 * Creates a simple horizontal split layout in repository format
 */
export function createHorizontalSplitRepositoryLayout(
  leftChart: ChartConfig,
  rightChart: ChartConfig,
  ratio: number = 0.5
): LayoutNode {
  return {
    type: "split",
    direction: "horizontal",
    ratio,
    sizes: [50, 50],
    children: [
      {
        type: "chart",
        id: generateId(),
        chart: leftChart,
      },
      {
        type: "chart",
        id: generateId(),
        chart: rightChart,
      },
    ],
  };
}

/**
 * Creates a simple vertical split layout in repository format
 */
export function createVerticalSplitRepositoryLayout(
  topChart: ChartConfig,
  bottomChart: ChartConfig,
  ratio: number = 0.5
): LayoutNode {
  return {
    type: "split",
    direction: "vertical",
    ratio,
    sizes: [50, 50],
    children: [
      {
        type: "chart",
        id: generateId(),
        chart: topChart,
      },
      {
        type: "chart",
        id: generateId(),
        chart: bottomChart,
      },
    ],
  };
}

/**
 * Updates chart references in a repository layout
 */
export function updateChartReferencesInLayout(
  layoutNode: LayoutNode,
  chartIdMapping: Map<string, string>
): LayoutNode {
  if (layoutNode.type === "chart") {
    const chartNode = { ...layoutNode } as ChartLayoutNode;

    // Update embedded chart ID if present
    if (chartNode.chart) {
      const oldChartId = chartNode.chart.id;
      const newChartId = chartIdMapping.get(oldChartId);
      if (newChartId) {
        chartNode.chart = { ...chartNode.chart, id: newChartId };
      }
    }

    // Handle legacy chartId field
    if (chartNode.chartId) {
      const newChartId = chartIdMapping.get(chartNode.chartId);
      if (newChartId) {
        chartNode.chartId = newChartId;
      }
    }

    return chartNode;
  } else {
    const splitNode = { ...layoutNode } as SplitLayoutNode;
    splitNode.children = splitNode.children.map((child) =>
      updateChartReferencesInLayout(child, chartIdMapping)
    );
    return splitNode;
  }
}

/**
 * Counts the number of charts in a layout
 */
export function countChartsInLayout(layoutNode: LayoutNode): number {
  if (layoutNode.type === "chart") {
    return 1;
  } else {
    const splitNode = layoutNode as SplitLayoutNode;
    return splitNode.children.reduce(
      (total, child) => total + countChartsInLayout(child),
      0
    );
  }
}

/**
 * Gets the maximum depth of a layout tree
 */
export function getLayoutDepth(layoutNode: LayoutNode): number {
  if (layoutNode.type === "chart") {
    return 1;
  } else {
    const splitNode = layoutNode as SplitLayoutNode;
    return (
      1 + Math.max(...splitNode.children.map((child) => getLayoutDepth(child)))
    );
  }
}

/**
 * Finds all split nodes in a layout that match a direction
 */
export function findSplitsByDirection(
  layoutNode: LayoutNode,
  direction: "horizontal" | "vertical"
): SplitLayoutNode[] {
  const splits: SplitLayoutNode[] = [];

  function traverse(node: LayoutNode) {
    if (node.type === "split") {
      const splitNode = node as SplitLayoutNode;
      if (splitNode.direction === direction) {
        splits.push(splitNode);
      }
      splitNode.children.forEach(traverse);
    }
  }

  traverse(layoutNode);
  return splits;
}

/**
 * Generates a unique ID for layout nodes
 */
function generateId(): string {
  return `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates default chart configurations for common symbols
 */
export function createDefaultChartConfigs(): ChartConfig[] {
  const symbols = ["BTC-USD", "ETH-USD", "ADA-USD", "SOL-USD"];

  return symbols.map((symbol, index) => ({
    id: `chart-${index + 1}`,
    title: `${symbol} Chart`,
    symbol,
    granularity: "ONE_HOUR" as Granularity,
    indicators: [],
  }));
}

/**
 * Merges chart configurations with a layout, ensuring all referenced charts exist
 */
export function ensureChartsExistInLayout(
  layoutNode: LayoutNode,
  availableCharts: Map<string, ChartConfig>
): { layout: LayoutNode; charts: Map<string, ChartConfig> } {
  const requiredChartIds = extractChartsFromRepositoryLayout(layoutNode);
  const resultCharts = new Map(availableCharts);

  // Create missing charts with default configurations
  requiredChartIds.forEach((chartId) => {
    if (!resultCharts.has(chartId)) {
      resultCharts.set(chartId, {
        id: chartId,
        title: `Chart ${chartId}`,
        symbol: "BTC-USD",
        granularity: "ONE_HOUR" as Granularity,
        indicators: [],
      });
    }
  });

  return {
    layout: layoutNode,
    charts: resultCharts,
  };
}
