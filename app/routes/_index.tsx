import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useAuth } from "~/lib/auth-context";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";
import Accordion from "~/components/Accordion";
import FeatureCard from "~/components/FeatureCard";
import Footer from "~/components/Footer";
import { BarChart3, Code2, Brain } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Spot Canvas - Trading Charts Reimagined" },
    {
      name: "description",
      content:
        "Cutting-edge charting tools for traders seeking the ultimate market advantage",
    },
  ];
};

export default function Index() {
  const { user, loading } = useAuth();

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
                  Cutting-edge charting tools for traders seeking the ultimate
                  market advantage.
                </p>
                <div className="flex gap-4">
                  <Button
                    href="#features"
                    variant="primary"
                    size="lg"
                    className="inline-flex items-center gap-2"
                  >
                    Learn more
                  </Button>
                  {user && (
                    <Button
                      asLink
                      to="/chart"
                      variant="outline"
                      size="lg"
                      outlineColor="var(--color-accent-1)"
                      className="!px-8 !py-4 !text-base border-2 hover:!bg-accent-1/10 hover:!text-accent-1"
                    >
                      Open Charts
                    </Button>
                  )}
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
              Powerful tools and capabilities designed for professional traders
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Technical Analysis & Indicators"
              description="Analyze markets with essential drawing tools, prebuilt indicators, and flexible scripting features."
              timeline="H1/2025"
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <FeatureCard
              title="Custom Extensions"
              description="Extend charts with JavaScript, CSS, and Web Components. Build custom indicators using powerful APIs."
              timeline="H2/2025"
              icon={<Code2 className="w-6 h-6" />}
            />
            <FeatureCard
              title="AI-Insights"
              description="Gain deeper market understanding with AI-driven analysis of price movements and real-time alerts."
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
    answer:
      "Spot Canvas combines AI/machine learning with developer-friendly customization, focusing on seamless user experience. Our platform offers cutting-edge charting tools with powerful APIs for building custom indicators and extensions.",
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
      "Our roadmap includes: Q1/2025 - Technical Analysis & Indicators launch, H2/2025 - Custom Extensions with JavaScript/CSS/Web Components, H3/2025 - AI-Insights for market analysis, and H1/2026 - Advanced trading features and integrations.",
  },
  {
    question: "How do I change my plan?",
    answer:
      "Upgrading and downgrading can be done easily in your personal Dashboard. Simply navigate to the billing section and select your desired plan. Changes take effect immediately.",
  },
];
