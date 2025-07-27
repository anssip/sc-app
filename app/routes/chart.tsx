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
    <div className="h-screen flex flex-col bg-primary-dark">
      <header className="bg-primary-dark-95 border-b border-gray-500/20 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold font-primary">
            <span className="text-white">Spot</span>{" "}
            <span className="text-accent-1">Canvas</span>
            <span className="text-gray-300 font-normal ml-2">- Charts</span>
          </h1>
          <a href="/" className="text-gray-300 hover:text-accent-1 transition-colors text-sm">
            ← Back to Home
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">Welcome, {user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm text-primary-dark bg-accent-1 hover:opacity-90 transition-opacity rounded"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 bg-primary-dark">
        <ChartApp className="h-full" />
      </main>
    </div>
  );
}

export default function ChartRoute() {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-primary-dark">
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
