import type { MetaFunction } from "@remix-run/node";
import { SCChart } from "~/components/SCChart";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
  ];
};

export default function ChartRoute() {
  const [chartError, setChartError] = useState<string | null>(null);

  // Firebase configuration - you'll need to replace these with your actual values
  const firebaseConfig = {
    projectId: "spotcanvas-prod",
    apiKey: "your-api-key",
    authDomain: "spotcanvas-prod.firebaseapp.com",
  };

  const initialState = {
    symbol: "BTC-USD",
    granularity: "ONE_HOUR",
    loading: false,
    indicators: [],
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spot Canvas - Trading Chart</h1>
          <nav>
            <a href="/" className="text-blue-400 hover:text-blue-300 underline">
              ← Back to Home
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {initialState.symbol} Chart
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Interactive financial chart powered by sc-charts
          </p>
        </div>

        <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          {chartError ? (
            <div className="flex items-center justify-center h-96 bg-red-50 dark:bg-red-900/20">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Chart Error
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {chartError}
                </p>
                <button
                  onClick={() => setChartError(null)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <SCChart
              firebaseConfig={firebaseConfig}
              initialState={initialState}
              style={{ width: "100%", height: "600px" }}
              className="trading-chart"
            />
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Note: You'll need to configure your Firebase settings in the
            firebaseConfig object to connect to your data backend.
          </p>
        </div>
      </main>
    </div>
  );
}
