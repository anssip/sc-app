import type { MetaFunction } from "@remix-run/node";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Login from "~/components/Login";
import { ChartApp } from "~/components/ChartApp";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
  ];
};

function ChartContent() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spot Canvas - Charts</h1>
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

      <main className="flex-1">
        <ChartApp className="h-full" />
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
