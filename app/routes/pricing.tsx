import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import PricingCard from "~/components/PricingCard";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import SubscriptionExistsModal from "~/components/SubscriptionExistsModal";
import { useSubscription } from "~/contexts/SubscriptionContext";
import { useAuth } from "~/lib/auth-context";

export const meta: MetaFunction = () => {
  return [
    { title: "Pricing - Spot Canvas" },
    {
      name: "description",
      content:
        "Choose the perfect plan to match your needs and ambition. Start your free trial today!",
    },
  ];
};

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

export async function loader() {
  // This data would typically come from a database or API
  // For now, we're returning static data
  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: "$9",
      period: "Per month",
      features: ["Technical Analysis", "3 Indicators", "Asset Library"],
      buttonText: "Start Trial",
    },
    {
      name: "Pro",
      price: "$29",
      period: "Per month",
      features: [
        "All features of the Basic plan",
        "The Chart API",
        "Theming & Branding",
        "Interactive Data Visualization",
        "10 Indicators",
      ],
      buttonText: "Start Trial",
      popular: true,
    },
    {
      name: "Unlimited",
      price: "$199",
      period: "Per month",
      features: [
        "All features of the Basic and Standard plans",
        "AI - Insights",
        "Anomaly Detection & Alerts",
        "Unlimited number of indicators and assets",
      ],
      buttonText: "Start Trial",
    },
  ];

  return json({ plans });
}

export default function PricingPage() {
  const { plans } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscription = useSubscription();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleGetStarted = (planName: string) => {
    // Check if user is authenticated
    if (!user) {
      // If not authenticated, navigate to payment page which will redirect to signin
      navigate(`/payment-method?plan=${encodeURIComponent(planName)}`);
      return;
    }

    // Check if user has an existing subscription
    if (subscription && subscription.status !== 'none' && 
        subscription.status !== 'canceled' && 
        subscription.status !== 'incomplete' && 
        subscription.status !== 'incomplete_expired') {
      setShowSubscriptionModal(true);
      return;
    }

    // Navigate to payment method creation page
    navigate(`/payment-method?plan=${encodeURIComponent(planName)}`);
  };

  return (
    <>
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background graphics */}
        <div className="absolute inset-0 pointer-events-none">
        {/* Top right curved lines */}
        <svg
          className="absolute top-0 right-0 w-1/2 h-1/2"
          viewBox="0 0 800 400"
        >
          <path
            d="M 400 100 Q 600 150, 700 50"
            stroke="rgba(143, 255, 0, 0.1)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 300 200 Q 500 250, 750 100"
            stroke="rgba(143, 255, 0, 0.05)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Bottom left curved lines */}
        <svg
          className="absolute bottom-0 left-0 w-1/2 h-1/2"
          viewBox="0 0 800 400"
        >
          <path
            d="M 100 300 Q 300 250, 400 350"
            stroke="rgba(143, 255, 0, 0.1)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 50 200 Q 250 150, 300 300"
            stroke="rgba(143, 255, 0, 0.05)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Bitcoin icon placeholder */}
        <div className="absolute top-32 right-48 text-pricing-green/20 animate-spin-slow">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.04-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            Pricing <span className="text-pricing-green">Plans</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan to match your needs and ambition. All plans
            include a free 7-day trial period.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onGetStarted={() => handleGetStarted(plan.name)}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Footer */}
    <Footer variant="dark" />

    {/* Subscription Exists Modal */}
    <SubscriptionExistsModal
      isOpen={showSubscriptionModal}
      onClose={() => setShowSubscriptionModal(false)}
      subscriptionStatus={subscription?.status || 'none'}
      currentPlan={subscription?.plan || 'none'}
    />
  </>
  );
}
