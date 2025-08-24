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
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
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
  onToggleFullscreen,
  isFullscreen,
}) => {
  return (
    <div className="flex items-center justify-end px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-10 overflow-visible">
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
      />
    </div>
  );
};
