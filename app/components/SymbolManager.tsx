import React, { useState, useEffect } from "react";
import { useSymbols } from "~/hooks/useRepository";
import { useStarredSymbols } from "~/hooks/useStarredSymbols";

interface SymbolManagerProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId?: string;
}

// Default symbols that are shown when user has no starred symbols
const DEFAULT_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"];

export const SymbolManager: React.FC<SymbolManagerProps> = ({ isOpen, onClose, layoutId }) => {
  const { symbols, isLoading: symbolsLoading } = useSymbols();
  const { 
    starredSymbols, 
    updateStarredSymbols, 
    isSymbolStarred,
    isLoading: starredLoading 
  } = useStarredSymbols(layoutId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSymbols, setPendingSymbols] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize pending symbols when dialog opens
  useEffect(() => {
    if (isOpen && !hasInitialized && !starredLoading) {
      // If user has no starred symbols, initialize with defaults
      if (starredSymbols.length === 0) {
        setPendingSymbols(new Set(DEFAULT_SYMBOLS));
      } else {
        // Otherwise, use their existing starred symbols
        setPendingSymbols(new Set(starredSymbols));
      }
      setHasInitialized(true);
    }
  }, [isOpen, starredSymbols, starredLoading, hasInitialized]);

  // Reset initialization flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  // Get display symbols (either starred or defaults)
  const getDisplaySymbols = () => {
    if (starredSymbols.length > 0) {
      return starredSymbols;
    }
    return Array.from(pendingSymbols);
  };

  const displaySymbols = getDisplaySymbols();

  // Filter active USD symbols
  const availableSymbols = symbols
    .filter(s => s.active && s.quoteAsset === "USD" && s.exchangeId === "coinbase")
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  
  // Filter symbols based on search query
  const filteredSymbols = searchQuery
    ? availableSymbols.filter(s => 
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableSymbols;

  // Handle adding/removing symbols
  const handleToggleSymbol = (symbol: string) => {
    setPendingSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  // Handle close - save changes if needed
  const handleClose = async () => {
    // Save the pending symbols if layoutId is available
    if (layoutId) {
      await updateStarredSymbols(Array.from(pendingSymbols));
    }
    
    onClose();
  };

  // Handle escape key - Note: We don't save on escape, just close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose(); // Just close without saving
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Symbol Manager</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {/* Your Symbols Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Your Symbols</h3>
              {starredLoading ? (
                <div className="text-gray-500">Loading starred symbols...</div>
              ) : pendingSymbols.size === 0 ? (
                <div className="text-gray-500 italic">No symbols selected</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from(pendingSymbols).map((symbol) => (
                    <div
                      key={symbol}
                      className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between group hover:bg-gray-750 transition-colors"
                    >
                      <span className="font-medium text-white">{symbol}</span>
                      <button
                        onClick={() => handleToggleSymbol(symbol)}
                        className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove symbol"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Available Symbols Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Available Symbols</h3>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Symbols Grid */}
              <div className="flex-1 overflow-y-auto">
                {symbolsLoading ? (
                  <div className="text-gray-500">Loading symbols...</div>
                ) : filteredSymbols.length === 0 ? (
                  <div className="text-gray-500 italic">No symbols found</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredSymbols.map((symbol) => {
                      const isSelected = pendingSymbols.has(symbol.symbol);
                      return (
                        <button
                          key={symbol.id}
                          onClick={() => handleToggleSymbol(symbol.symbol)}
                          className={`
                            rounded-lg px-4 py-3 text-left transition-all
                            ${isSelected 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{symbol.symbol}</span>
                            <svg 
                              className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-800">
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};