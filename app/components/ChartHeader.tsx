import React from "react";
import { ChartToolbar } from "./ChartToolbar";
import type { Granularity } from "@anssipiirainen/sc-charts";

interface ChartHeaderProps {
  symbol: string;
  granularity: Granularity;
  isChangingSymbol: boolean;
  isChangingGranularity: boolean;
  onSymbolChange: (symbol: string) => void;
  onGranularityChange: (granularity: Granularity) => void;
  onDelete?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  symbol,
  granularity,
  isChangingSymbol,
  isChangingGranularity,
  onSymbolChange,
  onGranularityChange,
  onDelete,
  onSplitHorizontal,
  onSplitVertical,
}) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <ChartToolbar
        symbol={symbol}
        granularity={granularity}
        isChangingSymbol={isChangingSymbol}
        isChangingGranularity={isChangingGranularity}
        onSymbolChange={onSymbolChange}
        onGranularityChange={onGranularityChange}
        onDelete={onDelete}
        onSplitHorizontal={onSplitHorizontal}
        onSplitVertical={onSplitVertical}
      />
    </div>
  );
};
