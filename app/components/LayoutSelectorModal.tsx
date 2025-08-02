import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Trash2 } from "lucide-react";
import type { PanelLayout } from "./ChartPanel";
import { LAYOUT_PRESETS } from "./ChartPanel";

interface LayoutSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLayout: (name: string, layout: PanelLayout) => Promise<void>;
  onSelectLayout: (layoutId: string) => void;
  onDeleteLayout?: (layoutId: string) => Promise<void>;
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
    className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-xs h-20 transition-all duration-200 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    title={`Create new '${name}' layout`}
  >
    {icon}
    <span className="mt-1">{name}</span>
  </button>
);

export const LayoutSelectorModal: React.FC<LayoutSelectorModalProps> = ({
  isOpen,
  onClose,
  onSaveLayout,
  onSelectLayout,
  onDeleteLayout,
  layouts,
  activeLayoutId,
  loading,
}) => {
  const [newLayoutName, setNewLayoutName] = useState("");
  const [addLayoutAccordionOpen, setAddLayoutAccordionOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingLayoutId, setDeletingLayoutId] = useState<string | null>(null);

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

  const handleDelete = async (layoutId: string) => {
    if (!onDeleteLayout) return;
    
    const layout = layouts.find(l => l.id === layoutId);
    if (!layout) return;
    
    if (confirm(`Are you sure you want to delete the layout "${layout.name}"?`)) {
      try {
        setDeletingLayoutId(layoutId);
        await onDeleteLayout(layoutId);
      } catch (error) {
        console.error("Failed to delete layout:", error);
        alert("Failed to delete layout. Please try again.");
      } finally {
        setDeletingLayoutId(null);
      }
    }
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
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 shadow-xl border border-gray-700">
          <div className="p-6 pb-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Layout Manager
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-gray-400">
                Select an active layout or create a new one.
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Saved Layouts List */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">
                Saved Layouts
              </h3>
              {layouts.length > 0 ? (
                <ul className="space-y-2">
                  {layouts.map((layout) => (
                    <li
                      key={layout.id}
                      className="flex justify-between items-center p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                      <span className="font-medium text-white">
                        {layout.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(layout.id)}
                          disabled={deletingLayoutId === layout.id || layout.id === activeLayoutId}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={layout.id === activeLayoutId ? "Cannot delete active layout" : "Delete layout"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {layout.id === activeLayoutId ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-400">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            Active
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectLayout(layout.id);
                              onClose();
                            }}
                            disabled={loading}
                            className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-600"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
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
                className="w-full flex justify-between items-center text-left text-sm font-semibold text-white p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
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
                <div className="mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <label
                    htmlFor="new-layout-name"
                    className="block text-sm font-medium text-gray-300 mb-2"
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
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}

                  <p className="text-sm font-medium text-gray-300 mt-4 mb-2">
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

          <div className="p-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
