import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import PricingCard from "~/components/PricingCard";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import SubscriptionExistsModal from "~/components/SubscriptionExistsModal";
import Accordion from "~/components/Accordion";
import { useSubscription } from "~/contexts/SubscriptionContext";
import { useAuth } from "~/lib/auth-context";
import { trackPricingView, trackStartTrialClick } from "~/lib/analytics";

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
      features: [
        "Asset library incl. saved symbols",
        "2 Indicators per chart",
        "2 Saved chart layouts",
        "Technical analysis",
        "All basic charting features",
      ],
      buttonText: "Start Trial",
    },
    {
      name: "Pro",
      price: "$29",
      period: "Per month",
      features: [
        "All features of the Starter plan",
        "Unlimited indicators per chart",
        "Unlimited chart layouts",
      ],
      buttonText: "Start Trial",
      popular: true,
    },
  ];

  return json({ plans });
}

const faqItems = [
  {
    question: "How does the free trial work?",
    answer:
      "You get a 7-day free trial with full access to the Pro plan features. Credit card is required to start your trial. You can cancel anytime during the trial period without any charges.",
  },
  {
    question: "What's the difference between Starter and Pro plans?",
    answer:
      "The Starter plan includes basic charting features with up to 2 indicators per chart and 2 saved layouts. The Pro plan offers unlimited indicators per chart and unlimited saved layouts.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to the new features. When downgrading, the change will take effect at the next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through Stripe.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Currently, we offer monthly billing only.",
  },
];

export default function PricingPage() {
  const { plans } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscription = useSubscription();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Track pricing page view
  useEffect(() => {
    trackPricingView();
  }, []);

  const handleGetStarted = (planName: string) => {
    // Track the Start Trial click with plan details
    const plan = plans.find((p) => p.name === planName);
    const price = plan ? parseInt(plan.price.replace("$", "")) : 0;
    trackStartTrialClick(planName, price);

    // Check if user is authenticated
    if (!user) {
      // If not authenticated, navigate to payment page which will redirect to signin
      navigate(`/payment-method?plan=${encodeURIComponent(planName)}`);
      return;
    }

    // Check if user has an existing subscription
    if (
      subscription &&
      subscription.status !== "none" &&
      subscription.status !== "canceled" &&
      subscription.status !== "incomplete" &&
      subscription.status !== "incomplete_expired"
    ) {
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
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl mb-6">
              Pricing <span className="text-pricing-green">Plans</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan to match your needs and ambition. Both
              plans include a free 7-day trial period. During the trial period,
              you will have access to the Pro plan features.
            </p>
          </div>

          {/* Pricing Cards with rotating icon */}
          <div className="relative">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
              {plans.map((plan, index) => (
                <div key={plan.name} className="relative">
                  <PricingCard
                    {...plan}
                    onGetStarted={() => handleGetStarted(plan.name)}
                  />
                  {/* Rotating logo icon - positioned at top-right corner of Pro plan card */}
                  {plan.popular && (
                    <div className="absolute -top-16 -right-16 md:-top-20 md:-right-20 lg:-top-24 lg:-right-24 opacity-20 animate-spin-slow z-0 pointer-events-none">
                      <img
                        src="/icon-logo-white.svg"
                        alt=""
                        className="w-32 md:w-40 lg:w-48"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section - with large vertical gap */}
          <div className="mt-64">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-gray-400">
                  Everything you need to know about our pricing and plans
                </p>
              </div>
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer variant="dark" />

      {/* Subscription Exists Modal */}
      <SubscriptionExistsModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        subscriptionStatus={subscription?.status || "none"}
        currentPlan={subscription?.plan || "none"}
      />
    </>
  );
}
