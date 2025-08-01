import type { MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import Button from "~/components/Button";
import AccountMenu from "~/components/AccountMenu";
import { useSubscription } from "~/contexts/SubscriptionContext";

export const meta: MetaFunction = () => {
  return [
    { title: "Welcome to Spot Canvas!" },
    { name: "description", content: "Your free trial has been activated" },
  ];
};

export default function ThankYouPage() {
  const navigate = useNavigate();
  const { refreshSubscription, status, plan, trialEndsAt } = useSubscription();

  // Refresh subscription data when landing on this page
  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Navigation */}
      <nav className="relative z-20 p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pricing-green rounded-sm"></div>
            <span className="text-white font-bold text-xl">Spot Canvas</span>
          </div>
          <AccountMenu />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-pricing-green/20 rounded-full blur-xl"></div>
              <CheckCircle className="relative h-24 w-24 text-pricing-green" />
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Spot Canvas {plan && plan !== 'none' ? (
              <span className="capitalize">{plan}</span>
            ) : ''}!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Your 7-day free trial has been activated successfully.
          </p>

          {/* Trial Details */}
          {status === 'trialing' && trialEndsAt && (
            <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-6 mb-8 inline-block">
              <p className="text-gray-400 mb-2">Your trial ends on</p>
              <p className="text-2xl font-semibold text-white">
                {new Date(trialEndsAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Features List */}
          <div className="mb-12">
            <p className="text-lg text-gray-300 mb-6">
              You now have access to {plan === 'starter' ? 'Starter' : 'Pro'} features:
            </p>
            <ul className="text-left inline-block space-y-3">
              {plan === 'starter' ? (
                <>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>4 trading symbols</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>Basic indicators</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>2 charts per layout</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>Essential trading tools</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>300+ crypto trading pairs</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>Advanced multi-chart layouts</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>Unlimited saved layouts</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="h-5 w-5 text-pricing-green flex-shrink-0" />
                    <span>All technical indicators</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => navigate('/chart')}
            variant="primary"
            size="lg"
            className="inline-flex items-center gap-3 text-lg px-8 py-4"
          >
            Go to Charts Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>

          {/* Additional Info */}
          <p className="mt-8 text-sm text-gray-500">
            You can manage your subscription anytime from your account menu
          </p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pricing-green/5 rounded-full blur-3xl"></div>
    </div>
  );
}