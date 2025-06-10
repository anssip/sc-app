import React, { useState, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SCChart, SCChartRef } from './SCChart';
import app, { db } from '~/lib/firebase';
import type { Granularity } from '@anssipiirainen/sc-charts';

/**
 * ChartPanel Component
 * 
 * This component implements a flexible chart layout system with individual chart state management.
 * Each chart instance has its own state and uses the Chart API for independent control.
 * 
 * Key Features:
 * - Individual chart state management (no shared global state)
 * - Chart API integration for symbol and granularity changes
 * - Resizable panel layout system
 * - Error handling and loading states
 * - Real-time chart updates via API calls
 */

export interface ChartConfig {
  id: string;
  symbol: string;
  granularity: Granularity;
  indicators?: any[];
}

export interface PanelLayout {
  id: string;
  type: 'chart' | 'group';
  direction?: 'horizontal' | 'vertical';
  children?: PanelLayout[];
  chart?: ChartConfig;
  defaultSize?: number;
  minSize?: number;
}

interface ChartPanelProps {
  layout: PanelLayout;
  onLayoutChange?: (layout: PanelLayout) => void;
  className?: string;
}

const defaultChartConfig: ChartConfig = {
  id: 'default',
  symbol: 'BTC-USD',
  granularity: 'ONE_HOUR',
  indicators: [],
};

const ResizeHandle: React.FC<{ direction: 'horizontal' | 'vertical' }> = ({ direction }) => (
  <PanelResizeHandle
    className={`
      ${direction === 'horizontal' ? 'w-2 hover:w-3' : 'h-2 hover:h-3'}
      bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
      transition-all duration-200 ease-in-out
      ${direction === 'horizontal' 
        ? 'cursor-col-resize border-l border-r border-gray-300 dark:border-gray-600' 
        : 'cursor-row-resize border-t border-b border-gray-300 dark:border-gray-600'
      }
      flex items-center justify-center
      group
    `}
  >
    <div className={`
      ${direction === 'horizontal' ? 'w-0.5 h-6' : 'h-0.5 w-6'}
      bg-gray-400 dark:bg-gray-500
      group-hover:bg-gray-500 dark:group-hover:bg-gray-400
      transition-colors duration-200
    `} />
  </PanelResizeHandle>
);

/**
 * ChartContainer Component
 * 
 * Individual chart container that manages its own state and API interactions.
 * Uses the Chart API (from sc-charts library) to independently control:
 * - Symbol selection (BTC-USD, ETH-USD, etc.)
 * - Granularity/timeframe (1m, 5m, 1h, 1d, etc.)
 * - Error handling and loading states
 */
const ChartContainer: React.FC<{ 
  config: ChartConfig; 
  onRemove?: () => void;
  onSymbolChange?: (symbol: string) => void;
  onConfigUpdate?: (config: ChartConfig) => void;
}> = ({ config, onRemove, onSymbolChange, onConfigUpdate }) => {
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState(config.symbol);
  const [currentGranularity, setCurrentGranularity] = useState(config.granularity);
  const [isChangingSymbol, setIsChangingSymbol] = useState(false);
  const [isChangingGranularity, setIsChangingGranularity] = useState(false);
  const chartRef = useRef<SCChartRef>(null);

  const initialState = {
    symbol: config.symbol,
    granularity: config.granularity,
  };

  console.log(`ChartContainer [${config.id}]: Rendering with config`, { config, initialState });



  /**
   * Wait for Chart API to be available with retry mechanism
   */
  const waitForApi = async (): Promise<boolean> => {
    let retries = 0;
    const maxRetries = 10;
    
    while ((!chartRef.current || !chartRef.current.api) && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }
    
    return !!(chartRef.current && chartRef.current.api);
  };

  /**
   * Handle symbol changes using the Chart API
   * This function uses the sc-charts API to change the trading pair independently
   * for this specific chart instance, without affecting other charts
   */
  const handleSymbolChange = async (symbol: string) => {
    if (symbol === currentSymbol) return;
    
    setIsChangingSymbol(true);
    setChartError(null);
    
    try {
      const apiAvailable = await waitForApi();
      
      if (apiAvailable && chartRef.current) {
        // Use Chart API to change symbol - this updates only this chart instance
        await chartRef.current.setSymbol(symbol);
        setCurrentSymbol(symbol);
        onSymbolChange?.(symbol);
        
        // Update the config through the callback
        if (onConfigUpdate) {
          onConfigUpdate({
            ...config,
            symbol,
            granularity: currentGranularity
          });
        }
      } else {
        console.warn('Chart API not available - symbol change will require chart reload');
        setChartError('Chart API not available. Symbol changes require chart reload.');
        // Reset the select to the previous symbol on error
        setCurrentSymbol(config.symbol);
      }
    } catch (error) {
      console.error('Failed to change symbol:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChartError(`Failed to change symbol: ${errorMessage}`);
      // Reset the select to the previous symbol on error
      setCurrentSymbol(config.symbol);
    } finally {
      setIsChangingSymbol(false);
    }
  };

  /**
   * Handle granularity/timeframe changes using the Chart API
   * This function uses the sc-charts API to change the timeframe independently
   * for this specific chart instance
   */
  const handleGranularityChange = async (granularity: Granularity) => {
    if (granularity === currentGranularity) return;
    
    setIsChangingGranularity(true);
    setChartError(null);
    
    try {
      const apiAvailable = await waitForApi();
      
      if (apiAvailable && chartRef.current) {
        // Use Chart API to change granularity - this updates only this chart instance
        await chartRef.current.setGranularity(granularity);
        setCurrentGranularity(granularity);
        
        // Update the config through the callback
        if (onConfigUpdate) {
          onConfigUpdate({
            ...config,
            symbol: currentSymbol,
            granularity
          });
        }
      } else {
        console.warn('Chart API not available - granularity change will require chart reload');
        setChartError('Chart API not available. Granularity changes require chart reload.');
        // Reset the select to the previous granularity on error
        setCurrentGranularity(config.granularity);
      }
    } catch (error) {
      console.error('Failed to change granularity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChartError(`Failed to change granularity: ${errorMessage}`);
      // Reset the select to the previous granularity on error
      setCurrentGranularity(config.granularity);
    } finally {
      setIsChangingGranularity(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={currentSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            disabled={isChangingSymbol}
            className={`text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              isChangingSymbol ? 'opacity-50 cursor-not-allowed' : ''
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
            value={currentGranularity}
            onChange={(e) => handleGranularityChange(e.target.value as Granularity)}
            disabled={isChangingGranularity}
            className={`text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              isChangingGranularity ? 'opacity-50 cursor-not-allowed' : ''
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
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove chart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Chart Content */}
      <div className="flex-1 relative">
        {chartError ? (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
            <div className="text-center p-4">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 max-w-xs">{chartError}</p>
              <button
                onClick={() => setChartError(null)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <SCChart
            ref={chartRef}
            firestore={db}
            initialState={initialState}
            style={{ width: "100%", height: "100%" }}
            className="trading-chart"
            chartId={config.id}
            onReady={() => {}}
            onError={(error) => setChartError(error)}
          />
        )}
      </div>
    </div>
  );
};

const renderPanelGroup = (
  layout: PanelLayout, 
  onLayoutChange?: (layout: PanelLayout) => void,
  parentPath: string = ''
): React.ReactNode => {
  const currentPath = parentPath ? `${parentPath}.${layout.id}` : layout.id;

  if (layout.type === 'chart' && layout.chart) {
    return (
      <Panel
        key={layout.id}
        defaultSize={layout.defaultSize || 50}
        minSize={layout.minSize || 20}
        className="relative"
      >
        <ChartContainer
          config={layout.chart}
          onSymbolChange={(symbol) => {
            // This callback can be used for additional symbol change handling if needed
          }}
          onConfigUpdate={(updatedConfig) => {
            if (onLayoutChange && layout.chart) {
              const updatedLayout = {
                ...layout,
                chart: updatedConfig
              };
              onLayoutChange(updatedLayout);
            }
          }}
        />
      </Panel>
    );
  }

  if (layout.type === 'group' && layout.children) {
    return (
      <Panel
        key={layout.id}
        defaultSize={layout.defaultSize || 50}
        minSize={layout.minSize || 20}
      >
        <PanelGroup direction={layout.direction || 'horizontal'}>
          {layout.children.map((child, index) => (
            <React.Fragment key={child.id}>
              {renderPanelGroup(child, onLayoutChange, currentPath)}
              {index < layout.children!.length - 1 && (
                <ResizeHandle direction={layout.direction || 'horizontal'} />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </Panel>
    );
  }

  return null;
};

export const ChartPanel: React.FC<ChartPanelProps> = ({ 
  layout, 
  onLayoutChange, 
  className = "" 
}) => {
  return (
    <div className={`h-full w-full ${className}`}>
      <PanelGroup direction={layout.direction || 'horizontal'}>
        {layout.children ? (
          layout.children.map((child, index) => (
            <React.Fragment key={child.id}>
              {renderPanelGroup(child, onLayoutChange)}
              {index < layout.children!.length - 1 && (
                <ResizeHandle direction={layout.direction || 'horizontal'} />
              )}
            </React.Fragment>
          ))
        ) : (
          renderPanelGroup(layout, onLayoutChange)
        )}
      </PanelGroup>
    </div>
  );
};

// Helper functions for creating layouts
export const createChartLayout = (
  id: string, 
  symbol: string = 'BTC-USD',
  granularity: Granularity = 'ONE_HOUR',
  defaultSize?: number
): PanelLayout => ({
  id,
  type: 'chart',
  chart: {
    id,
    symbol,
    granularity,
    indicators: [],
  },
  defaultSize,
  minSize: 20,
});

export const createGroupLayout = (
  id: string,
  direction: 'horizontal' | 'vertical',
  children: PanelLayout[],
  defaultSize?: number
): PanelLayout => ({
  id,
  type: 'group',
  direction,
  children,
  defaultSize,
  minSize: 20,
});

// Predefined layouts
export const LAYOUT_PRESETS = {
  single: createChartLayout('main', 'BTC-USD'),
  
  horizontal: createGroupLayout('root', 'horizontal', [
    createChartLayout('left', 'BTC-USD', 'ONE_HOUR', 50),
    createChartLayout('right', 'ETH-USD', 'ONE_HOUR', 50),
  ]),
  
  vertical: createGroupLayout('root', 'vertical', [
    createChartLayout('top', 'BTC-USD', 'ONE_HOUR', 50),
    createChartLayout('bottom', 'ETH-USD', 'ONE_HOUR', 50),
  ]),
  
  quad: createGroupLayout('root', 'vertical', [
    createGroupLayout('top', 'horizontal', [
      createChartLayout('top-left', 'BTC-USD', 'ONE_HOUR', 50),
      createChartLayout('top-right', 'ETH-USD', 'ONE_HOUR', 50),
    ], 50),
    createGroupLayout('bottom', 'horizontal', [
      createChartLayout('bottom-left', 'ADA-USD', 'ONE_HOUR', 50),
      createChartLayout('bottom-right', 'SOL-USD', 'ONE_HOUR', 50),
    ], 50),
  ]),
  
  triple: createGroupLayout('root', 'horizontal', [
    createChartLayout('left', 'BTC-USD', 'ONE_HOUR', 40),
    createGroupLayout('right', 'vertical', [
      createChartLayout('top-right', 'ETH-USD', 'ONE_HOUR', 50),
      createChartLayout('bottom-right', 'ADA-USD', 'ONE_HOUR', 50),
    ], 60),
  ]),
};