import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import AccountMenu from "~/components/AccountMenu";
import SimplePaymentForm from "~/components/SimplePaymentForm";
import Footer from "~/components/Footer";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useSubscription } from "~/contexts/SubscriptionContext";
import Button from "~/components/Button";

export const meta: MetaFunction = () => {
  return [
    { title: "Payment Method - Spot Canvas" },
    { name: "description", content: "Set up your payment method for Spot Canvas" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan") || "pro";
  
  // Map plan names to Stripe price IDs
  const priceIds = {
    starter: "price_1Rnw6qS4gOnN3XylL2vxTZWd", // $14/month
    pro: "price_1RnwAnS4gOnN3Xyl1wfddJBD", // $39/month
  };
  
  // Note: In a real implementation, you would create the Setup Intent server-side
  // and return the client secret here. For now, we'll create it client-side.
  
  return json({ 
    selectedPlan,
    priceId: priceIds[selectedPlan.toLowerCase() as keyof typeof priceIds] || priceIds.pro,
  });
}


export default function PaymentMethodPage() {
  const { selectedPlan, priceId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const subscription = useSubscription();
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  
  // Get the publishable key from Vite env vars on the client side
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

  useEffect(() => {
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey]);

  // Check if user has an active subscription
  const hasActiveSubscription = subscription && 
    subscription.status !== 'none' && 
    subscription.status !== 'canceled' && 
    subscription.status !== 'incomplete' && 
    subscription.status !== 'incomplete_expired';

  const getSubscriptionMessage = () => {
    if (!subscription) return '';
    
    switch (subscription.status) {
      case 'trialing':
        return `You're currently on a free trial of the ${subscription.plan} plan.`;
      case 'active':
        return `You already have an active ${subscription.plan} subscription.`;
      case 'past_due':
        return `Your ${subscription.plan} subscription has a payment issue that needs to be resolved.`;
      default:
        return `You already have a ${subscription.plan} subscription.`;
    }
  };

  return (
    <ProtectedRoute>
      <>
        <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-20 p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/full-logo-white.svg" 
              alt="Spot Canvas" 
              className="h-10"
            />
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/pricing")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back to Pricing
            </button>
            <AccountMenu />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-20">
        <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Payment Method</h1>
          
          {hasActiveSubscription ? (
            <>
              <div className="bg-accent-1/10 border border-accent-1/30 rounded-lg p-6 mb-6">
                <h3 className="text-accent-1 font-medium mb-2">You Already Have a Subscription</h3>
                <p className="text-gray-400 mb-4">
                  {getSubscriptionMessage()}
                </p>
                <p className="text-gray-500 text-sm">
                  Visit your billing page to manage your subscription, update payment methods, or view invoices.
                </p>
              </div>
              
              <Button
                onClick={() => navigate('/billing')}
                variant="primary"
                fullWidth
              >
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-8">
                You selected the <span className="text-pricing-green font-semibold capitalize">{selectedPlan}</span> plan
              </p>
              
              {publishableKey && stripePromise ? (
                <Elements 
                  stripe={stripePromise}
                  options={{
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#66ff66',
                        colorBackground: '#000000',
                        colorText: '#ffffff',
                        colorDanger: '#ff5555',
                        fontFamily: 'system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <SimplePaymentForm priceId={priceId} selectedPlan={selectedPlan} />
                </Elements>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-yellow-500 font-medium mb-2">Stripe Configuration Required</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    To enable payment processing, please set the VITE_STRIPE_PUBLISHABLE_KEY environment variable.
                  </p>
                  <p className="text-gray-500 text-xs">
                    Add your Stripe publishable key to your .env file:
                    <br />
                    <code className="text-gray-300">VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</code>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
    </div>

    {/* Footer */}
    <Footer />
      </>
    </ProtectedRoute>
  );
}