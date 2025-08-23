import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ProtectedRoute from "~/components/ProtectedRoute";
import Login from "~/components/Login";
import { ChartApp } from "~/components/ChartApp";
import SubscriptionNotification from "~/components/SubscriptionNotification";
import SubscriptionLoader from "~/components/SubscriptionLoader";

export const meta: MetaFunction = () => {
  return [
    { title: "Chart - Spot Canvas App" },
    { name: "description", content: "Financial chart view" },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "theme-color", content: "#0F1117" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Return minimal data - actual subscription fetching happens client-side
  // This loader ensures the route is ready before rendering
  return json({ ready: true });
}

function ChartContent() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <SubscriptionLoader>
      <div className="h-screen-dvh flex flex-col bg-primary-dark">
        <div className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <SubscriptionNotification />
          </div>
          <ChartApp className="flex-1" />
        </div>
      </div>
    </SubscriptionLoader>
  );
}

export default function ChartRoute() {
  return (
    <ProtectedRoute
      fallback={
        <div className="min-h-screen-dvh flex items-center justify-center bg-primary-dark">
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
