import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChartPanel } from "./ChartPanel";
import { AppToolbar } from "./AppToolbar";
import PWAInstallBanner from "./PWAInstallBanner";
import { AIChatPanel } from "./AIChatPanel";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
import { ActiveChartProvider } from "~/contexts/ActiveChartContext";
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
  const [showAIChat, setShowAIChat] = useState(false);
  const [chartApi, setChartApi] = useState<any>(null);
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

  // Keyboard shortcut for AI Chat (Cmd/Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        handleToggleAIChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Single effect to handle all layout initialization logic
  useEffect(() => {
    // Check if user is in anonymous preview mode (no user)
    const isAnonymousPreview = !user && subscriptionStatus === "none" && !subscriptionLoading;
    
    // For anonymous preview, immediately use default layout without waiting for repository
    if (isAnonymousPreview && !isInitialized) {
      console.log("Anonymous preview mode - using default layout");
      const defaultLayout = createDefaultLayout();
      setCurrentLayout(defaultLayout);
      setCurrentLayoutId(null);
      // Default: show AI assistant for single-chart layouts
      setShowAIChat(defaultLayout.type === 'chart');
      setIsInitialized(true);
      return;
    }
    
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

            // Set AI assistant visibility from saved state or use defaults
            if (activeLayout.showAIAssistant !== undefined) {
              setShowAIChat(activeLayout.showAIAssistant);
            } else {
              // Default: show for single-chart layouts, hide for multi-chart
              setShowAIChat(activeLayout.layout.type === 'chart');
            }

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
    const defaultLayout = createDefaultLayout();
    setCurrentLayout(defaultLayout);
    setCurrentLayoutId(null);
    // Default: show AI assistant for single-chart layouts
    setShowAIChat(defaultLayout.type === 'chart');
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
    user,
    subscriptionStatus,
    subscriptionLoading,
    setActiveLayout,
  ]);

  // Auto-save function
  const autoSaveLayout = useCallback(async () => {
    // Don't auto-save for anonymous users or when no repository/layoutId
    if (!currentLayout || !currentLayoutId || !repository || !user) return;

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
  }, [currentLayout, currentLayoutId, repository, updateLayout, user]);

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

      // Only auto-save for structural changes (panel resizes, splits) and only for authenticated users
      // Chart data changes are handled by ChartContainer
      if (currentLayoutId && changeType === "structure" && user) {
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
            : !user
            ? "No authenticated user"
            : changeType !== "structure"
            ? "Not structure change"
            : "Other",
        });
      }
    },
    [currentLayoutId, autoSaveLayout, user]
  );

  // Handle AI assistant toggle and save state
  const handleToggleAIChat = useCallback(async () => {
    const newState = !showAIChat;
    setShowAIChat(newState);

    // Save the new state to Firestore if we have a saved layout
    if (currentLayoutId && user) {
      try {
        await updateLayout(currentLayoutId, {
          showAIAssistant: newState
        });
      } catch (error) {
        console.error("Failed to save AI assistant state:", error);
      }
    }
  }, [showAIChat, currentLayoutId, user, updateLayout]);

  // Handle layout selection from LayoutSelector
  const handleLayoutSelection = useCallback(
    async (layout: PanelLayout, layoutId?: string) => {
      setCurrentLayout(layout);
      setCurrentLayoutId(layoutId || null);

      // If switching to a saved layout, load AI assistant state
      if (layoutId && layouts) {
        const savedLayout = layouts.find(l => l.id === layoutId);
        if (savedLayout) {
          // Set AI assistant visibility from saved state or use defaults
          if (savedLayout.showAIAssistant !== undefined) {
            setShowAIChat(savedLayout.showAIAssistant);
          } else {
            // Default: show for single-chart layouts, hide for multi-chart
            setShowAIChat(savedLayout.layout.type === 'chart');
          }
        }
      } else if (!layoutId) {
        // For unsaved layouts, use default based on layout type
        setShowAIChat(layout.type === 'chart');

        // Clear active layout
        try {
          await setActiveLayout(null);
        } catch (error) {}
      }
      // Note: Setting active layout when selecting a saved layout is handled in LayoutSelector
    },
    [setActiveLayout, layouts]
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

  // Detect if mobile device
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
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
  const { trialEndsAt, isPreviewExpired, previewStartTime } = useSubscription();
  const isTrialExpired =
    subscriptionStatus === "trialing" &&
    trialEndsAt &&
    new Date(trialEndsAt) <= new Date();

  // User has access if they have an active subscription, are in a valid trial period, or are a new user in preview
  const hasActiveSubscription =
    subscriptionStatus === "active" ||
    (subscriptionStatus === "trialing" && !isTrialExpired);
  
  // New users (status === 'none') get 5-minute preview access
  const hasPreviewAccess = subscriptionStatus === "none" && !isPreviewExpired;
  
  // Show subscription overlay if no active subscription and preview has expired (or for canceled/expired trials)
  const shouldShowSubscriptionOverlay = !subscriptionLoading && !hasActiveSubscription && !hasPreviewAccess;
  
  // Calculate time remaining for preview users
  const getPreviewTimeRemaining = () => {
    if (!previewStartTime || subscriptionStatus !== "none") return null;
    const elapsedMs = Date.now() - previewStartTime;
    const remainingMs = Math.max(0, (5 * 60 * 1000) - elapsedMs);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return { minutes, seconds, remainingMs };
  };

  return (
    <ActiveChartProvider>
      <div className={`flex flex-col h-full bg-black overflow-hidden ${className}`}>
          {/* PWA Header Spacer for iPhone - pushes content below the notch */}
          {isIPhone() && isPWA() && (
          <div className="flex-shrink-0 h-11 bg-gray-900" />
        )}

        {/* PWA Install Banner - shows only once for mobile users */}
        <PWAInstallBanner />
        <AppToolbar
          repository={repository}
          currentLayout={currentLayout}
          currentLayoutId={currentLayoutId}
          onLayoutChange={handleLayoutSelection}
          migrationStatus={migrationStatus}
          hasPreviewAccess={hasPreviewAccess}
          previewStartTime={previewStartTime}
          onPreviewExpire={() => window.location.reload()}
          showAIChat={showAIChat}
          onToggleAIChat={handleToggleAIChat}
        />

        {/* Chart Panel with AI Chat */}
        <div className={`flex-1 min-h-0 relative bg-black ${isMobile() ? 'pb-5' : ''}`}>
          <PanelGroup direction="horizontal" className="h-full">
            {/* Main Chart Panel */}
            <Panel>
              <ChartPanel
                layout={currentLayout}
                layoutId={currentLayoutId || undefined}
                onLayoutChange={handleLayoutChange}
                className="h-full"
                onChartApiReady={setChartApi}
              />
            </Panel>

            {/* AI Chat Panel */}
            {showAIChat && (
              <>
                <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-gray-700 transition-colors" />
                <Panel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full overflow-hidden">
                    <AIChatPanel
                      onClose={() => setShowAIChat(false)}
                      chartApi={chartApi}
                    />
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>

        {/* Subscription Overlay - dims charts and blocks interaction when no subscription */}
        {shouldShowSubscriptionOverlay && (
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
                {subscriptionStatus === "none" && isPreviewExpired
                  ? "Your 5-minute preview has ended. Subscribe to continue using Spot Canvas with unlimited access."
                  : subscriptionStatus === "canceled"
                  ? "Your subscription has been canceled. Please resubscribe to continue using Spot Canvas."
                  : isTrialExpired
                  ? "Your trial has ended. Choose a plan to continue using Spot Canvas."
                  : "To access live charts and trading features, please subscribe to one of our plans."}
              </p>
              <a
                href="/pricing"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {subscriptionStatus === "none" && isPreviewExpired
                  ? "Start Free Trial"
                  : "View Pricing Plans"}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
    </ActiveChartProvider>
  );
};

export default ChartApp;
