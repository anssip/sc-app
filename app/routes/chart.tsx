import type { MetaFunction } from "@remix-run/node";
import { useState, useEffect } from "react";
import app, { db } from "~/lib/firebase";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Login from "~/components/Login";
import {
  ChartPanel,
  PanelLayout,
  LAYOUT_PRESETS,
} from "~/components/ChartPanel";
import { LayoutSelector } from "~/components/LayoutSelector";
import { saveLayout, loadLayout } from "~/utils/layoutPersistence";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
  ];
};

function ChartContent() {
  const { user } = useAuth();
  const [currentLayout, setCurrentLayout] = useState<PanelLayout>(
    LAYOUT_PRESETS.single
  );

  // Load saved layout on component mount
  useEffect(() => {
    const savedLayout = loadLayout();
    if (savedLayout) {
      setCurrentLayout(savedLayout);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLayoutChange = (newLayout: PanelLayout) => {
    setCurrentLayout(newLayout);
    saveLayout(newLayout); // Persist layout changes
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
          <div className="flex items-center justify-between mb-4">
            <LayoutSelector
              currentLayout={currentLayout}
              onLayoutChange={handleLayoutChange}
              className="ml-auto"
            />
          </div>
        </div>

        <div className="h-[calc(100vh-200px)] min-h-[600px] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <ChartPanel
            layout={currentLayout}
            onLayoutChange={handleLayoutChange}
            className="h-full"
          />
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Drag the panel dividers to resize charts. Switch layouts using the
            buttons above. Real-time data updates across all panels.
          </p>
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
