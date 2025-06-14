import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChartContainer } from "./ChartContainer";
import type { Granularity } from "@anssipiirainen/sc-charts";
import type { ChartConfig } from "./ChartContainer";

/**
 * ChartPanel Component
 *
 * This component implements a flexible chart layout system with individual chart state management.
 * Each chart instance has its own state and uses the Chart API for independent control.
 *
 * Key Features:
 * - Individual chart state management (no shared global state)
 * - Chart API integration for symbol and granularity changes
 * - Resizable panel layout system
 * - Error handling and loading states
 * - Real-time chart updates via API calls
 */

export interface PanelLayout {
  id: string;
  type: "chart" | "group";
  direction?: "horizontal" | "vertical";
  children?: PanelLayout[];
  chart?: ChartConfig;
  defaultSize?: number;
  minSize?: number;
}

interface ChartPanelProps {
  layout: PanelLayout;
  onLayoutChange?: (layout: PanelLayout) => void;
  className?: string;
}

const defaultChartConfig: ChartConfig = {
  id: "default",
  symbol: "BTC-USD",
  granularity: "ONE_HOUR",
  indicators: [],
};

const ResizeHandle: React.FC<{ direction: "horizontal" | "vertical" }> = ({
  direction,
}) => (
  <PanelResizeHandle
    className={`
      ${direction === "horizontal" ? "w-2 hover:w-3" : "h-2 hover:h-3"}
      bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
      transition-all duration-200 ease-in-out
      ${
        direction === "horizontal"
          ? "cursor-col-resize border-l border-r border-gray-300 dark:border-gray-600"
          : "cursor-row-resize border-t border-b border-gray-300 dark:border-gray-600"
      }
      flex items-center justify-center
      group
    `}
  >
    <div
      className={`
      ${direction === "horizontal" ? "w-0.5 h-6" : "h-0.5 w-6"}
      bg-gray-400 dark:bg-gray-500
      group-hover:bg-gray-500 dark:group-hover:bg-gray-400
      transition-colors duration-200
    `}
    />
  </PanelResizeHandle>
);

const renderPanelGroup = (
  layout: PanelLayout,
  onLayoutChange?: (layout: PanelLayout) => void,
  parentPath: string = "",
  rootLayout?: PanelLayout
): React.ReactNode => {
  const currentPath = parentPath ? `${parentPath}.${layout.id}` : layout.id;

  if (layout.type === "chart" && layout.chart) {
    return (
      <Panel
        key={layout.id}
        defaultSize={layout.defaultSize || 50}
        minSize={layout.minSize || 20}
        className="relative"
      >
        <ChartContainer
          config={layout.chart}
          onSymbolChange={(symbol) => {
            // This callback can be used for additional symbol change handling if needed
          }}
          onConfigUpdate={(updatedConfig) => {
            if (onLayoutChange && rootLayout) {
              // Update the specific chart within the full layout tree
              const updateChartInLayout = (
                currentLayout: PanelLayout
              ): PanelLayout => {
                if (
                  currentLayout.type === "chart" &&
                  currentLayout.id === layout.id
                ) {
                  return {
                    ...currentLayout,
                    chart: updatedConfig,
                  };
                } else if (
                  currentLayout.type === "group" &&
                  currentLayout.children
                ) {
                  return {
                    ...currentLayout,
                    children: currentLayout.children.map(updateChartInLayout),
                  };
                }
                return currentLayout;
              };

              const updatedRootLayout = updateChartInLayout(rootLayout);
              onLayoutChange(updatedRootLayout);
            }
          }}
        />
      </Panel>
    );
  }

  if (layout.type === "group" && layout.children) {
    return (
      <Panel
        key={layout.id}
        defaultSize={layout.defaultSize || 50}
        minSize={layout.minSize || 20}
      >
        <PanelGroup direction={layout.direction || "horizontal"}>
          {layout.children.map((child, index) => (
            <React.Fragment key={child.id}>
              {renderPanelGroup(
                child,
                onLayoutChange,
                currentPath,
                rootLayout || layout
              )}
              {index < layout.children!.length - 1 && (
                <ResizeHandle direction={layout.direction || "horizontal"} />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </Panel>
    );
  }

  return null;
};

export const ChartPanel: React.FC<ChartPanelProps> = ({
  layout,
  onLayoutChange,
  className = "",
}) => {
  return (
    <div className={`h-full w-full ${className}`}>
      <PanelGroup direction={layout.direction || "horizontal"}>
        {layout.children
          ? layout.children.map((child, index) => (
              <React.Fragment key={child.id}>
                {renderPanelGroup(child, onLayoutChange, "", layout)}
                {index < layout.children!.length - 1 && (
                  <ResizeHandle direction={layout.direction || "horizontal"} />
                )}
              </React.Fragment>
            ))
          : renderPanelGroup(layout, onLayoutChange, "", layout)}
      </PanelGroup>
    </div>
  );
};

// Helper functions for creating layouts
export const createChartLayout = (
  id: string,
  symbol: string = "BTC-USD",
  granularity: Granularity = "ONE_HOUR",
  defaultSize?: number
): PanelLayout => ({
  id,
  type: "chart",
  chart: {
    id,
    symbol,
    granularity,
    indicators: [],
  },
  defaultSize,
  minSize: 20,
});

export const createGroupLayout = (
  id: string,
  direction: "horizontal" | "vertical",
  children: PanelLayout[],
  defaultSize?: number
): PanelLayout => ({
  id,
  type: "group",
  direction,
  children,
  defaultSize,
  minSize: 20,
});

// Predefined layouts
export const LAYOUT_PRESETS = {
  single: createChartLayout("main", "BTC-USD"),

  horizontal: createGroupLayout("root", "horizontal", [
    createChartLayout("left", "BTC-USD", "ONE_HOUR", 50),
    createChartLayout("right", "ETH-USD", "ONE_HOUR", 50),
  ]),

  vertical: createGroupLayout("root", "vertical", [
    createChartLayout("top", "BTC-USD", "ONE_HOUR", 50),
    createChartLayout("bottom", "ETH-USD", "ONE_HOUR", 50),
  ]),

  quad: createGroupLayout("root", "vertical", [
    createGroupLayout(
      "top",
      "horizontal",
      [
        createChartLayout("top-left", "BTC-USD", "ONE_HOUR", 50),
        createChartLayout("top-right", "ETH-USD", "ONE_HOUR", 50),
      ],
      50
    ),
    createGroupLayout(
      "bottom",
      "horizontal",
      [
        createChartLayout("bottom-left", "ADA-USD", "ONE_HOUR", 50),
        createChartLayout("bottom-right", "SOL-USD", "ONE_HOUR", 50),
      ],
      50
    ),
  ]),

  triple: createGroupLayout("root", "horizontal", [
    createChartLayout("left", "BTC-USD", "ONE_HOUR", 40),
    createGroupLayout(
      "right",
      "vertical",
      [
        createChartLayout("top-right", "ETH-USD", "ONE_HOUR", 50),
        createChartLayout("bottom-right", "ADA-USD", "ONE_HOUR", 50),
      ],
      60
    ),
  ]),
};
