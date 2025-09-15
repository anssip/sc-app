import React from "react";
import { ChartToolbar } from "./ChartToolbar";

interface ChartHeaderProps {
  chartId?: string;
  chartApiRef?: React.MutableRefObject<any>;
  isChangingSymbol?: boolean;
  isChangingGranularity?: boolean;
  layoutId?: string;
  onDelete?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onOpenSymbolManager?: () => void;
  isTrendLineToolActive?: boolean;
  onToggleTrendLineTool?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  isActive?: boolean;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  chartId,
  chartApiRef,
  isChangingSymbol,
  isChangingGranularity,
  layoutId,
  onDelete,
  onSplitHorizontal,
  onSplitVertical,
  onOpenSymbolManager,
  isTrendLineToolActive,
  onToggleTrendLineTool,
  onToggleFullscreen,
  isFullscreen,
  isActive = false,
}) => {
  return (
    <div
      className={`flex items-center justify-between px-4 relative z-[300] overflow-visible transition-all duration-200 ${
        isActive ? "bg-gray-800 py-2 border-b border-green-500/50" : "py-1"
      }`}
      onClick={isActive ? (e) => e.stopPropagation() : undefined}
    >
      {/* Clickable area for inactive charts */}
      {!isActive && (
        <div className="flex-1 text-sm text-gray-500 select-none">
          Click chart to activate
        </div>
      )}

      {/* Toolbar for active charts */}
      {isActive && (
        <div className="flex-1 flex justify-end">
          <ChartToolbar
            chartId={chartId}
            chartApiRef={chartApiRef}
            isChangingSymbol={isChangingSymbol}
            isChangingGranularity={isChangingGranularity}
            layoutId={layoutId}
            onDelete={onDelete}
            onSplitHorizontal={onSplitHorizontal}
            onSplitVertical={onSplitVertical}
            onOpenSymbolManager={onOpenSymbolManager}
            onToggleFullscreen={onToggleFullscreen}
            isFullscreen={isFullscreen}
            isTrendLineToolActive={isTrendLineToolActive}
            onToggleTrendLineTool={onToggleTrendLineTool}
          />
        </div>
      )}
    </div>
  );
};
