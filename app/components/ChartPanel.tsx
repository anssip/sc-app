import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SCChart } from './SCChart';
import app, { db } from '~/lib/firebase';

export interface ChartConfig {
  id: string;
  symbol: string;
  granularity: string;
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

const ChartContainer: React.FC<{ 
  config: ChartConfig; 
  onRemove?: () => void;
  onSymbolChange?: (symbol: string) => void;
}> = ({ config, onRemove, onSymbolChange }) => {
  const [chartError, setChartError] = useState<string | null>(null);

  const initialState = {
    symbol: config.symbol,
    granularity: config.granularity,
    loading: false,
    indicators: config.indicators || [],
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={config.symbol}
            onChange={(e) => onSymbolChange?.(e.target.value)}
            className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-800 dark:text-gray-200"
          >
            <option value="BTC-USD">BTC-USD</option>
            <option value="ETH-USD">ETH-USD</option>
            <option value="ADA-USD">ADA-USD</option>
            <option value="DOGE-USD">DOGE-USD</option>
            <option value="SOL-USD">SOL-USD</option>
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {config.granularity}
          </span>
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
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{chartError}</p>
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
            firebaseApp={app}
            firestore={db}
            initialState={initialState}
            style={{ width: "100%", height: "100%" }}
            className="trading-chart"
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
            if (onLayoutChange && layout.chart) {
              const updatedLayout = {
                ...layout,
                chart: { ...layout.chart, symbol }
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
  granularity: string = 'ONE_HOUR',
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