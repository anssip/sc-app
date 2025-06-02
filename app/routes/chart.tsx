import type { MetaFunction } from "@remix-run/node";
import { SCChart } from "~/components/SCChart";
import { useState } from "react";
import app, { db } from "~/lib/firebase";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Login from "~/components/Login";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
  ];
};

function ChartContent() {
  const { user } = useAuth();
  const [chartError, setChartError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
          <h1 className="text-xl font-bold">Spot Canvas - charts</h1>
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">
            ← Back to Home
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">Welcome, {user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {initialState.symbol} Chart
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Financial charting for crypto and stocks
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
              firebaseApp={app}
              firestore={db}
              initialState={initialState}
              style={{ width: "100%", height: "800px" }}
              className="trading-chart"
            />
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Real-time financial charting with live data updates.</p>
        </div>
      </main>
    </div>
  );
}

export default function ChartRoute() {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <Login
              title="Authentication Required"
              description="Please sign in to access the trading chart."
              showFeatures={false}
              layout="vertical"
              className="w-full"
            />
          </div>
        </div>
      }
    >
      <ChartContent />
    </ProtectedRoute>
  );
}
