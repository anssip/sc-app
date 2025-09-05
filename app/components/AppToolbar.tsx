import React from 'react'
import { LayoutSelector } from './LayoutSelector'
import AccountMenu from './AccountMenu'
import PreviewTimer from './PreviewTimer'
import { Bot } from 'lucide-react'
import type { PanelLayout } from './ChartPanel'
import type { Repository } from '~/services/repository'

interface AppToolbarProps {
  repository: Repository | null
  currentLayout: PanelLayout | null
  currentLayoutId: string | null
  onLayoutChange: (layout: PanelLayout, layoutId?: string) => void
  migrationStatus?: string | null
  hasPreviewAccess?: boolean
  previewStartTime?: number | null
  onPreviewExpire?: () => void
  showAIChat?: boolean
  onToggleAIChat?: () => void
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
}) => {
  return (
    <div className="flex-shrink-0 px-2 sm:px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-[300]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Logo, AccountMenu, Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <img src="/full-logo-accent-1.svg" alt="Spot Canvas" className="h-6 w-auto" />

          {/* Account Menu */}
          <AccountMenu />

          {/* Status indicator light */}
          {repository && (
            <div
              className="flex items-center gap-2"
              title={repository.isOnline() ? 'Repository Online' : 'Repository Offline'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  repository.isOnline() ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {repository.isOnline() ? 'Online' : 'Offline'}
              </span>
            </div>
          )}

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

        {/* Right side - AI Chat Toggle and Layout Selector */}
        <div className="flex items-center gap-2">
          {/* AI Chat Toggle - Show even if no callback for better visibility */}
          <button
            onClick={onToggleAIChat || (() => console.log('AI Chat toggle not connected'))}
            className={`p-2 rounded-lg transition-colors ${
              showAIChat 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={showAIChat ? 'Close AI Assistant' : 'Open AI Assistant (Cmd/Ctrl + Shift + A)'}
            aria-label={showAIChat ? 'Close AI Assistant' : 'Open AI Assistant'}
          >
            <Bot className="w-5 h-5" />
          </button>

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
  )
}

export default AppToolbar