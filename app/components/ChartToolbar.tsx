import React, { useRef, useState, useEffect } from "react";
import { useSymbols } from "~/hooks/useRepository";
import { useChartSettings } from "~/contexts/ChartSettingsContext";
import { useIndicators } from "~/hooks/useIndicators";
import { db } from "~/lib/firebase";
import type { Granularity } from "@anssipiirainen/sc-charts";
import type { IndicatorConfig } from "~/contexts/ChartSettingsContext";

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

  // Load indicators from Firestore
  const {
    indicators: availableIndicators,
    isLoading: indicatorsLoading,
    error: indicatorsError,
  } = useIndicators(db);

  // State for indicator dropdown
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);

  // Handle Esc key to close indicators menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isIndicatorDropdownOpen) {
        setIsIndicatorDropdownOpen(false);
      }
    };

    if (isIndicatorDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isIndicatorDropdownOpen]);

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
      <div className="flex items-center gap-3">
        <select
          value={settings.symbol}
          onChange={(e) => {
            // Call Chart API directly instead of context
            if (chartApiRef?.current?.api?.setSymbol) {
              chartApiRef.current.api.setSymbol(e.target.value);
            }
          }}
          disabled={isChangingSymbol || symbolsLoading}
          className={`text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-gray-100 hover:text-white transition-colors ${
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

        <div className="h-4 w-px bg-gray-600"></div>

        <select
          value={settings.granularity}
          onChange={(e) => {
            // Call Chart API directly instead of context
            if (chartApiRef?.current?.api?.setGranularity) {
              chartApiRef.current.api.setGranularity(e.target.value as Granularity);
            }
          }}
          disabled={isChangingGranularity}
          className={`text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-300 hover:text-white transition-colors ${
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
          <>
            <div className="h-4 w-px bg-gray-600"></div>
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
          </>
        )}
      </div>

      {/* Center separator */}
      <div className="h-4 w-px bg-gray-600"></div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Indicator Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen)}
            disabled={indicatorsLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-300 hover:text-white bg-transparent rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Indicators"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <svg
              className={`w-3 h-3 transition-transform ${
                isIndicatorDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isIndicatorDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 min-w-[280px] bg-black border border-gray-700 rounded-md shadow-lg z-[100] max-h-96 overflow-y-auto">
              {indicatorsError ? (
                <div className="p-3 text-red-400 text-xs">
                  Error loading indicators: {indicatorsError}
                </div>
              ) : indicatorsLoading ? (
                <div className="p-3 text-gray-400 text-xs">
                  Loading indicators...
                </div>
              ) : availableIndicators.length === 0 ? (
                <div className="p-3 text-gray-400 text-xs">
                  No indicators available
                </div>
              ) : (
                <div className="py-1">
                  {availableIndicators.map((indicator) => {
                    const isVisible = settings.indicators.some(
                      (ind) => ind.id === indicator.id && ind.visible
                    );

                    return (
                      <button
                        key={indicator.id}
                        onClick={() => {
                          if (chartApiRef?.current?.api) {
                            if (isVisible) {
                              // Hide indicator
                              chartApiRef.current.api.hideIndicator?.(indicator.id);
                            } else {
                              // Show indicator
                              const apiIndicatorConfig = {
                                id: indicator.id,
                                name: indicator.name,
                                visible: true,
                                display:
                                  indicator.display === "Overlay"
                                    ? "main"
                                    : "bottom",
                                scale:
                                  indicator.scale === "Price"
                                    ? "value"
                                    : "value",
                                params: indicator.params || {},
                              };
                              chartApiRef.current.api.showIndicator?.(
                                apiIndicatorConfig
                              );
                            }
                          }
                          // Don't close the menu to allow multiple indicator selection
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-900 transition-colors flex items-center justify-between ${
                          isVisible
                            ? "text-blue-400"
                            : "text-gray-100"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{indicator.name}</div>
                          <div className="text-gray-500 text-xs">
                            {indicator.display}
                          </div>
                        </div>
                        {isVisible && (
                          <svg
                            className="w-3 h-3 flex-shrink-0 ml-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Click outside to close */}
          {isIndicatorDropdownOpen && (
            <div
              className="fixed inset-0 z-[99]"
              onClick={() => setIsIndicatorDropdownOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
