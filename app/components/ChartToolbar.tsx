import React from "react";
import type { Granularity } from "@anssipiirainen/sc-charts";

interface ChartToolbarProps {
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

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
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
    <div className="flex items-center justify-between">
      {/* Left side - Symbol and Granularity selectors */}
      <div className="flex items-center gap-2">
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          disabled={isChangingSymbol}
          className={`text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
            isChangingSymbol ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="BTC-USD">BTC-USD</option>
          <option value="ETH-USD">ETH-USD</option>
          <option value="ADA-USD">ADA-USD</option>
          <option value="DOGE-USD">DOGE-USD</option>
          <option value="SOL-USD">SOL-USD</option>
        </select>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <select
          value={granularity}
          onChange={(e) => onGranularityChange(e.target.value as Granularity)}
          disabled={isChangingGranularity}
          className={`text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
            isChangingGranularity ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="ONE_MINUTE">1m</option>
          <option value="FIVE_MINUTE">5m</option>
          <option value="FIFTEEN_MINUTE">15m</option>
          <option value="THIRTY_MINUTE">30m</option>
          <option value="ONE_HOUR">1h</option>
          <option value="TWO_HOUR">2h</option>
          <option value="SIX_HOUR">6h</option>
          <option value="ONE_DAY">1d</option>
        </select>
        {(isChangingSymbol || isChangingGranularity) && (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-1">
        {/* Split buttons */}
        <button
          onClick={onSplitHorizontal}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded"
          title="Split horizontally"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <button
          onClick={onSplitVertical}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded"
          title="Split vertically"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded ml-1"
            title="Delete chart"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
