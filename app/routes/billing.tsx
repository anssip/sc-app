import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useSubscription } from "~/contexts/SubscriptionContext";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Billing - Spot Canvas" },
    { name: "description", content: "Manage your Spot Canvas subscription" },
  ];
};

function BillingContent() {
  const navigate = useNavigate();
  const { status, plan, trialEndsAt, subscriptionId, refreshSubscription } =
    useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivateSubscription = async () => {
    if (!subscriptionId) {
      setError("No subscription ID found");
      return;
    }

    setIsActivating(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to activate subscription");
      }

      const idToken = await user.getIdToken();

      // Call the activate endpoint
      const response = await fetch(
        `https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/${subscriptionId}/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate subscription");
      }

      // If there's a client secret, we need to handle payment confirmation
      if (data.client_secret) {
        // For now, just inform the user that payment is required
        setError(
          "Payment confirmation required. Please use the Manage Billing option to update your payment method."
        );
      } else {
        // Subscription activated successfully
        await refreshSubscription(); // Refresh subscription status
        setError(null);
        // Show success message
        alert("Subscription activated successfully!");
      }
    } catch (error) {
      console.error("Activation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to activate subscription"
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to manage billing");
      }

      const idToken = await user.getIdToken();

      // Create customer portal session
      const response = await fetch(
        "https://billing-server-346028322665.europe-west1.run.app/api/customer/portal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            return_url: window.location.href,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Billing portal error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to open billing portal"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark relative overflow-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Billing & Subscription
        </h1>

        {/* Current Plan */}
        <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            Current Plan
          </h2>

          {status === "none" ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-6">
                You don't have an active subscription.
              </p>
              <Button asLink to="/pricing" variant="primary">
                View Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {plan === "pro" ? (
                    <img
                      src="/icon-crown.svg"
                      alt="Pro Plan"
                      className="h-12 w-12 text-pricing-green"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(379%) hue-rotate(70deg) brightness(104%) contrast(98%)",
                      }}
                    />
                  ) : (
                    <img
                      src="/icon-zap.svg"
                      alt="Basic Plan"
                      className="h-12 w-12 text-blue-500"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(49%) sepia(100%) saturate(2419%) hue-rotate(190deg) brightness(103%) contrast(102%)",
                      }}
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white capitalize">
                      {plan} Plan
                    </h3>
                    <p className="text-gray-400">
                      {plan === "pro" ? "$39/month" : "$14/month"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {status === "trialing" && trialEndsAt && (
                    <div>
                      <p className="text-yellow-500 font-medium">
                        Trial Period
                      </p>
                      <p className="text-gray-400 text-sm">
                        Ends {new Date(trialEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {status === "active" && (
                    <span className="text-pricing-green font-medium">
                      Active
                    </span>
                  )}
                  {status === "canceled" && (
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-red-500 font-medium">Canceled</span>
                      <Button
                        onClick={handleActivateSubscription}
                        variant="primary"
                        disabled={isActivating}
                        size="sm"
                        className="inline-flex items-center gap-2"
                      >
                        {isActivating ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    </div>
                  )}
                  {status === "past_due" && (
                    <span className="text-orange-500 font-medium">
                      Past Due
                    </span>
                  )}
                  {status === "incomplete" && (
                    <span className="text-yellow-500 font-medium">
                      Incomplete
                    </span>
                  )}
                </div>
              </div>

              {/* Plan Features */}
              <div className="border-t border-gray-800 pt-6">
                <h4 className="text-lg font-medium mb-4 text-white">
                  Your plan includes:
                </h4>
                <ul className="space-y-2">
                  {plan === "pro" ? (
                    <>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-pricing-green">✓</span>
                        300+ crypto trading pairs
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-pricing-green">✓</span>
                        Advanced multi-chart layouts
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-pricing-green">✓</span>
                        Unlimited saved layouts
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-pricing-green">✓</span>
                        All indicators
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-blue-500">✓</span>4 trading
                        symbols
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-blue-500">✓</span>
                        Basic indicators
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-blue-500">✓</span>2 charts per
                        layout
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Billing Management */}
        {status !== "none" && (
          <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Manage Subscription
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <p className="text-gray-400 mb-6">
              Access the Stripe Customer Portal to update your payment method,
              download invoices, change your plan, or cancel your subscription.
            </p>

            <Button
              onClick={handleManageBilling}
              variant="primary"
              disabled={isLoading}
              className="inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  Manage Billing
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
    </div>
  );
}

export default function BillingRoute() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}
