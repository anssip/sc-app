import React from "react";
import { ChartToolbar } from "./ChartToolbar";
import { useChartSettings } from "~/contexts/ChartSettingsContext";
import type { Granularity } from "@anssip/rs-charts";

// Granularity options with proper labels (same as in ChartToolbar)
const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "ONE_MINUTE", label: "1m" },
  { value: "FIVE_MINUTE", label: "5m" },
  { value: "FIFTEEN_MINUTE", label: "15m" },
  { value: "THIRTY_MINUTE", label: "30m" },
  { value: "ONE_HOUR", label: "1h" },
  { value: "TWO_HOUR", label: "2h" },
  { value: "SIX_HOUR", label: "6h" },
  { value: "ONE_DAY", label: "1d" },
];

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
  // Get chart settings to display symbol and granularity
  const { settings } = useChartSettings(chartId);
  const granularityLabel = GRANULARITY_OPTIONS.find(
    (opt) => opt.value === settings.granularity
  )?.label || settings.granularity;

  return (
    <div
      className={`flex items-center justify-between px-4 relative z-[300] overflow-visible transition-all duration-200 ${
        isActive ? "bg-gray-800 py-2 border-b border-green-500/50" : "py-1"
      }`}
      onClick={isActive ? (e) => e.stopPropagation() : undefined}
    >
      {/* Content for inactive charts */}
      {!isActive && (
        <>
          <div className="text-sm text-gray-500 select-none">
            Click chart to activate
          </div>
          {/* Symbol and Granularity display - positioned to match toolbar */}
          <div className="flex items-center gap-1">
            <div className="text-sm text-gray-500 font-bold px-2 py-1">
              {settings.symbol}
            </div>
            <div className="text-sm text-gray-500 px-2 py-1">
              {granularityLabel}
            </div>
          </div>
        </>
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
