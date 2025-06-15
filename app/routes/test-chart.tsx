import type { MetaFunction } from "@remix-run/node";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/lib/auth-context";
import Login from "~/components/Login";
import { ChartAppExample } from "~/components/ChartAppExample";
import { SymbolDebugger } from "~/components/SymbolDebugger";

export const meta: MetaFunction = () => {
  return [
    { title: "Test Chart - Spot Canvas App" },
    {
      name: "description",
      content: "Test the repository-integrated chart system",
    },
  ];
};

function TestChartContent() {
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Repository Integration Test</h1>
            <p className="text-blue-100 text-sm">
              Testing the new chart system with repository integration
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-100">Testing as: {user?.email}</span>
            <a href="/" className="text-blue-200 hover:text-white underline">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
          <div>
            <h2 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Test Instructions
            </h2>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>• Try saving a layout with a custom name</p>
              <p>• Switch between different preset layouts</p>
              <p>• Change symbols and timeframes - they should persist</p>
              <p>• Check that saved layouts appear in the dropdown</p>
              <p>• Test offline functionality (disconnect internet)</p>
              <p>• Verify repository status shows "Online" when connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symbol Debugger */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <SymbolDebugger />
      </div>

      {/* Chart App Example */}
      <div className="flex-1">
        <ChartAppExample className="h-full" />
      </div>

      {/* Test Status Footer */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              Repository Integration Status:
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 dark:text-green-400">Active</span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Test environment - Repository Integration v1.0
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestChartRoute() {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600">
                Please sign in to test the repository-integrated chart system.
              </p>
            </div>
            <Login
              title=""
              description=""
              showFeatures={false}
              layout="vertical"
              className="w-full"
            />
          </div>
        </div>
      }
    >
      <TestChartContent />
    </ProtectedRoute>
  );
}
