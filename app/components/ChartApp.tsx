import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChartPanel } from "./ChartPanel";
import { LayoutSelector } from "./LayoutSelector";
import AccountMenu from "./AccountMenu";
import {
  useRepository,
  useLayouts,
  useUserSettings,
} from "~/hooks/useRepository";
import type { Repository } from "~/services/repository";
import { useAuth } from "~/lib/auth-context";
import { useSubscription } from "~/contexts/SubscriptionContext";
import {
  autoMigrateLegacyLayout,
  hasLayoutToMigrate,
} from "~/utils/layoutMigration";
import {
  convertFromChartPanelLayout,
  convertToChartPanelLayout,
} from "~/utils/layoutConverter";
import type { PanelLayout } from "./ChartPanel";
import type { ChartConfig, SavedLayout } from "~/types";

type LayoutChangeType = "chart-data" | "structure" | "unknown";

/**
 * Recursively loads all chart configurations referenced in a layout
 */
async function loadChartsForLayout(
  layoutNode: any,
  charts: Map<string, ChartConfig>,
  repository: Repository,
  layoutId?: string
): Promise<void> {
  if (layoutNode.type === "chart") {
    const chartId = layoutNode.chartId || layoutNode.id;
    if (chartId && !charts.has(chartId)) {
      try {
        const chartConfig = await repository.getChart(chartId, layoutId);
        if (chartConfig) {
          charts.set(chartId, chartConfig);
        }
      } catch (error) {
        console.error(`Failed to load chart ${chartId}:`, error);
      }
    }
  } else if (layoutNode.children && Array.isArray(layoutNode.children)) {
    // Recursively load charts from children
    await Promise.all(
      layoutNode.children.map((child: any) =>
        loadChartsForLayout(child, charts, repository, layoutId)
      )
    );
  }
}

interface ChartAppProps {
  className?: string;
  initialLayout?: PanelLayout;
}

export const ChartApp: React.FC<ChartAppProps> = ({
  className = "",
  initialLayout,
}) => {
  const { repository, isLoading: repoLoading, error } = useRepository();
  const { layouts, updateLayout, isLoading: layoutsLoading } = useLayouts();
  const {
    settings,
    setActiveLayout,
    isLoading: settingsLoading,
  } = useUserSettings();
  const { user } = useAuth();
  const { status: subscriptionStatus, isLoading: subscriptionLoading } =
    useSubscription();
  const [currentLayout, setCurrentLayout] = useState<PanelLayout | null>(
    initialLayout || null
  );
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastChangeTypeRef = useRef<LayoutChangeType>("unknown");
  const isChartDataUpdateRef = useRef(false);

  // Create default single chart layout for unsaved/new users
  // Users must create and save a layout to access multi-panel layouts
  const createDefaultLayout = (): PanelLayout => ({
    id: "default-single",
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

  // Single effect to handle all layout initialization logic
  useEffect(() => {
    const isLoading = repoLoading || layoutsLoading || settingsLoading;

    // Don't initialize if still loading or already initialized
    if (isLoading || !repository || isInitialized) {
      return;
    }

    // If we already have a layout from props, mark as initialized
    if (currentLayout && initialLayout) {
      setIsInitialized(true);
      return;
    }

    // Try to load active layout from user settings
    if (settings?.activeLayoutId) {
      const activeLayout = layouts.find(
        (l) => l.id === settings.activeLayoutId
      );

      if (activeLayout) {
        const loadActiveLayout = async () => {
          try {
            // Load all charts referenced in the layout
            const charts = new Map<string, ChartConfig>();
            await loadChartsForLayout(
              activeLayout.layout,
              charts,
              repository,
              activeLayout.id
            );

            const panelLayout = convertToChartPanelLayout(
              activeLayout.layout,
              charts
            );
            setCurrentLayout(panelLayout);
            setCurrentLayoutId(activeLayout.id);
            setIsInitialized(true);
          } catch (error) {
            console.error("Error loading active layout:", error);
            // Clear the invalid active layout ID
            setActiveLayout(null).catch(console.error);
          }
        };

        loadActiveLayout();
        return;
      } else if (layouts.length > 0) {
        // We have layouts loaded but the active one isn't found

        // Clear the invalid active layout ID
        setActiveLayout(null).catch(console.error);
      } else {
        // No layouts loaded yet, but we have an activeLayoutId - wait for layouts

        return;
      }
    }

    // Fallback to default single chart layout

    setCurrentLayout(createDefaultLayout());
    setCurrentLayoutId(null);
    setIsInitialized(true);
  }, [
    repoLoading,
    layoutsLoading,
    settingsLoading,
    repository,
    settings,
    layouts,
    currentLayout,
    initialLayout,
    isInitialized,
    user?.email,
    setActiveLayout,
  ]);

  // Auto-save function
  const autoSaveLayout = useCallback(async () => {
    if (!currentLayout || !currentLayoutId || !repository) return;

    try {
      const charts = new Map<string, ChartConfig>();
      const repositoryLayout = convertFromChartPanelLayout(
        currentLayout,
        charts
      );

      await updateLayout(currentLayoutId, {
        layout: repositoryLayout,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [currentLayout, currentLayoutId, repository, updateLayout]);

  // Handle layout changes from ChartPanel with auto-save
  const handleLayoutChange = useCallback(
    (layout: PanelLayout, changeType: LayoutChangeType = "unknown") => {
      console.log("ChartApp: handleLayoutChange called", {
        changeType,
        currentLayoutId,
        hasLayout: !!layout,
      });

      setCurrentLayout(layout);

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        console.log("ChartApp: Cleared existing auto-save timeout");
      }

      // Only auto-save for structural changes (panel resizes, splits)
      // Chart data changes are handled by ChartContainer
      if (currentLayoutId && changeType === "structure") {
        console.log(
          "ChartApp: Setting auto-save timeout for structural change"
        );
        autoSaveTimeoutRef.current = setTimeout(() => {
          console.log("ChartApp: Auto-save timeout triggered");
          autoSaveLayout();
        }, 1000); // Auto-save 1 second after resize stops
      } else {
        console.log("ChartApp: Auto-save not triggered", {
          reason: !currentLayoutId
            ? "No currentLayoutId"
            : changeType !== "structure"
            ? "Not structure change"
            : "Other",
        });
      }
    },
    [currentLayoutId, autoSaveLayout]
  );

  // Handle layout selection from LayoutSelector
  const handleLayoutSelection = useCallback(
    async (layout: PanelLayout, layoutId?: string) => {
      setCurrentLayout(layout);
      setCurrentLayoutId(layoutId || null);

      // If switching to an unsaved layout (no layoutId), clear active layout
      if (!layoutId) {
        try {
          await setActiveLayout(null);
        } catch (error) {}
      }
      // Note: Setting active layout when selecting a saved layout is handled in LayoutSelector
    },
    [setActiveLayout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Detect if iOS
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Detect if running as PWA (standalone mode)
  const isPWA = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }, []);

  // Detect if iPhone specifically (not iPad)
  const isIPhone = useCallback(() => {
    return /iPhone/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (isIOS()) {
      // Simplified iOS approach
      if (!isFullscreen) {
        // Enter "fullscreen" mode on iOS
        setIsFullscreen(true);
        
        // Hide the header
        const header = document.querySelector('.flex-shrink-0.px-4.py-2.bg-gray-900');
        if (header) {
          (header as HTMLElement).style.display = 'none';
        }
        
        // Also hide the PWA spacer if present
        const pwaSpcer = document.querySelector('.flex-shrink-0.h-11.bg-gray-900');
        if (pwaSpcer) {
          (pwaSpcer as HTMLElement).style.display = 'none';
        }
        
        // Scroll to hide address bar
        window.scrollTo(0, 1);
        
        // Trigger resize for chart to recalculate
        window.dispatchEvent(new Event('resize'));
      } else {
        // Exit "fullscreen" mode on iOS
        setIsFullscreen(false);
        
        // Show the header again
        const header = document.querySelector('.flex-shrink-0.px-4.py-2.bg-gray-900');
        if (header) {
          (header as HTMLElement).style.display = '';
        }
        
        // Also show the PWA spacer if it should be present
        const pwaSpcer = document.querySelector('.flex-shrink-0.h-11.bg-gray-900');
        if (pwaSpcer) {
          (pwaSpcer as HTMLElement).style.display = '';
        }
        
        // Scroll back to top
        window.scrollTo(0, 0);
        
        // Trigger resize for chart to recalculate
        window.dispatchEvent(new Event('resize'));
      }
    } else {
      // Standard Fullscreen API for non-iOS devices
      if (!document.fullscreenElement) {
        // Request fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          // Safari/old WebKit
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          // IE11
          (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          // Safari/old WebKit
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          // IE11
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen, isIOS]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  if (repoLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Loading layout...
          </p>
        </div>
      </div>
    );
  }

  // Calculate if trial has expired
  const { trialEndsAt } = useSubscription();
  const isTrialExpired =
    subscriptionStatus === "trialing" &&
    trialEndsAt &&
    new Date(trialEndsAt) <= new Date();

  // User has access if they have an active subscription or are in a valid trial period
  const hasActiveSubscription =
    subscriptionStatus === "active" ||
    (subscriptionStatus === "trialing" && !isTrialExpired);

  return (
    <div className={`flex flex-col h-full bg-black ${className}`}>
      {/* PWA Header Spacer for iPhone - pushes content below the notch */}
      {isIPhone() && isPWA() && !isFullscreen && (
        <div className="flex-shrink-0 h-11 bg-gray-900" />
      )}
      
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left side - Logo, AccountMenu, Status */}
          <div className="flex items-center gap-4">
            {/* Logo - responsive */}
            <picture>
              <source
                media="(min-width: 640px)"
                srcSet="/logo/full/green.svg"
              />
              <img
                src="/logo/icon/green.svg"
                alt="Spot Canvas"
                className="h-6 w-auto"
              />
            </picture>

            {/* Account Menu */}
            <AccountMenu />

            {/* Status indicator light */}
            {repository && (
              <div
                className="flex items-center gap-2"
                title={
                  repository.isOnline()
                    ? "Repository Online"
                    : "Repository Offline"
                }
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    repository.isOnline() ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {repository.isOnline() ? "Online" : "Offline"}
                </span>
              </div>
            )}

            {migrationStatus && (
              <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800">
                {migrationStatus}
              </div>
            )}
          </div>

          {/* Right side - Fullscreen toggle and Layout Selector */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>

            {/* Layout Selector */}
            <LayoutSelector
              currentLayout={currentLayout}
              currentLayoutId={currentLayoutId}
              onLayoutChange={handleLayoutSelection}
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Chart Panel */}
      <div className="flex-1 relative bg-black">
        <ChartPanel
          layout={currentLayout}
          layoutId={currentLayoutId || undefined}
          onLayoutChange={handleLayoutChange}
          className="h-full"
        />
        
        {/* Floating exit button for iOS when in fullscreen */}
        {isIOS() && isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 left-4 z-[100] p-2 bg-gray-800 bg-opacity-90 text-white rounded-lg shadow-lg hover:bg-gray-700"
            aria-label="Exit fullscreen"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            </svg>
          </button>
        )}

        {/* Subscription Overlay - dims charts and blocks interaction when no subscription */}
        {!subscriptionLoading && !hasActiveSubscription && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center p-8 bg-gray-900/90 rounded-lg border border-gray-700 max-w-md">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-white mb-3">
                Subscription Required
              </h2>
              <p className="text-gray-400 mb-6">
                To access live charts and trading features, please subscribe to
                one of our plans.
              </p>
              <a
                href="/pricing"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Pricing Plans
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartApp;
