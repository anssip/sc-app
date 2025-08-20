import type { MetaFunction } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import { useAuth } from "~/lib/auth-context";
import { useSubscription } from "~/contexts/SubscriptionContext";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";
import Accordion from "~/components/Accordion";
import FeatureCard from "~/components/FeatureCard";
import Footer from "~/components/Footer";
import { BarChart3, Code2, Brain } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Spot Canvas - Trading charts for the on-chain generation" },
    {
      name: "description",
      content: "Trading charts for the on-chain generation",
    },
  ];
};

export default function Index() {
  const { user, loading } = useAuth();
  const { status: subscriptionStatus } = useSubscription();
  const navigate = useNavigate();

  // Determine CTA button behavior based on user state (same logic as Navigation)
  const getCtaButtonConfig = () => {
    if (!user) {
      // User not logged in
      return {
        label: "Get started",
        onClick: () => navigate("/signin"),
      };
    } else if (
      subscriptionStatus === "active" ||
      subscriptionStatus === "trialing"
    ) {
      // User is subscribed
      return {
        label: "Open Charts",
        onClick: () => navigate("/chart"),
      };
    } else {
      // User logged in but not subscribed
      return {
        label: "Get started",
        onClick: () => navigate("/pricing"),
      };
    }
  };

  const ctaButtonConfig = getCtaButtonConfig();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <h1 className="text-5xl lg:text-7xl text-white mb-8 font-primary whitespace-nowrap">
                  Trading Charts{" "}
                  <p className="text-accent-1 relative mt-4">
                    <span>Reimagined.</span>
                  </p>
                </h1>
                <p className="text-xl text-gray-200 my-8 leading-relaxed">
                  Trading charts, reimagined for the on-chain world.
                </p>
                <div className="flex gap-4">
                  <Button
                    to="/features"
                    variant="primary"
                    size="lg"
                    asLink
                    className="inline-flex text-center gap-2"
                  >
                    Learn more
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    outlineColor="var(--color-accent-1)"
                    className="!px-8 !py-4 !text-base border-2 hover:!bg-accent-1/10 hover:!text-accent-1"
                    onClick={ctaButtonConfig.onClick}
                  >
                    {ctaButtonConfig.label}
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-6 relative lg:-mr-6">
                <div className="relative lg:scale-150 lg:origin-left">
                  <img
                    src="/hero-home.webp"
                    alt="Spot Canvas Trading Charts"
                    className="rounded-xl shadow-2xl w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-1/20 to-transparent rounded-xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-primary">
              Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful tools and capabilities designed for crypto enthusiasts
              and traders.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Technical Analysis & Indicators"
              description="Analyze markets with essential drawing tools and prebuilt indicators."
              timeline="H1/2025"
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <FeatureCard
              title="Multi-Chart Layouts"
              description="Arrange several charts in a single layout to compare and analyze market trends. Save your favorite layouts for quick access at any time."
              timeline="H2/2025"
              icon={<Code2 className="w-6 h-6" />}
            />
            <FeatureCard
              title="All Maror Crypto Markets in a clear UX"
              description="We provide real-time data and analysis for all major crypto markets. We pride in providing the best User Experience in the market."
              timeline="H3/2025"
              icon={<Brain className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to know about Spot Canvas
            </p>
          </div>
          <Accordion items={faqItems} />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

const faqItems = [
  {
    question: "What's unique about Spot Canvas?",
    answer: `We have just gotten started with our journey to revolutionize the financial tooling. Our focus in cryptocurrencies trading and we are offering intuitive, easy-to-se use tools for this purpose. In the next phases we plan
      to provide insights derived from the blockhains directly to the charts. AI-powered insights and predictions are obviously in the focus too.
      `,
  },
  {
    question: "How does customer support work?",
    answer:
      "We provide email support with responses within 24 hours. You can reach us at info@spotcanvas.com for any questions or assistance you need.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. There are no long-term commitments, and you'll continue to have access until the end of your current billing period.",
  },
  {
    question: "What's the development roadmap?",
    answer:
      "Our roadmap includes: Q3-Q4/2025 - Blockchain Insights in the charts, Q1/2026 - Scriptable indicators, Q2/2026 - AI-powered market analysis and predictions",
  },
  {
    question: "How do I change my plan?",
    answer: (
      <>
        Upgrading and downgrading can be done easily in your personal{" "}
        <Link
          to="/billing"
          className="text-accent-1 hover:text-accent-2 underline"
        >
          Billing page
        </Link>
        . Changes take effect immediately.
      </>
    ),
  },
];
