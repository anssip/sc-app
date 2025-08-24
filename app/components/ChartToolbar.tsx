import React, { Fragment, useState } from "react";
import { Link } from "@remix-run/react";
import { useSymbols } from "~/hooks/useRepository";
import { useStarredSymbols } from "~/hooks/useStarredSymbols";
import { useChartSettings } from "~/contexts/ChartSettingsContext";
import { useSubscription } from "~/contexts/SubscriptionContext";
import { useIndicators } from "~/hooks/useIndicators";
import { db } from "~/lib/firebase";
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from 'lucide-react';
import { ToolbarButton, ToolbarDropdownButton } from './ToolbarButton';
import { UpgradePrompt } from './UpgradePrompt';
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

  // Use subscription context for limitations
  const { status, plan, canAddMoreIndicators, getIndicatorLimit } = useSubscription();

  // Load indicators from Firestore
  const {
    indicators: availableIndicators,
    isLoading: indicatorsLoading,
    error: indicatorsError,
  } = useIndicators(db);

  // State for upgrade prompt
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

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
    <div className="flex items-center gap-1">
        {/* Symbol Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button 
            as={ToolbarDropdownButton}
            disabled={symbolsLoading || starredLoading || isChangingSymbol}
            title="Select Symbol"
            className="font-bold"
          >
            {symbolsLoading || starredLoading ? (
              "Loading..."
            ) : symbolsError ? (
              "Error"
            ) : (
              settings.symbol
            )}
            <ChevronDownIcon className="w-3 h-3" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 min-w-[160px] bg-black border border-gray-700 rounded-md shadow-lg z-[200] max-h-96 overflow-y-auto">
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
                    <Menu.Item key={symbol.id}>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            if (chartApiRef?.current?.setSymbol) {
                              chartApiRef.current.setSymbol(symbol.symbol);
                            }
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                            active ? 'bg-gray-900' : ''
                          } ${
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
                      )}
                    </Menu.Item>
                  ))}
                  
                  {/* Current symbol if not in display list */}
                  {!displaySymbols.find((s) => s?.symbol === settings.symbol) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          key={settings.symbol}
                          onClick={() => {
                            // No action needed - current symbol already selected
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between text-blue-400 ${
                            active ? 'bg-gray-900' : ''
                          }`}
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
                    </Menu.Item>
                  )}
                  
                  {/* Separator */}
                  <div className="h-px bg-gray-800 my-1"></div>
                  
                  {/* Manage Symbols option */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          if (onOpenSymbolManager) {
                            onOpenSymbolManager();
                          }
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors text-gray-300 hover:text-white flex items-center ${
                          active ? 'bg-gray-900' : ''
                        }`}
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
                    )}
                  </Menu.Item>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Granularity Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button 
            as={ToolbarDropdownButton}
            disabled={isChangingGranularity}
            title="Select timeframe"
          >
            {GRANULARITY_OPTIONS.find(opt => opt.value === settings.granularity)?.label || settings.granularity}
            <ChevronDownIcon className="w-3 h-3" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-24 bg-black border border-gray-700 rounded-md shadow-lg z-[200]">
              <div className="py-1">
                {GRANULARITY_OPTIONS.map((option) => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          if (chartApiRef?.current?.setGranularity) {
                            chartApiRef.current.setGranularity(option.value);
                          }
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'bg-gray-900' : ''
                        } ${
                          settings.granularity === option.value
                            ? "text-blue-400"
                            : "text-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

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

        {/* Trend Line Button */}
        <ToolbarButton
          onClick={() => {
            if (chartApiRef?.current?.activateTrendLineTool) {
              chartApiRef.current.activateTrendLineTool();
            }
          }}
          title="Draw Trend Line"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Line with circles at both ends */}
            <line x1="5" y1="19" x2="19" y2="5" strokeWidth={2} />
            <circle cx="5" cy="19" r="2" fill="currentColor" />
            <circle cx="19" cy="5" r="2" fill="currentColor" />
          </svg>
        </ToolbarButton>

        {/* Indicator Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button
            as={ToolbarDropdownButton}
            disabled={indicatorsLoading}
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
            <ChevronDownIcon className="w-3 h-3" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 min-w-[280px] bg-black border border-gray-700 rounded-md shadow-lg z-[200] max-h-96 overflow-y-auto">
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
                  {/* Show indicator limit info for Starter plan */}
                  {status === 'active' && plan === 'starter' && (
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                      <div>Starter Plan: {settings.indicators.filter(ind => ind.visible).length} / 2 indicators</div>
                      {settings.indicators.filter(ind => ind.visible).length >= 2 && (
                        <div className="text-orange-400 mt-1">
                          Limit reached - <Link to="/billing" className="text-blue-400 hover:underline">Upgrade to Pro</Link> for unlimited
                        </div>
                      )}
                    </div>
                  )}
                  
                  {availableIndicators.map((indicator) => {
                    const isVisible = settings.indicators.some(
                      (ind) => ind.id === indicator.id && ind.visible
                    );
                    const visibleCount = settings.indicators.filter(ind => ind.visible).length;
                    const canAdd = canAddMoreIndicators(visibleCount);
                    const needsUpgrade = !isVisible && !canAdd && (status === 'active' || status === 'none' || status === 'canceled');

                    return (
                      <Menu.Item key={indicator.id}>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              if (chartApiRef?.current?.api) {
                                if (isVisible) {
                                  // Hide indicator
                                  chartApiRef.current.api.hideIndicator?.(indicator.id);
                                } else if (canAdd) {
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
                                } else if (needsUpgrade) {
                                  // Show upgrade prompt
                                  setShowUpgradePrompt(true);
                                }
                              }
                              // Don't close the menu to allow multiple indicator selection
                            }}
                            disabled={!isVisible && needsUpgrade}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                              active ? 'bg-gray-900' : ''
                            } ${
                              isVisible
                                ? "text-blue-400"
                                : needsUpgrade 
                                  ? "text-gray-500 cursor-not-allowed"
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
                        )}
                      </Menu.Item>
                    );
                  })}
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt 
          feature="indicators" 
          onClose={() => setShowUpgradePrompt(false)} 
        />
      )}
    </div>
  );
};
