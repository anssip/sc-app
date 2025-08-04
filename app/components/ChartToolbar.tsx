import React, { useRef, useState, useEffect } from "react";
import { useSymbols } from "~/hooks/useRepository";
import { useStarredSymbols } from "~/hooks/useStarredSymbols";
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
  layoutId?: string;
  onDelete?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onOpenSymbolManager?: () => void;
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
  layoutId,
  onDelete,
  onSplitHorizontal,
  onSplitVertical,
  onOpenSymbolManager,
}) => {
  const {
    symbols: allSymbols,
    activeSymbols,
    isLoading: symbolsLoading,
    error: symbolsError,
  } = useSymbols();
  
  const {
    starredSymbols,
    isLoading: starredLoading,
  } = useStarredSymbols(layoutId);

  // Use chart settings context (read-only for UI display)
  const { settings } = useChartSettings(chartId);

  // Load indicators from Firestore
  const {
    indicators: availableIndicators,
    isLoading: indicatorsLoading,
    error: indicatorsError,
  } = useIndicators(db);

  // State for dropdowns
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);

  // Handle Esc key to close dropdowns
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isIndicatorDropdownOpen) {
          setIsIndicatorDropdownOpen(false);
        }
        if (isSymbolDropdownOpen) {
          setIsSymbolDropdownOpen(false);
        }
      }
    };

    if (isIndicatorDropdownOpen || isSymbolDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isIndicatorDropdownOpen, isSymbolDropdownOpen]);

  // Default symbols to use when no symbols are starred (same as in SymbolManager)
  const DEFAULT_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"];
  
  // Get symbols to display in the dropdown
  const getDisplaySymbols = () => {
    // If we have starred symbols, use those
    if (starredSymbols.length > 0) {
      // Map starred symbols to full symbol objects from allSymbols
      return starredSymbols
        .map(symbol => allSymbols.find(s => s.symbol === symbol))
        .filter(Boolean); // Remove any undefined entries
    }
    
    // Otherwise, show default symbols
    return DEFAULT_SYMBOLS
      .map(symbol => allSymbols.find(s => s.symbol === symbol))
      .filter(Boolean);
  };

  const displaySymbols = getDisplaySymbols();

  return (
    <div className="flex items-center justify-between">
      {/* Left side - Symbol and Granularity selectors */}
      <div className="flex items-center gap-3">
        {/* Symbol Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
            disabled={symbolsLoading || starredLoading || isChangingSymbol}
            className={`flex items-center gap-1 px-2 py-1 text-sm font-bold text-gray-100 hover:text-white bg-transparent rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isChangingSymbol ? "opacity-50" : ""
            }`}
            title="Select Symbol"
          >
            {symbolsLoading || starredLoading ? (
              "Loading..."
            ) : symbolsError ? (
              "Error"
            ) : (
              settings.symbol
            )}
            <svg
              className={`w-3 h-3 transition-transform ${
                isSymbolDropdownOpen ? "rotate-180" : ""
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
          {isSymbolDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-black border border-gray-700 rounded-md shadow-lg z-[100] max-h-96 overflow-y-auto">
              {symbolsLoading || starredLoading ? (
                <div className="p-3 text-gray-400 text-xs">
                  Loading symbols...
                </div>
              ) : symbolsError ? (
                <div className="p-3 text-red-400 text-xs">
                  Error loading symbols
                </div>
              ) : (
                <div className="py-1">
                  {/* Display symbols (starred or defaults) */}
                  {displaySymbols.map((symbol) => symbol && (
                    <button
                      key={symbol.id}
                      onClick={() => {
                        if (chartApiRef?.current?.setSymbol) {
                          chartApiRef.current.setSymbol(symbol.symbol);
                        }
                        setIsSymbolDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-900 transition-colors flex items-center justify-between ${
                        settings.symbol === symbol.symbol
                          ? "text-blue-400"
                          : "text-gray-100"
                      }`}
                    >
                      <span className="font-medium">{symbol.symbol}</span>
                      {settings.symbol === symbol.symbol && (
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
                  ))}
                  
                  {/* Current symbol if not in display list */}
                  {!displaySymbols.find((s) => s?.symbol === settings.symbol) && (
                    <button
                      key={settings.symbol}
                      onClick={() => {
                        setIsSymbolDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-900 transition-colors flex items-center justify-between text-blue-400"
                    >
                      <span className="font-medium">{settings.symbol}</span>
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
                    </button>
                  )}
                  
                  {/* Separator */}
                  <div className="h-px bg-gray-800 my-1"></div>
                  
                  {/* Manage Symbols option */}
                  <button
                    onClick={() => {
                      if (onOpenSymbolManager) {
                        onOpenSymbolManager();
                      }
                      setIsSymbolDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-900 transition-colors text-gray-300 hover:text-white flex items-center"
                  >
                    <svg
                      className="w-3 h-3 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Manage Symbols
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Click outside to close */}
          {isSymbolDropdownOpen && (
            <div
              className="fixed inset-0 z-[99]"
              onClick={() => setIsSymbolDropdownOpen(false)}
            />
          )}
        </div>

        <div className="h-4 w-px bg-gray-600"></div>

        <select
          value={settings.granularity}
          onChange={(e) => {
            // Call Chart API directly instead of context
            if (chartApiRef?.current?.setGranularity) {
              chartApiRef.current.setGranularity(e.target.value as Granularity);
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
