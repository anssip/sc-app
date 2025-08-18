import React, { useState } from 'react';
import { useLayouts } from '~/hooks/useRepository';
import { useSubscription } from '~/contexts/SubscriptionContext';
import { convertToChartPanelLayout, convertFromChartPanelLayout } from '~/utils/layoutConverter';
import { ChartPanel } from './ChartPanel';
import { UpgradePrompt } from './UpgradePrompt';
import type { PanelLayout } from './ChartPanel';
import type { SavedLayout, ChartConfig } from '~/types';

interface LayoutManagerProps {
  className?: string;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({ className = '' }) => {
  const { layouts, isLoading, error, saveLayout, deleteLayout, getLayout } = useLayouts();
  const { status, plan, canAddMoreLayouts, getLayoutLimit } = useSubscription();
  const [currentLayout, setCurrentLayout] = useState<PanelLayout | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Handle layout changes from ChartPanel
  const handleLayoutChange = (layout: PanelLayout) => {
    setCurrentLayout(layout);
  };

  // Save current layout
  const handleSaveLayout = async () => {
    if (!currentLayout || !layoutName.trim()) {
      setSaveError('Please enter a layout name');
      return;
    }

    // Check if user can add more layouts
    if (!canAddMoreLayouts(layouts.length)) {
      setSaveModalOpen(false);
      setShowUpgradePrompt(true);
      return;
    }

    try {
      setSaveError(null);

      // Convert ChartPanel layout to repository format
      const charts = new Map<string, ChartConfig>();
      const repositoryLayout = convertFromChartPanelLayout(currentLayout, charts);

      // Save layout and charts
      const layoutData = {
        name: layoutName.trim(),
        userId: '', // This will be set by the repository
        layout: repositoryLayout,
      };

      await saveLayout(layoutData);

      // Save individual charts
      for (const [, chart] of charts) {
        // Note: In a real implementation, you'd also save charts to the repository
        console.log('Chart to save:', chart);
      }

      setSaveModalOpen(false);
      setLayoutName('');
      console.log('Layout saved successfully');
    } catch (err) {
      console.error('Failed to save layout:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save layout');
    }
  };

  // Load a saved layout
  const handleLoadLayout = async (layoutId: string) => {
    try {
      const savedLayout = getLayout(layoutId);
      if (!savedLayout) {
        console.error('Layout not found');
        return;
      }

      // Convert repository layout to ChartPanel format
      const charts = new Map<string, ChartConfig>();
      // In a real implementation, you'd load charts from the repository here
      const panelLayout = convertToChartPanelLayout(savedLayout.layout, charts);

      setCurrentLayout(panelLayout);
      console.log('Layout loaded successfully');
    } catch (err) {
      console.error('Failed to load layout:', err);
    }
  };

  // Delete a saved layout
  const handleDeleteLayout = async (layoutId: string) => {
    if (window.confirm('Are you sure you want to delete this layout?')) {
      try {
        await deleteLayout(layoutId);
        console.log('Layout deleted successfully');
      } catch (err) {
        console.error('Failed to delete layout:', err);
      }
    }
  };

  // Create default layout if none exists
  const createDefaultLayout = () => {
    const defaultLayout: PanelLayout = {
      id: 'default',
      type: 'chart',
      chart: {
        id: 'default-chart',
        symbol: 'BTC-USD',
        granularity: 'ONE_HOUR',
        indicators: [],
      },
      defaultSize: 100,
      minSize: 20,
    };
    setCurrentLayout(defaultLayout);
  };

  // Initialize with default layout if no current layout
  React.useEffect(() => {
    if (!currentLayout) {
      createDefaultLayout();
    }
  }, [currentLayout]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading layouts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-red-600 text-center">
          <p className="font-semibold">Error loading layouts</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Layout Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chart Layout Manager
          </h2>

          {/* Saved Layouts Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => e.target.value && handleLoadLayout(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value=""
            >
              <option value="">Load Saved Layout...</option>
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Layout Button */}
          <button
            onClick={() => {
              // Check if user can add more layouts before opening modal
              if (!canAddMoreLayouts(layouts.length)) {
                setShowUpgradePrompt(true);
              } else {
                setSaveModalOpen(true);
              }
            }}
            disabled={!currentLayout}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Layout
          </button>

          {/* Reset to Default Button */}
          <button
            onClick={createDefaultLayout}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Saved Layouts List */}
      {layouts.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Saved Layouts ({layouts.length}
            {getLayoutLimit() !== null && ` / ${getLayoutLimit()}`})
            {status === 'active' && plan === 'starter' && layouts.length >= 2 && (
              <span className="ml-2 text-xs text-orange-500">Limit reached</span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <button
                  onClick={() => handleLoadLayout(layout.id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {layout.name}
                </button>
                <button
                  onClick={() => handleDeleteLayout(layout.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  title="Delete layout"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Panel */}
      <div className="flex-1">
        {currentLayout ? (
          <ChartPanel
            layout={currentLayout}
            onLayoutChange={handleLayoutChange}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No layout selected</p>
              <button
                onClick={createDefaultLayout}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Default Layout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Layout Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Layout
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Layout Name
              </label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter layout name..."
                autoFocus
              />
            </div>

            {saveError && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setLayoutName('');
                  setSaveError(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt 
          feature="layouts" 
          onClose={() => setShowUpgradePrompt(false)} 
        />
      )}
    </div>
  );
};

export default LayoutManager;
