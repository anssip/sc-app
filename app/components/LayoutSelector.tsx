import React, { useState } from "react";
import { PanelLayout, LAYOUT_PRESETS } from "./ChartPanel";
import { useLayouts } from "~/hooks/useRepository";
import { SaveLayoutDialog } from "./SaveLayoutDialog";
import {
  convertFromChartPanelLayout,
  convertToChartPanelLayout,
} from "~/utils/layoutConverter";
import type { ChartConfig } from "~/types";

interface LayoutSelectorProps {
  currentLayout: PanelLayout;
  onLayoutChange: (layout: PanelLayout) => void;
  className?: string;
}

const LayoutButton: React.FC<{
  name: string;
  layout: PanelLayout;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ name, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200
      ${
        isActive
          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300"
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
      }
    `}
    title={`Switch to ${name} layout`}
  >
    {icon}
  </button>
);

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  className = "",
}) => {
  const { layouts, saveLayout, isLoading, error } = useLayouts();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const layoutConfigs = [
    {
      name: "Single",
      key: "single",
      layout: LAYOUT_PRESETS.single,
      icon: <div className="w-8 h-6 border border-current rounded-sm" />,
    },
    {
      name: "Horizontal",
      key: "horizontal",
      layout: LAYOUT_PRESETS.horizontal,
      icon: (
        <div className="flex gap-1">
          <div className="w-3 h-6 border border-current rounded-sm" />
          <div className="w-3 h-6 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Vertical",
      key: "vertical",
      layout: LAYOUT_PRESETS.vertical,
      icon: (
        <div className="flex flex-col gap-1">
          <div className="w-8 h-2 border border-current rounded-sm" />
          <div className="w-8 h-2 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Quad",
      key: "quad",
      layout: LAYOUT_PRESETS.quad,
      icon: (
        <div className="grid grid-cols-2 gap-1">
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
          <div className="w-3 h-2 border border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Triple",
      key: "triple",
      layout: LAYOUT_PRESETS.triple,
      icon: (
        <div className="flex gap-1">
          <div className="w-3 h-6 border border-current rounded-sm" />
          <div className="flex flex-col gap-1">
            <div className="w-3 h-2 border border-current rounded-sm" />
            <div className="w-3 h-2 border border-current rounded-sm" />
          </div>
        </div>
      ),
    },
  ];

  const isLayoutActive = (presetLayout: PanelLayout) => {
    return JSON.stringify(currentLayout) === JSON.stringify(presetLayout);
  };

  const handleSaveLayout = async (name: string) => {
    const charts = new Map<string, ChartConfig>();
    const repositoryLayout = convertFromChartPanelLayout(currentLayout, charts);

    const layoutData = {
      name,
      userId: "", // Will be set by repository
      layout: repositoryLayout,
    };

    await saveLayout(layoutData);
  };

  const handleLoadSavedLayout = (layoutId: string) => {
    const savedLayout = layouts.find((l) => l.id === layoutId);
    if (!savedLayout) return;

    const charts = new Map<string, ChartConfig>();
    const panelLayout = convertToChartPanelLayout(savedLayout.layout, charts);
    onLayoutChange(panelLayout);
  };

  return (
    <>
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Saved Layouts Dropdown */}
        {layouts.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Saved:
            </label>
            <select
              onChange={(e) =>
                e.target.value && handleLoadSavedLayout(e.target.value)
              }
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value=""
            >
              <option value="">Select layout...</option>
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={() => setSaveDialogOpen(true)}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          title="Save current layout"
        >
          Save
        </button>

        {/* Preset Layouts */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Presets:
          </span>
          <div className="flex gap-2">
            {layoutConfigs.map((config) => (
              <LayoutButton
                key={config.key}
                name={config.name}
                layout={config.layout}
                isActive={isLayoutActive(config.layout)}
                onClick={() => onLayoutChange(config.layout)}
                icon={config.icon}
              />
            ))}
          </div>
        </div>
      </div>

      <SaveLayoutDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveLayout}
        loading={isLoading}
      />
    </>
  );
};
