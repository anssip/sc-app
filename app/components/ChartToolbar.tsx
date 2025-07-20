import React, { useRef } from "react";
import { useSymbols } from "~/hooks/useRepository";
import { useChartSettings } from "~/contexts/ChartSettingsContext";
import type { Granularity } from "@anssipiirainen/sc-charts";

interface ChartToolbarProps {
  chartId?: string;
  chartApiRef?: React.MutableRefObject<any>;
  isChangingSymbol?: boolean;
  isChangingGranularity?: boolean;
  onDelete?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
}

// Granularity options with proper labels
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

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  chartId,
  chartApiRef,
  isChangingSymbol = false,
  isChangingGranularity = false,
  onDelete,
  onSplitHorizontal,
  onSplitVertical,
}) => {
  const {
    activeSymbols,
    isLoading: symbolsLoading,
    error: symbolsError,
  } = useSymbols();

  // Use chart settings context (read-only for UI display)
  const { settings } = useChartSettings(chartId);

  // Fallback symbols if repository fails to load
  const fallbackSymbols = [
    {
      id: "BTC-USD",
      symbol: "BTC-USD",
      baseAsset: "BTC",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "ETH-USD",
      symbol: "ETH-USD",
      baseAsset: "ETH",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "ADA-USD",
      symbol: "ADA-USD",
      baseAsset: "ADA",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "DOGE-USD",
      symbol: "DOGE-USD",
      baseAsset: "DOGE",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "SOL-USD",
      symbol: "SOL-USD",
      baseAsset: "SOL",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "AVAX-USD",
      symbol: "AVAX-USD",
      baseAsset: "AVAX",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "MATIC-USD",
      symbol: "MATIC-USD",
      baseAsset: "MATIC",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "DOT-USD",
      symbol: "DOT-USD",
      baseAsset: "DOT",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "LINK-USD",
      symbol: "LINK-USD",
      baseAsset: "LINK",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
    {
      id: "UNI-USD",
      symbol: "UNI-USD",
      baseAsset: "UNI",
      quoteAsset: "USD",
      exchangeId: "coinbase",
      active: true,
    },
  ];

  // Filter symbols to get most popular trading pairs
  const popularSymbols =
    activeSymbols.length > 0
      ? activeSymbols
          .filter((s) => s.exchangeId === "coinbase")
          .filter((s) => s.quoteAsset === "USD")
          .sort((a, b) => {
            // Sort by popularity (BTC, ETH first, then alphabetically)
            const popularOrder = [
              "BTC-USD",
              "ETH-USD",
              "ADA-USD",
              "DOGE-USD",
              "SOL-USD",
            ];
            const aIndex = popularOrder.indexOf(a.symbol);
            const bIndex = popularOrder.indexOf(b.symbol);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            return a.symbol.localeCompare(b.symbol);
          })
          .slice(0, 50) // Limit to top 50 symbols for performance
      : fallbackSymbols; // Use fallback if no symbols loaded

  return (
    <div className="flex items-center justify-between">
      {/* Left side - Symbol and Granularity selectors */}
      <div className="flex items-center gap-2">
        <select
          value={settings.symbol}
          onChange={(e) => {
            // Call Chart API directly instead of context
            if (chartApiRef?.current?.setSymbol) {
              chartApiRef.current.setSymbol(e.target.value);
            }
          }}
          disabled={isChangingSymbol || symbolsLoading}
          className={`text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
            isChangingSymbol || symbolsLoading
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {symbolsLoading ? (
            <option value={settings.symbol}>Loading symbols...</option>
          ) : symbolsError ? (
            <option value={settings.symbol}>Error loading symbols</option>
          ) : (
            <>
              {/* Current symbol if not in popular list */}
              {!popularSymbols.find((s) => s.symbol === settings.symbol) && (
                <option value={settings.symbol}>{settings.symbol}</option>
              )}

              {/* Popular symbols */}
              {popularSymbols.map((s, index) => (
                <option key={s.id} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </>
          )}
        </select>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        <select
          value={settings.granularity}
          onChange={(e) => {
            // Call Chart API directly instead of context
            if (chartApiRef?.current?.setGranularity) {
              chartApiRef.current.setGranularity(e.target.value as Granularity);
            }
          }}
          disabled={isChangingGranularity}
          className={`text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
            isChangingGranularity ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {GRANULARITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Status indicators */}
        {symbolsError && (
          <div
            className="text-red-500 text-xs"
            title={`Symbol loading error: ${symbolsError}`}
          >
            ⚠️
          </div>
        )}
        {(isChangingSymbol || isChangingGranularity || symbolsLoading) && (
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
