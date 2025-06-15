import React from 'react';
import { ChartApp } from './ChartApp';
import { AuthProvider } from '~/lib/auth-context';
import type { PanelLayout } from './ChartPanel';

interface ChartAppExampleProps {
  className?: string;
}

/**
 * Example usage of the ChartApp component with repository integration
 *
 * This component demonstrates:
 * - How to use ChartApp with the repository system
 * - Layout management with save/load functionality
 * - Authentication wrapper for repository access
 */
export const ChartAppExample: React.FC<ChartAppExampleProps> = ({
  className = ''
}) => {
  // Example: Create a custom initial layout
  const createInitialLayout = (): PanelLayout => ({
    id: 'example-layout',
    type: 'group',
    direction: 'horizontal',
    children: [
      {
        id: 'left-chart',
        type: 'chart',
        chart: {
          id: 'btc-chart',
          symbol: 'BTC-USD',
          granularity: 'ONE_HOUR',
          indicators: [],
        },
        defaultSize: 60,
        minSize: 20,
      },
      {
        id: 'right-group',
        type: 'group',
        direction: 'vertical',
        children: [
          {
            id: 'top-right-chart',
            type: 'chart',
            chart: {
              id: 'eth-chart',
              symbol: 'ETH-USD',
              granularity: 'ONE_HOUR',
              indicators: [],
            },
            defaultSize: 50,
            minSize: 20,
          },
          {
            id: 'bottom-right-chart',
            type: 'chart',
            chart: {
              id: 'ada-chart',
              symbol: 'ADA-USD',
              granularity: 'ONE_DAY',
              indicators: [],
            },
            defaultSize: 50,
            minSize: 20,
          },
        ],
        defaultSize: 40,
        minSize: 20,
      },
    ],
    defaultSize: 100,
    minSize: 20,
  });

  return (
    <div className={`h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chart Application Example
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Demonstrating repository-integrated chart layouts with save/load functionality
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Repository Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart App */}
      <div className="h-[calc(100vh-80px)]">
        <AuthProvider>
          <ChartApp
            className="h-full"
            initialLayout={createInitialLayout()}
          />
        </AuthProvider>
      </div>

      {/* Footer with instructions */}
      <div className="absolute bottom-4 left-4 right-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          🚀 Repository Features Demo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-800 dark:text-blue-200">
          <div>
            <strong>Layout Management:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Save current layout with custom name</li>
              <li>• Load previously saved layouts</li>
              <li>• Switch between preset layouts</li>
            </ul>
          </div>
          <div>
            <strong>Chart Persistence:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Symbol changes auto-save to repository</li>
              <li>• Granularity changes persist</li>
              <li>• Real-time sync across devices</li>
            </ul>
          </div>
          <div>
            <strong>Offline Support:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Works offline with local cache</li>
              <li>• Auto-sync when connection restored</li>
              <li>• Optimistic UI updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartAppExample;
