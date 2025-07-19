import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import type { PanelLayout } from "./ChartPanel";
import { LAYOUT_PRESETS } from "./ChartPanel";

interface LayoutSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLayout: (name: string, layout: PanelLayout) => Promise<void>;
  onSelectLayout: (layoutId: string) => void;
  layouts: { id: string; name: string }[];
  activeLayoutId: string | null;
  loading: boolean;
}

const LayoutPresetButton: React.FC<{
  name: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled: boolean;
}> = ({ name, onClick, icon, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs h-full transition-all duration-200 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
    title={`Create new '${name}' layout`}
  >
    {icon}
    <span>{name}</span>
  </button>
);

export const LayoutSelectorModal: React.FC<LayoutSelectorModalProps> = ({
  isOpen,
  onClose,
  onSaveLayout,
  onSelectLayout,
  layouts,
  activeLayoutId,
  loading,
}) => {
  const [newLayoutName, setNewLayoutName] = useState("");
  const [addLayoutAccordionOpen, setAddLayoutAccordionOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (preset: PanelLayout) => {
    if (!newLayoutName.trim()) {
      setError("Layout name cannot be empty.");
      return;
    }
    setError(null);
    await onSaveLayout(newLayoutName, preset);
    setNewLayoutName("");
    setAddLayoutAccordionOpen(false);
  };

  const layoutConfigs = [
    {
      name: "Single",
      key: "single",
      layout: LAYOUT_PRESETS.single,
      icon: <div className="w-10 h-8 border-2 border-current rounded-md" />,
    },
    {
      name: "Horizontal",
      key: "horizontal",
      layout: LAYOUT_PRESETS.horizontal,
      icon: (
        <div className="flex gap-1 w-10 h-8">
          <div className="w-1/2 h-full border-2 border-current rounded-sm" />
          <div className="w-1/2 h-full border-2 border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Vertical",
      key: "vertical",
      layout: LAYOUT_PRESETS.vertical,
      icon: (
        <div className="flex flex-col gap-1 w-10 h-8">
          <div className="w-full h-1/2 border-2 border-current rounded-sm" />
          <div className="w-full h-1/2 border-2 border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Quad",
      key: "quad",
      layout: LAYOUT_PRESETS.quad,
      icon: (
        <div className="grid grid-cols-2 gap-1 w-10 h-8">
          <div className="w-full h-full border-2 border-current rounded-sm" />
          <div className="w-full h-full border-2 border-current rounded-sm" />
          <div className="w-full h-full border-2 border-current rounded-sm" />
          <div className="w-full h-full border-2 border-current rounded-sm" />
        </div>
      ),
    },
    {
      name: "Triple",
      key: "triple",
      layout: LAYOUT_PRESETS.triple,
      icon: (
        <div className="flex gap-1 w-10 h-8">
          <div className="w-1/2 h-full border-2 border-current rounded-sm" />
          <div className="flex flex-col gap-1 w-1/2 h-full">
            <div className="w-full h-1/2 border-2 border-current rounded-sm" />
            <div className="w-full h-1/2 border-2 border-current rounded-sm" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              Layout Manager
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select an active layout or create a new one.
            </Dialog.Description>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Saved Layouts List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Saved Layouts
              </h3>
              {layouts.length > 0 ? (
                <ul className="space-y-2">
                  {layouts.map((layout) => (
                    <li
                      key={layout.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span
                        className={`font-medium text-gray-800 dark:text-gray-200`}
                      >
                        {layout.name}
                      </span>
                      <button
                        onClick={() => {
                          onSelectLayout(layout.id);
                          onClose();
                        }}
                        disabled={layout.id === activeLayoutId || loading}
                        className={`px-4 py-1.5 text-sm font-semibold text-white rounded-md transition-colors ${
                          layout.id === activeLayoutId
                            ? "bg-indigo-600 cursor-default"
                            : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                        }`}
                      >
                        {layout.id === activeLayoutId ? "Active" : "Activate"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No saved layouts. Create one below.
                </p>
              )}
            </div>

            {/* Add New Layout Accordion */}
            <div>
              <button
                onClick={() =>
                  setAddLayoutAccordionOpen(!addLayoutAccordionOpen)
                }
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 dark:text-gray-200"
              >
                Create New Layout
                <svg
                  className={`w-5 h-5 transition-transform ${
                    addLayoutAccordionOpen ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {addLayoutAccordionOpen && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                  <label
                    htmlFor="new-layout-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Layout Name
                  </label>
                  <input
                    id="new-layout-name"
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => {
                      setNewLayoutName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g., 'My Trading Setup'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}

                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                    Select a Preset
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {layoutConfigs.map((config) => (
                      <LayoutPresetButton
                        key={config.key}
                        name={config.name}
                        onClick={() => handleSave(config.layout)}
                        icon={config.icon}
                        disabled={loading || !newLayoutName.trim()}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
