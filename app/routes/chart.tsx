import type { MetaFunction } from "@remix-run/node";
import ProtectedRoute from "~/components/ProtectedRoute";
import Login from "~/components/Login";
import { ChartApp } from "~/components/ChartApp";
import SubscriptionNotification from "~/components/SubscriptionNotification";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
  ];
};

function ChartContent() {
  return (
    <div className="h-screen flex flex-col bg-primary-dark">
      <div className="h-full flex flex-col">
        <div className="px-6 pt-4">
          <SubscriptionNotification />
        </div>
        <ChartApp className="flex-1" />
      </div>
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
