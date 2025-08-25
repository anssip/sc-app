import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import { useAuth } from "~/lib/auth-context";
import { useSubscription } from "~/contexts/SubscriptionContext";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";
import Accordion from "~/components/Accordion";
import FeatureCard from "~/components/FeatureCard";
import Footer from "~/components/Footer";
import { getCacheHeaders, CacheProfiles } from "~/lib/cache.server";
import { BarChart3, Code2, Brain } from "lucide-react";

export const loader: LoaderFunction = async () => {
  return json(
    {},
    {
      headers: getCacheHeaders(CacheProfiles.HOMEPAGE),
    }
  );
};

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
        {/* Background curved lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Desktop curves - hidden on mobile, focused on left side */}
          <svg
            className="absolute top-0 left-0 w-full h-full hidden lg:block"
            viewBox="0 0 1600 800"
            preserveAspectRatio="none"
          >
            {/* Main flowing curve - curves around image area */}
            <path
              d="M -100 200 Q 400 100, 700 250 Q 900 350, 850 500"
              stroke="rgba(143, 255, 0, 0.2)"
              strokeWidth="3"
              fill="none"
            />
            {/* Left-focused curve below text */}
            <path
              d="M -50 350 Q 400 280, 600 380 Q 750 450, 700 550"
              stroke="rgba(143, 255, 0, 0.18)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Top accent curve - fades before image */}
            <path
              d="M -100 50 Q 600 150, 900 100 Q 950 90, 920 120"
              stroke="rgba(143, 255, 0, 0.25)"
              strokeWidth="3"
              fill="none"
            />
            {/* Below CTA area - prominent curve focused on left */}
            <path
              d="M -150 450 Q 400 380, 650 480 Q 780 530, 750 600"
              stroke="rgba(143, 255, 0, 0.22)"
              strokeWidth="4"
              fill="none"
            />
            {/* Below CTA area - secondary curve */}
            <path
              d="M -100 500 Q 350 420, 550 520 Q 700 580, 680 650"
              stroke="rgba(143, 255, 0, 0.16)"
              strokeWidth="3"
              fill="none"
            />
            {/* Right side framing curve - subtle, around image */}
            <path
              d="M 1200 100 Q 1350 200, 1400 350 Q 1450 500, 1500 650"
              stroke="rgba(143, 255, 0, 0.08)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Another right side framing curve */}
            <path
              d="M 1300 50 Q 1450 150, 1500 300 Q 1550 450, 1600 600"
              stroke="rgba(143, 255, 0, 0.06)"
              strokeWidth="1"
              fill="none"
            />
            {/* Bottom flowing curve - full width but subtle */}
            <path
              d="M -200 650 Q 300 600, 600 700 T 1200 650 T 1800 700"
              stroke="rgba(143, 255, 0, 0.1)"
              strokeWidth="2"
              fill="none"
            />
            {/* Left-heavy thick curve */}
            <path
              d="M -150 380 Q 450 320, 600 420 Q 720 500, 700 580"
              stroke="rgba(143, 255, 0, 0.12)"
              strokeWidth="5"
              fill="none"
            />
            {/* Additional left-focused curve 1 */}
            <path
              d="M -100 420 Q 500 360, 700 440 Q 800 480, 780 550"
              stroke="rgba(143, 255, 0, 0.14)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Additional left-focused curve 2 */}
            <path
              d="M -200 470 Q 400 400, 600 500 Q 750 560, 720 630"
              stroke="rgba(143, 255, 0, 0.15)"
              strokeWidth="3"
              fill="none"
            />
            {/* Subtle curve that goes behind image area */}
            <path
              d="M -100 250 Q 1000 180, 1650 280"
              stroke="rgba(143, 255, 0, 0.04)"
              strokeWidth="1"
              fill="none"
            />
            {/* Very subtle top curve */}
            <path
              d="M -50 150 Q 500 80, 800 180 Q 900 220, 880 280"
              stroke="rgba(143, 255, 0, 0.05)"
              strokeWidth="1"
              fill="none"
            />
            {/* Bold accent curve below CTA - left focused */}
            <path
              d="M -100 440 Q 450 370, 650 460 Q 750 510, 730 580"
              stroke="rgba(143, 255, 0, 0.28)"
              strokeWidth="2"
              fill="none"
            />
            {/* Bottom edge curve */}
            <path
              d="M -150 750 Q 400 680, 800 780 T 1750 750"
              stroke="rgba(143, 255, 0, 0.09)"
              strokeWidth="3"
              fill="none"
            />
          </svg>

          {/* Mobile/Tablet curves - shown on smaller screens */}
          <svg
            className="absolute top-0 left-0 w-full h-full lg:hidden"
            viewBox="0 0 800 1200"
            preserveAspectRatio="none"
          >
            {/* Mobile - Main flowing curve */}
            <path
              d="M -50 100 Q 200 50, 400 150 T 850 100"
              stroke="rgba(143, 255, 0, 0.2)"
              strokeWidth="2"
              fill="none"
            />
            {/* Mobile - Below title curve */}
            <path
              d="M -100 250 Q 300 200, 600 300 T 900 250"
              stroke="rgba(143, 255, 0, 0.15)"
              strokeWidth="2"
              fill="none"
            />
            {/* Mobile - Below CTA buttons curve */}
            <path
              d="M -50 400 Q 400 350, 850 450"
              stroke="rgba(143, 255, 0, 0.25)"
              strokeWidth="3"
              fill="none"
            />
            {/* Mobile - Mid section curve */}
            <path
              d="M -100 500 Q 300 450, 600 550 T 900 500"
              stroke="rgba(143, 255, 0, 0.18)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Mobile - Around image area curves (image is below on mobile) */}
            <path
              d="M -50 700 Q 400 650, 850 750"
              stroke="rgba(143, 255, 0, 0.12)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M -100 900 Q 400 850, 900 950"
              stroke="rgba(143, 255, 0, 0.08)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Mobile - Bottom curves */}
            <path
              d="M -50 1100 Q 400 1050, 850 1150"
              stroke="rgba(143, 255, 0, 0.1)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

        <div className="pt-20 pb-32 relative z-10">
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
              timeline="Available"
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <FeatureCard
              title="Multi-Chart Layouts"
              description="Arrange several charts in a single layout to compare and analyze market trends. Save your favorite layouts for quick access at any time."
              timeline="Available"
              icon={<Code2 className="w-6 h-6" />}
            />
            <FeatureCard
              title="All Maror Crypto Markets in a clear UX"
              description="We provide real-time data and analysis for all major crypto markets. We pride in providing the best User Experience in the market."
              timeline="Available"
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
