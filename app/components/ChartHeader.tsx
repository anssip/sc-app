import React from "react";
import { ChartToolbar } from "./ChartToolbar";

interface ChartHeaderProps {
  chartId?: string;
  chartApiRef?: React.MutableRefObject<any>;
  isChangingSymbol?: boolean;
  isChangingGranularity?: boolean;
  onDelete?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  chartId,
  chartApiRef,
  isChangingSymbol,
  isChangingGranularity,
  onDelete,
  onSplitHorizontal,
  onSplitVertical,
}) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <ChartToolbar
        chartId={chartId}
        chartApiRef={chartApiRef}
        isChangingSymbol={isChangingSymbol}
        isChangingGranularity={isChangingGranularity}
        onDelete={onDelete}
        onSplitHorizontal={onSplitHorizontal}
        onSplitVertical={onSplitVertical}
      />
    </div>
  );
};
