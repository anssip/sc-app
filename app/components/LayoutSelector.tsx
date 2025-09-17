import React, { useState } from "react";
import { LayoutSelectorModal } from "./LayoutSelectorModal";
import { useLayouts, useUserSettings } from "~/hooks/useRepository";
import { useSubscription } from "~/contexts/SubscriptionContext";
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
  const { layouts, saveLayout, deleteLayout, isLoading } = useLayouts();
  const { setActiveLayout } = useUserSettings();
  const { status, plan, canAddMoreLayouts, getLayoutLimit, isLoading: subscriptionLoading } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaveLayout = async (name: string, presetLayout: PanelLayout) => {
    // Check if user can add more layouts
    if (!canAddMoreLayouts(layouts.length)) {
      // Return false to indicate failure
      return false;
    }

    // 1. Find the first chart in the current layout to use as defaults
    const defaultChart = findFirstChart(currentLayout);
    // 2. Clone the preset layout with completely new IDs
    const layoutWithNewIds = cloneLayoutWithNewIds(presetLayout);
    // 3. Update all charts with the default configuration
    const finalLayout = updateAllChartsWithDefaults(
      layoutWithNewIds,
      defaultChart
    );
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
      const savedLayout = await saveLayout(layoutData);
      // Set as active layout in user settings
      await setActiveLayout(savedLayout.id);

      // Small delay to ensure React has time to unmount old components
      setTimeout(() => {
        onLayoutChange(finalLayout, savedLayout.id);
        setModalOpen(false);
      }, 100);
      
      return true; // Success
    } catch (error) {
      // Don't close modal on error so user can retry
      return false; // Failure
    }
  };

  const handleLoadSavedLayout = async (layoutId: string) => {
    const savedLayout = layouts.find((l) => l.id === layoutId);
    if (!savedLayout) {
      return;
    }

    const charts = new Map<string, ChartConfig>();
    const panelLayout = convertToChartPanelLayout(savedLayout.layout, charts);

    // Set as active layout in user settings
    try {
      await setActiveLayout(savedLayout.id);
    } catch (error) {
      }

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
      <div className={`flex items-center ${className}`}>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700"
          title="Open layout manager"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <span>{activeLayoutName}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <LayoutSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveLayout={handleSaveLayout}
        onSelectLayout={handleLoadSavedLayout}
        onDeleteLayout={deleteLayout}
        layouts={layouts}
        activeLayoutId={currentLayoutId}
        loading={isLoading || subscriptionLoading}
        canAddMoreLayouts={canAddMoreLayouts(layouts.length)}
        layoutLimit={getLayoutLimit()}
        subscriptionStatus={status}
        subscriptionPlan={plan}
      />
    </>
  );
};
