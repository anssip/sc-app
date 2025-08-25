import React from 'react'
import { LayoutSelector } from './LayoutSelector'
import AccountMenu from './AccountMenu'
import PreviewTimer from './PreviewTimer'
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

        {/* Right side - Layout Selector */}
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
  )
}

export default AppToolbar