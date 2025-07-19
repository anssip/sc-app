import React, { useState } from "react";
import { LayoutSelectorModal } from "./LayoutSelectorModal";
import { useLayouts } from "~/hooks/useRepository";
import type { PanelLayout } from "./ChartPanel";
import {
  convertFromChartPanelLayout,
  convertToChartPanelLayout,
} from "~/utils/layoutConverter";
import type { ChartConfig, LayoutNode, SavedLayout } from "~/types";

interface LayoutSelectorProps {
  currentLayout: PanelLayout;
  currentLayoutId: string | null;
  onLayoutChange: (layout: PanelLayout, layoutId?: string) => void;
  className?: string;
}

// Helper function to find the first chart in a layout
const findFirstChart = (layout: PanelLayout): ChartConfig | null => {
  if (layout.type === "chart" && layout.chart) {
    return layout.chart;
  }
  if (layout.type === "group" && layout.children) {
    for (const child of layout.children) {
      const chart = findFirstChart(child);
      if (chart) {
        return chart;
      }
    }
  }
  return null;
};

// Helper function to generate a unique chart ID
const generateUniqueChartId = (): string => {
  return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to deeply clone a layout and assign new IDs
const cloneLayoutWithNewIds = (layout: PanelLayout): PanelLayout => {
  const newLayout = { ...layout };

  // Generate a new ID for this layout node
  newLayout.id = `layout-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  if (newLayout.type === "chart" && newLayout.chart) {
    // Create a new chart config with a unique ID
    newLayout.chart = {
      ...newLayout.chart,
      id: generateUniqueChartId(),
    };
  } else if (newLayout.type === "group" && newLayout.children) {
    // Recursively clone children with new IDs
    newLayout.children = newLayout.children.map((child) =>
      cloneLayoutWithNewIds(child)
    );
  }

  return newLayout;
};

// Helper function to update all charts in a layout with default config
const updateAllChartsWithDefaults = (
  layout: PanelLayout,
  defaultChart: ChartConfig | null
): PanelLayout => {
  const updatedLayout = { ...layout };

  if (updatedLayout.type === "chart" && updatedLayout.chart) {
    // Update with default chart config while preserving the new ID
    updatedLayout.chart = {
      ...updatedLayout.chart,
      symbol: defaultChart?.symbol || "BTC-USD",
      granularity: defaultChart?.granularity || "ONE_HOUR",
      indicators: defaultChart?.indicators || [],
    };
  } else if (updatedLayout.type === "group" && updatedLayout.children) {
    updatedLayout.children = updatedLayout.children.map((child) =>
      updateAllChartsWithDefaults(child, defaultChart)
    );
  }

  return updatedLayout;
};

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  currentLayoutId,
  onLayoutChange,
  className = "",
}) => {
  const { layouts, saveLayout, isLoading } = useLayouts();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaveLayout = async (name: string, presetLayout: PanelLayout) => {
    console.log("Creating new layout:", name);

    // 1. Find the first chart in the current layout to use as defaults
    const defaultChart = findFirstChart(currentLayout);
    console.log("Using default chart config:", defaultChart);

    // 2. Clone the preset layout with completely new IDs
    const layoutWithNewIds = cloneLayoutWithNewIds(presetLayout);
    console.log("Layout with new IDs:", layoutWithNewIds);

    // 3. Update all charts with the default configuration
    const finalLayout = updateAllChartsWithDefaults(
      layoutWithNewIds,
      defaultChart
    );
    console.log("Final layout with defaults:", finalLayout);

    // 4. Convert to repository format
    const charts = new Map<string, ChartConfig>();
    const repositoryLayout: LayoutNode = convertFromChartPanelLayout(
      finalLayout,
      charts
    );

    const layoutData: Omit<SavedLayout, "id" | "createdAt" | "updatedAt"> = {
      name,
      userId: "", // Will be set by repository
      layout: repositoryLayout,
    };

    // 5. Save and activate the new layout
    try {
      console.log("Saving layout to repository...");
      const savedLayout = await saveLayout(layoutData);
      console.log("Layout saved successfully:", savedLayout.id);

      // Small delay to ensure React has time to unmount old components
      setTimeout(() => {
        onLayoutChange(finalLayout, savedLayout.id);
        setModalOpen(false);
      }, 100);
    } catch (error) {
      console.error("Failed to save new layout:", error);
      // Don't close modal on error so user can retry
    }
  };

  const handleLoadSavedLayout = (layoutId: string) => {
    const savedLayout = layouts.find((l) => l.id === layoutId);
    if (!savedLayout) {
      console.warn(`Layout with id ${layoutId} not found.`);
      return;
    }

    console.log("Loading saved layout:", savedLayout.name);

    const charts = new Map<string, ChartConfig>();
    const panelLayout = convertToChartPanelLayout(savedLayout.layout, charts);

    // Small delay to ensure React has time to unmount old components
    setTimeout(() => {
      onLayoutChange(panelLayout, savedLayout.id);
      setModalOpen(false);
    }, 100);
  };

  const activeLayout = layouts.find((l) => l.id === currentLayoutId);
  const activeLayoutName = activeLayout?.name || "Unsaved Layout";

  return (
    <>
      <div className={`flex items-center gap-4 ${className}`}>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Layout:{" "}
          </span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {activeLayoutName}
          </span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          title="Open layout manager"
        >
          Manage Layouts
        </button>
      </div>

      <LayoutSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveLayout={handleSaveLayout}
        onSelectLayout={handleLoadSavedLayout}
        layouts={layouts}
        activeLayoutId={currentLayoutId}
        loading={isLoading}
      />
    </>
  );
};
