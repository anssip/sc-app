import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChartPanel } from "./ChartPanel";
import { LayoutSelector } from "./LayoutSelector";
import { useRepository, useLayouts } from "~/hooks/useRepository";
import { useAuth } from "~/lib/auth-context";
import {
  autoMigrateLegacyLayout,
  hasLayoutToMigrate,
} from "~/utils/layoutMigration";
import { convertFromChartPanelLayout } from "~/utils/layoutConverter";
import type { PanelLayout } from "./ChartPanel";
import type { ChartConfig, SavedLayout } from "~/types";

interface ChartAppProps {
  className?: string;
  initialLayout?: PanelLayout;
}

export const ChartApp: React.FC<ChartAppProps> = ({
  className = "",
  initialLayout,
}) => {
  const { repository, isLoading, error } = useRepository();
  const { updateLayout } = useLayouts();
  const { user } = useAuth();
  const [currentLayout, setCurrentLayout] = useState<PanelLayout | null>(
    initialLayout || null
  );
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create default layout if none exists
  const createDefaultLayout = (): PanelLayout => ({
    id: "default",
    type: "chart",
    chart: {
      id: "default-chart",
      symbol: "BTC-USD",
      granularity: "ONE_HOUR",
      indicators: [],
    },
    defaultSize: 100,
    minSize: 20,
  });

  // Initialize with default layout (migration temporarily disabled)
  useEffect(() => {
    console.log("ChartApp: Layout initialization effect", {
      isLoading,
      hasCurrentLayout: !!currentLayout,
      hasRepository: !!repository,
      userEmail: user?.email,
    });

    if (!isLoading && !currentLayout) {
      console.log("ChartApp: Creating default layout");
      setCurrentLayout(createDefaultLayout());
    }
  }, [currentLayout, repository, user?.email, isLoading]);

  // Auto-save function
  const autoSaveLayout = useCallback(async () => {
    if (!currentLayout || !currentLayoutId || !repository) return;

    try {
      console.log("Auto-saving layout...");
      const charts = new Map<string, ChartConfig>();
      const repositoryLayout = convertFromChartPanelLayout(
        currentLayout,
        charts
      );

      await updateLayout(currentLayoutId, {
        layout: repositoryLayout,
        updatedAt: new Date(),
      });

      console.log("Layout auto-saved successfully");
    } catch (error) {
      console.error("Failed to auto-save layout:", error);
    }
  }, [currentLayout, currentLayoutId, repository, updateLayout]);

  // Handle layout changes from ChartPanel with auto-save
  const handleLayoutChange = useCallback(
    (layout: PanelLayout) => {
      setCurrentLayout(layout);

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      if (currentLayoutId) {
        autoSaveTimeoutRef.current = setTimeout(() => {
          autoSaveLayout();
        }, 1000); // Auto-save 1 second after resize stops
      }
    },
    [currentLayoutId, autoSaveLayout]
  );

  // Handle layout selection from LayoutSelector
  const handleLayoutSelection = useCallback(
    (layout: PanelLayout, layoutId?: string) => {
      setCurrentLayout(layout);
      setCurrentLayoutId(layoutId || null);
    },
    []
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">
            Loading chart application...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
            Failed to load chart application
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!currentLayout) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No layout available
          </p>
          <button
            onClick={() => setCurrentLayout(createDefaultLayout())}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Default Layout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with Layout Controls */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chart Dashboard
            </h1>
            {repository && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Repository: {repository.isOnline() ? "Online" : "Offline"}
              </div>
            )}
            {migrationStatus && (
              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                {migrationStatus}
              </div>
            )}
          </div>

          <LayoutSelector
            currentLayout={currentLayout}
            onLayoutChange={handleLayoutSelection}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* Chart Panel */}
      <div className="flex-1 relative">
        <ChartPanel
          layout={currentLayout}
          layoutId={currentLayoutId || undefined}
          onLayoutChange={handleLayoutChange}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default ChartApp;
