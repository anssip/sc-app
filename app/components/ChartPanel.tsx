import React, { useRef, useCallback } from "react";
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
  size?: number; // Current size percentage
  sizes?: number[]; // Sizes for group children
}

interface ChartPanelProps {
  layout: PanelLayout;
  layoutId?: string;
  onLayoutChange?: (
    layout: PanelLayout,
    changeType?: "chart-data" | "structure"
  ) => void;
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
      ${direction === "horizontal" ? "w-1 hover:w-2" : "h-1 hover:h-2"}
      bg-gray-800 hover:bg-gray-700
      transition-all duration-200 ease-in-out
      ${direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize"}
      flex items-center justify-center
      group
    `}
  >
    <div
      className={`
      ${direction === "horizontal" ? "w-0.5 h-6" : "h-0.5 w-6"}
      bg-gray-600
      group-hover:bg-gray-500
      transition-colors duration-200
    `}
    />
  </PanelResizeHandle>
);

const renderPanelGroup = (
  layout: PanelLayout,
  layoutId?: string,
  onLayoutChange?: (
    layout: PanelLayout,
    changeType?: "chart-data" | "structure"
  ) => void,
  rootLayout?: PanelLayout,
  parentPath: string = ""
): React.ReactNode => {
  const currentPath = parentPath ? `${parentPath}.${layout.id}` : layout.id;

  if (layout.type === "chart" && layout.chart) {
    return (
      <Panel
        key={layout.id}
        defaultSize={layout.size || layout.defaultSize || 50}
        minSize={layout.minSize || 20}
        className="relative"
      >
        <ChartContainer
          config={layout.chart}
          layoutId={layoutId}
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
              onLayoutChange(updatedRootLayout, "chart-data");
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
        defaultSize={layout.size || layout.defaultSize || 50}
        minSize={layout.minSize || 20}
      >
        <PanelGroup
          direction={layout.direction || "horizontal"}
          onLayout={(sizes) => {
            if (onLayoutChange && rootLayout) {
              // Update the sizes for this group
              const updateSizesInLayout = (
                currentLayout: PanelLayout,
                targetId: string,
                newSizes: number[]
              ): PanelLayout => {
                if (
                  currentLayout.id === targetId &&
                  currentLayout.type === "group"
                ) {
                  return {
                    ...currentLayout,
                    sizes: newSizes,
                    children: currentLayout.children?.map((child, index) => ({
                      ...child,
                      size: newSizes[index],
                    })),
                  };
                } else if (
                  currentLayout.type === "group" &&
                  currentLayout.children
                ) {
                  return {
                    ...currentLayout,
                    children: currentLayout.children.map((child) =>
                      updateSizesInLayout(child, targetId, newSizes)
                    ),
                  };
                }
                return currentLayout;
              };

              const updatedRootLayout = updateSizesInLayout(
                rootLayout,
                layout.id,
                sizes
              );
              onLayoutChange(updatedRootLayout, "structure");
            }
          }}
        >
          {layout.children.map((child, index) => (
            <React.Fragment key={child.id}>
              {renderPanelGroup(
                child,
                layoutId,
                onLayoutChange,
                rootLayout || layout,
                currentPath
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
  layoutId,
  onLayoutChange,
  className = "",
}) => {
  const handleLayoutChange = useCallback(
    (sizes: number[]) => {
      if (!onLayoutChange || !layout.children) return;

      // Update the layout with new sizes
      const updatedLayout = {
        ...layout,
        sizes: sizes,
        children: layout.children.map((child, index) => ({
          ...child,
          size: sizes[index],
        })),
      };

      // Call the change handler with "structure" change type for auto-save
      onLayoutChange(updatedLayout, "structure");
    },
    [onLayoutChange, layout]
  );

  return (
    <div className={`h-full w-full relative ${className}`}>
      <PanelGroup
        direction={layout.direction || "horizontal"}
        onLayout={handleLayoutChange}
      >
        {layout.children
          ? layout.children.map((child, index) => (
              <React.Fragment key={child.id}>
                {renderPanelGroup(child, layoutId, onLayoutChange, layout, "")}
                {index < layout.children!.length - 1 && (
                  <ResizeHandle direction={layout.direction || "horizontal"} />
                )}
              </React.Fragment>
            ))
          : renderPanelGroup(layout, layoutId, onLayoutChange, layout, "")}
      </PanelGroup>
    </div>
  );
};

// Helper functions for creating layouts
export const createChartLayout = (
  id: string,
  symbol: string = "BTC-USD",
  granularity: Granularity = "ONE_HOUR",
  defaultSize?: number,
  size?: number
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
  size,
  minSize: 20,
});

export const createGroupLayout = (
  id: string,
  direction: "horizontal" | "vertical",
  children: PanelLayout[],
  defaultSize?: number,
  sizes?: number[]
): PanelLayout => ({
  id,
  type: "group",
  direction,
  children,
  defaultSize,
  sizes,
  minSize: 20,
});

// Predefined layouts
export const LAYOUT_PRESETS = {
  single: createChartLayout("main", "BTC-USD"),

  horizontal: createGroupLayout(
    "root",
    "horizontal",
    [
      createChartLayout("left", "BTC-USD", "ONE_HOUR", 50, 50),
      createChartLayout("right", "ETH-USD", "ONE_HOUR", 50, 50),
    ],
    100,
    [50, 50]
  ),

  vertical: createGroupLayout(
    "root",
    "vertical",
    [
      createChartLayout("top", "BTC-USD", "ONE_HOUR", 50, 50),
      createChartLayout("bottom", "ETH-USD", "ONE_HOUR", 50, 50),
    ],
    100,
    [50, 50]
  ),

  quad: createGroupLayout(
    "root",
    "horizontal",
    [
      createGroupLayout(
        "left",
        "vertical",
        [
          createChartLayout("top-left", "BTC-USD", "ONE_HOUR", 50, 50),
          createChartLayout("bottom-left", "ETH-USD", "ONE_HOUR", 50, 50),
        ],
        50,
        [50, 50]
      ),
      createGroupLayout(
        "right",
        "vertical",
        [
          createChartLayout("top-right", "SOL-USD", "ONE_HOUR", 50, 50),
          createChartLayout("bottom-right", "ADA-USD", "ONE_HOUR", 50, 50),
        ],
        50,
        [50, 50]
      ),
    ],
    100,
    [50, 50]
  ),

  triple: createGroupLayout(
    "root",
    "horizontal",
    [
      createChartLayout("left", "BTC-USD", "ONE_HOUR", 40, 40),
      createGroupLayout(
        "right",
        "vertical",
        [
          createChartLayout("top-right", "ETH-USD", "ONE_HOUR", 50, 50),
          createChartLayout("bottom-right", "SOL-USD", "ONE_HOUR", 50, 50),
        ],
        60,
        [50, 50]
      ),
    ],
    100,
    [40, 60]
  ),
};
