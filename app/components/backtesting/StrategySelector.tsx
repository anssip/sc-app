import React, { useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { SMAStrategy, RSIStrategy } from "~/services/strategies";
import type {
  SMAStrategyConfig,
  RSIStrategyConfig,
} from "~/services/strategies";
import type { TradingStrategy } from "~/types/trading";

/**
 * Available strategy types
 */
export type StrategyType = "sma" | "rsi";

/**
 * Strategy option for the selector
 */
interface StrategyOption {
  type: StrategyType;
  name: string;
  description: string;
  defaultConfig: any;
}

/**
 * Available strategies
 */
const STRATEGIES: StrategyOption[] = [
  {
    type: "sma",
    name: "SMA Crossover",
    description:
      "Moving average crossover strategy (Golden Cross / Death Cross)",
    defaultConfig: {
      fastPeriod: 50,
      slowPeriod: 200,
      quantity: 1,
    } as SMAStrategyConfig,
  },
  {
    type: "rsi",
    name: "RSI Mean Reversion",
    description: "RSI oversold/overbought strategy with optional stop-loss",
    defaultConfig: {
      period: 14,
      oversoldLevel: 30,
      overboughtLevel: 70,
      quantity: 1,
      useStopLoss: false,
      useTakeProfit: false,
    } as RSIStrategyConfig,
  },
];

interface Props {
  selectedStrategy: StrategyType;
  onStrategyChange: (type: StrategyType) => void;
  config: any;
  onConfigChange: (config: any) => void;
  symbol: string;
}

/**
 * Strategy selector with configuration form
 */
export function StrategySelector({
  selectedStrategy,
  onStrategyChange,
  config,
  onConfigChange,
  symbol,
}: Props) {
  const selectedOption = STRATEGIES.find((s) => s.type === selectedStrategy);

  const handleStrategyChange = (option: StrategyOption) => {
    onStrategyChange(option.type);
    onConfigChange(option.defaultConfig);
  };

  const handleConfigChange = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Strategy Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trading Strategy
        </label>
        <Listbox value={selectedOption} onChange={handleStrategyChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-primary-lighter py-2 pl-3 pr-10 text-left text-sm">
              <span className="block truncate text-white">
                {selectedOption?.name}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </span>
            </Listbox.Button>
            <Transition
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {STRATEGIES.map((strategy) => (
                  <Listbox.Option
                    key={strategy.type}
                    value={strategy}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-primary text-white"
                          : "text-gray-300 bg-gray-900"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <div>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {strategy.name}
                          </span>
                          <span className="block text-xs text-gray-400 mt-1">
                            {strategy.description}
                          </span>
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Strategy Configuration */}
      {selectedStrategy === "sma" && (
        <SMAConfigForm config={config} onChange={handleConfigChange} />
      )}
      {selectedStrategy === "rsi" && (
        <RSIConfigForm config={config} onChange={handleConfigChange} />
      )}
    </div>
  );
}

/**
 * SMA strategy configuration form
 * Only strategy-specific parameters (not indicator parameters)
 */
function SMAConfigForm({
  config,
  onChange,
}: {
  config: SMAStrategyConfig;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg bg-gray-900 border border-gray-800 p-3">
      <h4 className="text-xs font-medium text-gray-300">Strategy Settings</h4>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Order Quantity
        </label>
        <input
          type="number"
          value={config.quantity || 1}
          onChange={(e) => onChange("quantity", parseFloat(e.target.value))}
          min="0.001"
          step="0.001"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        />
        <small className="block mt-1 text-xs text-gray-500">
          Amount to buy/sell per trade
        </small>
      </div>
    </div>
  );
}

/**
 * RSI strategy configuration form
 * Only strategy-specific parameters (not indicator parameters)
 */
function RSIConfigForm({
  config,
  onChange,
}: {
  config: RSIStrategyConfig;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg bg-gray-900 border border-gray-800 p-3">
      <h4 className="text-xs font-medium text-gray-300">Strategy Settings</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Oversold Level (%)
          </label>
          <input
            type="number"
            value={config.oversoldLevel || 30}
            onChange={(e) =>
              onChange("oversoldLevel", parseInt(e.target.value))
            }
            min="0"
            max="100"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
          <small className="block mt-1 text-xs text-gray-500">
            Buy when RSI crosses above
          </small>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Overbought Level (%)
          </label>
          <input
            type="number"
            value={config.overboughtLevel || 70}
            onChange={(e) =>
              onChange("overboughtLevel", parseInt(e.target.value))
            }
            min="0"
            max="100"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
          <small className="block mt-1 text-xs text-gray-500">
            Sell when RSI crosses below
          </small>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Order Quantity
        </label>
        <input
          type="number"
          value={config.quantity || 1}
          onChange={(e) => onChange("quantity", parseFloat(e.target.value))}
          min="0.001"
          step="0.001"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        />
        <small className="block mt-1 text-xs text-gray-500">
          Amount to buy/sell per trade
        </small>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-xs text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.useStopLoss || false}
            onChange={(e) => onChange("useStopLoss", e.target.checked)}
            className="w-4 h-4 text-accent-primary bg-gray-800 border-gray-700 rounded focus:ring-accent-primary focus:ring-offset-gray-900 mr-2"
          />
          Use Stop Loss
        </label>

        {config.useStopLoss && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Stop Loss (%)
            </label>
            <input
              type="number"
              value={config.stopLossPercent || 2}
              onChange={(e) =>
                onChange("stopLossPercent", parseFloat(e.target.value))
              }
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-xs text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.useTakeProfit || false}
            onChange={(e) => onChange("useTakeProfit", e.target.checked)}
            className="w-4 h-4 text-accent-primary bg-gray-800 border-gray-700 rounded focus:ring-accent-primary focus:ring-offset-gray-900 mr-2"
          />
          Use Take Profit
        </label>

        {config.useTakeProfit && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Take Profit (%)
            </label>
            <input
              type="number"
              value={config.takeProfitPercent || 5}
              onChange={(e) =>
                onChange("takeProfitPercent", parseFloat(e.target.value))
              }
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Create a strategy instance from type and config
 */
export function createStrategy(
  type: StrategyType,
  symbol: string,
  config: any
): TradingStrategy {
  switch (type) {
    case "sma":
      return new SMAStrategy(symbol, config as SMAStrategyConfig);
    case "rsi":
      return new RSIStrategy(symbol, config as RSIStrategyConfig);
    default:
      throw new Error(`Unknown strategy type: ${type}`);
  }
}
