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
    <div className={`h-screen bg-black ${className}`}>
      <AuthProvider>
        <ChartApp
          className="h-full"
          initialLayout={createInitialLayout()}
        />
      </AuthProvider>
    </div>
  );
};

export default ChartAppExample;
