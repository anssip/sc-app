import React from "react";
import { useSymbols } from "~/hooks/useRepository";

interface SymbolDebuggerProps {
  className?: string;
}

export const SymbolDebugger: React.FC<SymbolDebuggerProps> = ({
  className = "",
}) => {
  const { symbols, activeSymbols, isLoading, error } = useSymbols();

  return (
    <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Symbol Debugger
      </h3>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600"></div>
          <span>Loading symbols from repository...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
          <div className="text-red-600 dark:text-red-400 font-semibold">
            Error loading symbols:
          </div>
          <div className="text-red-500 dark:text-red-300 text-sm mt-1">
            {error}
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <div className="text-blue-900 dark:text-blue-300 font-semibold">
                Total Symbols
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {symbols.length}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <div className="text-green-900 dark:text-green-300 font-semibold">
                Active Symbols
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeSymbols.length}
              </div>
            </div>
          </div>

          {/* Popular USD Pairs */}
          {activeSymbols.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Popular USD Trading Pairs (Coinbase)
              </h4>
              <div className="bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                {activeSymbols
                  .filter((s) => s.exchangeId === "coinbase")
                  .filter((s) => s.quoteAsset === "USD")
                  .sort((a, b) => {
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
                  .slice(0, 20)
                  .map((symbol) => (
                    <div
                      key={symbol.id}
                      className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                          {symbol.symbol}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {symbol.baseAsset} / {symbol.quoteAsset}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                          {symbol.exchangeId}
                        </span>
                        {symbol.active && (
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Exchange Summary */}
          {symbols.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Exchange Summary
              </h4>
              <div className="space-y-2">
                {Object.entries(
                  symbols.reduce((acc, symbol) => {
                    acc[symbol.exchangeId] = (acc[symbol.exchangeId] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([exchangeId, count]) => (
                  <div
                    key={exchangeId}
                    className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {count} symbols
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No symbols found */}
          {symbols.length === 0 && (
            <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <div className="text-yellow-600 dark:text-yellow-400 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                No symbols found
              </p>
              <p className="text-yellow-700 dark:text-yellow-200 text-sm mt-1">
                The repository may not be initialized or there might be no data
                in Firestore.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymbolDebugger;
