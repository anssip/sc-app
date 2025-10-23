import React from "react";
import { LayoutSelector } from "./LayoutSelector";
import AccountMenu from "./AccountMenu";
import PreviewTimer from "./PreviewTimer";
import { Bot, TrendingUp } from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import type { PanelLayout } from "./ChartPanel";
import type { Repository } from "~/services/repository";

interface AppToolbarProps {
  repository: Repository | null;
  currentLayout: PanelLayout | null;
  currentLayoutId: string | null;
  onLayoutChange: (layout: PanelLayout, layoutId?: string) => void;
  migrationStatus?: string | null;
  hasPreviewAccess?: boolean;
  previewStartTime?: number | null;
  onPreviewExpire?: () => void;
  showAIChat?: boolean;
  onToggleAIChat?: () => void;
  showBacktest?: boolean;
  onToggleBacktest?: () => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
  repository,
  currentLayout,
  currentLayoutId,
  onLayoutChange,
  migrationStatus,
  hasPreviewAccess,
  previewStartTime,
  onPreviewExpire,
  showAIChat,
  onToggleAIChat,
  showBacktest,
  onToggleBacktest,
}) => {
  return (
    <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 relative z-[300]">
      {/* Desktop Layout - Single Row */}
      <div className="hidden sm:block px-2 sm:px-4 py-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left side - Logo, AccountMenu, Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Logo */}
            <img
              src="/full-logo-accent-1.svg"
              alt="Spot Canvas"
              className="h-6 w-auto"
            />

            {/* Account Menu */}
            <AccountMenu />

            {migrationStatus && (
              <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800">
                {migrationStatus}
              </div>
            )}

            {/* Preview Timer for new users */}
            {hasPreviewAccess && previewStartTime && (
              <PreviewTimer
                previewStartTime={previewStartTime}
                onExpire={onPreviewExpire || (() => window.location.reload())}
              />
            )}
          </div>

          {/* Right side - AI Chat Toggle, Backtest, and Layout Selector */}
          <div className="flex items-center gap-2">
            {/* AI Chat Toggle - Show even if no callback for better visibility */}
            <ToolbarButton
              onClick={onToggleAIChat || (() => {})}
              active={showAIChat}
              title={
                showAIChat
                  ? "Close Spotlight"
                  : "Open Spotlight (Cmd/Ctrl + Shift + A)"
              }
            >
              <Bot className="w-4 h-4" />
            </ToolbarButton>

            {/* Backtest Toggle */}
            <ToolbarButton
              onClick={onToggleBacktest || (() => {})}
              active={showBacktest}
              title={
                showBacktest
                  ? "Close Backtesting"
                  : "Open Backtesting Panel"
              }
            >
              <TrendingUp className="w-4 h-4" />
            </ToolbarButton>

            {/* Layout Selector */}
            {currentLayout && (
              <LayoutSelector
                currentLayout={currentLayout}
                currentLayoutId={currentLayoutId}
                onLayoutChange={onLayoutChange}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Two Rows */}
      <div className="sm:hidden">
        {/* First Row - Icon Logo, Layout Selector (no label), Account Menu */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            {/* Icon-only Logo for mobile */}
            <img
              src="/icon-logo-white.svg"
              alt="Spot Canvas"
              className="h-7 w-7"
            />

            {/* Layout Selector - Mobile version without label */}
            {currentLayout && (
              <LayoutSelector
                currentLayout={currentLayout}
                currentLayoutId={currentLayoutId}
                onLayoutChange={onLayoutChange}
                className="flex-shrink-0"
                hideLabel={true}
              />
            )}
          </div>

          {/* Account Menu */}
          <AccountMenu />
        </div>

        {/* Second Row - Chart/Spotlight AI Toggle and Preview Timer */}
        <div className="flex items-center justify-center gap-3 px-3 pb-2">
          <div className="inline-flex rounded-lg bg-gray-800 p-0.5">
            <button
              onClick={() => onToggleAIChat && onToggleAIChat()}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !showAIChat
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => onToggleAIChat && onToggleAIChat()}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showAIChat
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Spotlight AI
            </button>
          </div>

          {/* Preview Timer for mobile */}
          {hasPreviewAccess && previewStartTime && (
            <PreviewTimer
              previewStartTime={previewStartTime}
              onExpire={onPreviewExpire || (() => window.location.reload())}
            />
          )}
        </div>

        {/* Migration info - shown below if present */}
        {migrationStatus && (
          <div className="flex items-center gap-2 px-3 pb-2 border-t border-gray-800 pt-2">
            <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
              {migrationStatus}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppToolbar;
