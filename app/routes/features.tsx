import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import Navigation from "~/components/Navigation";
import Button from "~/components/Button";
import Footer from "~/components/Footer";
import { getCacheHeaders, CacheProfiles } from "~/lib/cache.server";

export const loader: LoaderFunction = async () => {
  return json(
    {},
    {
      headers: getCacheHeaders(CacheProfiles.STATIC),
    }
  );
};

export const meta: MetaFunction = () => {
  return [
    { title: "SpotCanvas Features | Crypto Charting Platform" },
    {
      name: "description",
      content:
        "Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto.",
    },
  ];
};

const canonicalHref = () => {
  if (typeof window === "undefined") return "/features";
  return `${window.location.origin}/features`;
};

const setMetaTag = (name: string, content: string) => {
  let tag = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const ensureCanonical = (href: string) => {
  let link = document.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SpotCanvas Features",
  description:
    "Explore SpotCanvas features: multi-chart layouts, symbol manager, drawing tools, indicators, and advanced charting options for crypto analysis.",
  url: canonicalHref(),
};

type LightboxImageProps = { src: string; alt: string; caption?: string };

const LightboxImage = ({ src, alt, caption }: LightboxImageProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full my-8 overflow-hidden rounded-lg border border-white/30 shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-pricing-green"
        aria-label={`${alt} - open image`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto"
        />
      </button>

      {/* Simple modal implementation */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh] overflow-auto bg-dark-lighter rounded-lg p-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 p-2"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {caption && <p className="text-sm text-gray-400 mt-2">{caption}</p>}
          </div>
        </div>
      )}
    </>
  );
};

const FeatureCard = ({
  title,
  description,
  src,
  alt,
  items,
}: {
  title: string;
  description: string;
  src: string;
  alt: string;
  items: { label: string; desc: string }[];
}) => (
  <section
    className="rounded-2xl border border-white/20 p-8 md:p-10"
    style={{
      background: "linear-gradient(135deg, rgba(93, 91, 237, 0.15), rgba(147, 51, 234, 0.05), rgba(30, 30, 30, 0.9))",
      boxShadow: "0 0 20px rgba(93, 91, 237, 0.25), 0 0 40px rgba(147, 51, 234, 0.1)",
    }}
  >
    <h2 className="text-2xl font-semibold text-white">{title}</h2>
    <p className="mt-3 text-gray-400">{description}</p>
    <LightboxImage src={src} alt={alt} />
    <div className="mt-8 w-full">
      <ul className="list-disc pl-6 space-y-2 text-gray-400">
        {items.map((it) => (
          <li key={it.label}>
            <span
              className={`font-semibold ${
                it.label === "Availability"
                  ? "text-[var(--color-primary)]"
                  : "text-pricing-green"
              }`}
            >
              {it.label}
            </span>{" "}
            - {it.desc}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const Features = () => {
  useEffect(() => {
    const title = "SpotCanvas Features | Crypto Charting Platform";
    document.title = title;
    setMetaTag(
      "description",
      "Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto."
    );
    ensureCanonical(canonicalHref());

    // Open Graph basics
    setMetaTag("og:title", title);
    setMetaTag(
      "og:description",
      "Professional cryptocurrency charting with multi-chart layouts, indicators, drawing tools, and more."
    );

    // Structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Using local screenshots from public folder
  const IMAGES = {
    aiAssistant: "/screenshots/ai-assistant-analysis.png",
    multi: "/screenshots/multi-chart-layouts.png",
    symbols: "/screenshots/symbol-manager.png",
    trend: "/screenshots/trend-lines.png",
    indicators: "/screenshots/indicators.png",
    homeHero: "/hero-home.webp",
    panningZooming: "/screenshots/panning-zooming.gif",
    blockchain: "/screenshots/roadmap-blockchain-abstract.webp",
    layouts: "/screenshots/chart-layouts.gif",
  } as const;

  return (
    <div className="min-h-screen bg-dark">
      <Navigation showGetStarted={true} />

      <header className="container mx-auto px-4 pt-8 pb-4">
        <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
          <ol className="flex gap-2">
            <li>
              <Link to="/" className="underline-offset-4 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-white">Features</li>
          </ol>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            SpotCanvas Features
          </span>
        </h1>
        <p className="mt-2 text-gray-400 max-w-3xl">
          SpotCanvas is an AI-powered cryptocurrency charting platform designed
          for traders, market analysts and crypto enthusiasts.
        </p>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard
            title="AI-Powered Chart Assistant"
            description="Speed up technical analysis and facilitate learning through intelligent, conversational chart interactions. Our AI Spotlight assistant transforms complex market analysis into simple conversations."
            src={IMAGES.aiAssistant}
            alt="SpotCanvas AI Assistant analyzing BTC-USD with automated support and resistance levels"
            items={[
              {
                label: "Natural Language Control",
                desc: "Simply ask to change symbols, timeframes, or add indicators - no clicking required",
              },
              {
                label: "Automated Technical Analysis",
                desc: "Instant detection of support/resistance levels with confidence scores and visual markers",
              },
              {
                label: "Pattern Recognition",
                desc: "AI identifies different candle patterns automatically",
              },
              {
                label: "Divergende Detection",
                desc: "Detect divergencies between price and indicators like RSI and Volume",
              },
              {
                label: "Automatic highlighting in the chart",
                desc: "AI-detected patterns, divergencies, support/resistance levels are automatically highlighted in the chart.",
              },
              {
                label: "Real-Time Trading Insights",
                desc: "Get professional analysis and trading suggestions based on current chart data",
              },
              {
                label: "Interactive Chart Commands",
                desc: "Draw trend lines, enable indicators, switch granularities - all through conversation",
              },
              {
                label: "Historical Data Analysis",
                desc: "Analyze price movements across any timeframe with intelligent suggestions",
              },
              {
                label: "Visual Confidence Indicators",
                desc: "Line thickness, style, and markers show strength of identified levels at a glance",
              },
              {
                label: "One-Click Examples",
                desc: "Pre-built prompts help you discover the assistant's full capabilities instantly",
              },
            ]}
          />

          <FeatureCard
            title="Multi-Chart Layout Management"
            description="Monitor multiple markets simultaneously and compare correlations with flexible, customizable workspace arrangements tailored to your trading style."
            src={IMAGES.layouts}
            alt="SpotCanvas multi-chart layouts in a 2x2 grid view with individual toolbars"
            items={[
              {
                label: "Preset Layouts",
                desc: "Quick access to single, double, triple, and quadruple chart configurations",
              },
              {
                label: "Custom Layouts",
                desc: "Create and save personalized chart arrangements",
              },
              {
                label: "Resizable Panels",
                desc: "Drag panel borders to adjust chart sizes",
              },
              {
                label: "Nested Layouts",
                desc: "Split panels horizontally or vertically for complex arrangements",
              },
              {
                label: "Layout Persistence",
                desc: "Save and restore your favorite layouts with all settings intact",
              },
            ]}
          />

          <FeatureCard
            title="Symbol Management"
            description="Seamlessly navigate and track your preferred cryptocurrency pairs with real-time data and intelligent organization for efficient market monitoring."
            src={IMAGES.symbols}
            alt="Symbol Manager modal showing selected and available crypto pairs in SpotCanvas"
            items={[
              {
                label: "Extensive Coverage",
                desc: "Access all major cryptocurrency pairs",
              },
              {
                label: "Real-Time Data",
                desc: "Live price updates via WebSocket connections",
              },
              {
                label: "Favorites System",
                desc: "Quick access to frequently traded pairs",
              },
              {
                label: "Quick Search",
                desc: "Fast symbol lookup with intelligent filtering",
              },
              {
                label: "Multiple Timeframes",
                desc: "View data from 15-minute to daily granularities",
              },
              {
                label: "Cross-Chart Sync",
                desc: "Symbol synchronization across multiple charts (coming soon)",
              },
            ]}
          />

          <FeatureCard
            title="Trend Lines & Drawing Tools"
            description="Identify key market levels and patterns with precision drawing tools that persist across sessions, helping you track and validate your technical analysis."
            src={IMAGES.trend}
            alt="Drawing tools on a SpotCanvas chart with trend lines and inline toolbar"
            items={[
              {
                label: "Trend Lines",
                desc: "Draw support and resistance lines with precision",
              },
              {
                label: "Persistent Storage",
                desc: "All drawings are automatically saved to the cloud",
              },
              {
                label: "Chart-Specific",
                desc: "Each chart maintains its own set of drawings",
              },
              {
                label: "Multiple Line Styles",
                desc: "Customize appearance for different analysis types",
              },
              {
                label: "Snap-to-Price",
                desc: "Automatic alignment to important price levels (coming soon)",
              },
            ]}
          />

          <FeatureCard
            title="Technical Indicators"
            description="Make informed trading decisions with a comprehensive suite of technical analysis tools and customizable parameters to match your strategy."
            src={IMAGES.indicators}
            alt="SpotCanvas indicators including Bollinger Bands and MACD on a crypto chart"
            items={[
              {
                label: "Moving Averages",
                desc: "SMA and EMA with customizable periods",
              },
              {
                label: "Oscillators",
                desc: "RSI, MACD, and Stochastic indicators",
              },
              {
                label: "Volatility Indicators",
                desc: "Bollinger Bands and ATR",
              },
              {
                label: "Volume Analysis",
                desc: "Real-time volume tracking and visualization",
              },
              {
                label: "Multi-Indicator Support",
                desc: "Run multiple indicators simultaneously",
              },
              {
                label: "Custom Parameters",
                desc: "Adjust indicator settings to match your strategy (coming soon)",
              },
              {
                label: "Create your own indicators",
                desc: "Develop custom indicators using Python (coming soon)",
              },
            ]}
          />

          <div className="flex items-center justify-center">
            <img
              src="/logo/icon/purple.svg"
              alt="SpotCanvas Logo"
              className="w-48 h-48 opacity-50"
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard
            title="Advanced Charting Features"
            description="Experience professional-grade charting with high-performance rendering and intuitive controls for detailed market analysis and precise trade execution."
            src={IMAGES.panningZooming}
            alt="Advanced charting features including candlestick charts and crosshairs"
            items={[
              {
                label: "Candlestick Charts",
                desc: "Professional OHLC visualization",
              },
              {
                label: "Interactive Crosshairs",
                desc: "Precise price and time targeting",
              },
              {
                label: "Zoom & Pan",
                desc: "Smooth navigation through price history",
              },
              {
                label: "Touch Support",
                desc: "Full mobile and tablet compatibility",
              },
              {
                label: "Chart Types",
                desc: "Line, Area, and Bar charts (coming soon)",
              },
              {
                label: "Fullscreen Mode",
                desc: "Immersive chart viewing experience",
              },
              {
                label: "Full Window Mode",
                desc: "Maximize chart within the application",
              },
              {
                label: "Context Menus",
                desc: "Right-click access to chart options",
              },
              {
                label: "Resizable Indicator Panels",
                desc: "Adjust panel heights to your preference",
              },
              {
                label: "Real-Time Updates",
                desc: "Live candlestick formation and price updates",
              },
              {
                label: "High-Performance Rendering",
                desc: "Canvas-based rendering for smooth performance",
              },
              {
                label: "Historical Data",
                desc: "Access extensive price history for analysis",
              },
              { label: "Multiple Timeframes", desc: "1m–1d granularities" },
            ]}
          />

          <div id="road-ahead">
            <FeatureCard
              title="🚀 The Road Ahead: More AI-Assisted Features"
              description="Transform your trading workflow with upcoming AI-powered features that automate complex analysis, provide educational insights, and enhance decision-making."
              src={IMAGES.blockchain}
              alt="Abstract blockchain network illustration for SpotCanvas roadmap"
              items={[
                {
                  label: "Multi-Timeframe Analysis",
                  desc: "AI compares signals from daily vs hourly charts and can summarize across timeframes (e.g., short-term bullish, long-term bearish)",
                },
                {
                  label: "Risk/Reward Analysis",
                  desc: "Suggests stop-loss and take-profit levels based on chart context - 'If I enter at $2100 ETH, where should I set stops?'",
                },
                {
                  label: "Scenario Simulation",
                  desc: "AI overlays hypothetical moves like 'What if ETH retraces 15%?' and shows visual projection with marked zones",
                },
                {
                  label: "Strategy Testing Lite",
                  desc: "AI runs quick backtests of simple strategies (e.g., moving average crossover) on your historical candles and summarizes win rate/profit factor",
                },
                {
                  label: "Interactive Tutor Mode",
                  desc: "'Explain Like I'm 5' feature where AI walks users through TA concepts in context, not from random YouTube videos",
                },
                {
                  label: "Script Generator",
                  desc: "'Make me an indicator that highlights RSI divergences' - AI writes the code and runs it via the chart engine",
                },
                {
                  label: (
                    <span style={{ color: "var(--color-primary)" }}>
                      Availability
                    </span>
                  ),
                  desc: "Planned rollout throughout 2025-2026",
                },
              ]}
            />
          </div>
        </div>

        <div
          className="mt-16 rounded-2xl border border-white/20 p-8 text-center shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(143, 255, 0, 0.1), rgba(93, 215, 0, 0.05))",
          }}
        >
          <h3 className="text-2xl font-semibold text-white">
            Ready to chart smarter?
          </h3>
          <p className="mt-2 text-gray-400">
            Explore live charts in the dashboard.
          </p>
          <div className="mt-4">
            <Button asLink to="/chart" variant="primary" size="lg">
              Launch Dashboard
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 underline-offset-4 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
