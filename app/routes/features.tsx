import { useEffect, useState } from 'react'
import { Link } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/node'
import Navigation from '~/components/Navigation'
import Button from '~/components/Button'
import Footer from '~/components/Footer'

export const meta: MetaFunction = () => {
  return [
    { title: 'SpotCanvas Features | Crypto Charting Platform' },
    {
      name: 'description',
      content:
        'Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto.',
    },
  ]
}

const canonicalHref = () => {
  if (typeof window === 'undefined') return '/features'
  return `${window.location.origin}/features`
}

const setMetaTag = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const ensureCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'SpotCanvas Features',
  description:
    'Explore SpotCanvas features: multi-chart layouts, symbol manager, drawing tools, indicators, and advanced charting options for crypto analysis.',
  url: canonicalHref(),
}

type LightboxImageProps = { src: string; alt: string; caption?: string }

const LightboxImage = ({ src, alt, caption }: LightboxImageProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full my-8 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-pricing-green"
        aria-label={`${alt} - open image`}
      >
        <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full h-auto" />
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={src} alt={alt} className="w-full h-auto max-h-[80vh] object-contain" />
            {caption && <p className="text-sm text-gray-400 mt-2">{caption}</p>}
          </div>
        </div>
      )}
    </>
  )
}

const FeatureCard = ({
  title,
  src,
  alt,
  items,
}: {
  title: string
  src: string
  alt: string
  items: { label: string; desc: string }[]
}) => (
  <section className="rounded-2xl border border-gray-800 bg-dark-lighter/50 p-8 md:p-10 shadow-sm">
    <h2 className="text-2xl font-semibold text-white">{title}</h2>
    <LightboxImage src={src} alt={alt} />
    <div className="mt-2 w-full">
      <ul className="list-disc pl-6 space-y-2 text-gray-400">
        {items.map((it) => (
          <li key={it.label}>
            <span className="text-pricing-green font-semibold">{it.label}</span> - {it.desc}
          </li>
        ))}
      </ul>
    </div>
  </section>
)

const Features = () => {
  useEffect(() => {
    const title = 'SpotCanvas Features | Crypto Charting Platform'
    document.title = title
    setMetaTag(
      'description',
      'Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto.'
    )
    ensureCanonical(canonicalHref())

    // Open Graph basics
    setMetaTag('og:title', title)
    setMetaTag(
      'og:description',
      'Professional cryptocurrency charting with multi-chart layouts, indicators, drawing tools, and more.'
    )

    // Structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Using local screenshots from public folder
  const IMAGES = {
    multi: '/screenshots/multi-chart-layouts.png',
    symbols: '/screenshots/symbol-manager.png',
    trend: '/screenshots/trend-lines.png',
    indicators: '/screenshots/indicators.png',
    road: '/hero-home.webp', // Using existing hero image for roadmap
  } as const

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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-pricing-green to-primary bg-clip-text text-transparent">
          SpotCanvas Features
        </h1>
        <p className="mt-2 text-gray-400 max-w-3xl">
          SpotCanvas is a professional cryptocurrency charting platform designed for traders, market analysts and crypto
          enthusiasts.
        </p>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard
            title="📊 Multi-Chart Layout Management"
            src={IMAGES.multi}
            alt="SpotCanvas multi-chart layouts in a 2x2 grid view with individual toolbars"
            items={[
              { label: 'Preset Layouts', desc: 'Quick access to single, double, triple, and quadruple chart configurations' },
              { label: 'Custom Layouts', desc: 'Create and save personalized chart arrangements' },
              { label: 'Resizable Panels', desc: 'Drag panel borders to adjust chart sizes' },
              { label: 'Nested Layouts', desc: 'Split panels horizontally or vertically for complex arrangements' },
              { label: 'Layout Persistence', desc: 'Save and restore your favorite layouts with all settings intact' },
            ]}
          />

          <FeatureCard
            title="💱 Symbol Management"
            src={IMAGES.symbols}
            alt="Symbol Manager modal showing selected and available crypto pairs in SpotCanvas"
            items={[
              { label: 'Extensive Coverage', desc: 'Access all major cryptocurrency pairs' },
              { label: 'Real-Time Data', desc: 'Live price updates via WebSocket connections' },
              { label: 'Favorites System', desc: 'Quick access to frequently traded pairs' },
              { label: 'Quick Search', desc: 'Fast symbol lookup with intelligent filtering' },
              { label: 'Multiple Timeframes', desc: 'View data from 15-minute to daily granularities' },
              { label: 'Cross-Chart Sync', desc: 'Symbol synchronization across multiple charts (coming soon)' },
            ]}
          />

          <FeatureCard
            title="📈 Trend Lines & Drawing Tools"
            src={IMAGES.trend}
            alt="Drawing tools on a SpotCanvas chart with trend lines and inline toolbar"
            items={[
              { label: 'Trend Lines', desc: 'Draw support and resistance lines with precision' },
              { label: 'Persistent Storage', desc: 'All drawings are automatically saved to the cloud' },
              { label: 'Chart-Specific', desc: 'Each chart maintains its own set of drawings' },
              { label: 'Multiple Line Styles', desc: 'Customize appearance for different analysis types' },
              { label: 'Snap-to-Price', desc: 'Automatic alignment to important price levels (coming soon)' },
            ]}
          />

          <FeatureCard
            title="📉 Technical Indicators"
            src={IMAGES.indicators}
            alt="SpotCanvas indicators including Bollinger Bands and MACD on a crypto chart"
            items={[
              { label: 'Moving Averages', desc: 'SMA and EMA with customizable periods' },
              { label: 'Oscillators', desc: 'RSI, MACD, and Stochastic indicators' },
              { label: 'Volatility Indicators', desc: 'Bollinger Bands and ATR' },
              { label: 'Volume Analysis', desc: 'Real-time volume tracking and visualization' },
              { label: 'Multi-Indicator Support', desc: 'Run multiple indicators simultaneously' },
              { label: 'Custom Parameters', desc: 'Adjust indicator settings to match your strategy (coming soon)' },
              { label: 'Create your own indicators', desc: 'Develop custom indicators using Python (coming soon)' },
            ]}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard
            title="🎯 Advanced Charting Features"
            src={IMAGES.indicators}
            alt="Advanced charting features including candlestick charts and crosshairs"
            items={[
              { label: 'Candlestick Charts', desc: 'Professional OHLC visualization' },
              { label: 'Interactive Crosshairs', desc: 'Precise price and time targeting' },
              { label: 'Zoom & Pan', desc: 'Smooth navigation through price history' },
              { label: 'Touch Support', desc: 'Full mobile and tablet compatibility' },
              { label: 'Chart Types', desc: 'Line, Area, and Bar charts (coming soon)' },
              { label: 'Fullscreen Mode', desc: 'Immersive chart viewing experience' },
              { label: 'Full Window Mode', desc: 'Maximize chart within the application' },
              { label: 'Context Menus', desc: 'Right-click access to chart options' },
              { label: 'Resizable Indicator Panels', desc: 'Adjust panel heights to your preference' },
              { label: 'Real-Time Updates', desc: 'Live candlestick formation and price updates' },
              { label: 'High-Performance Rendering', desc: 'Canvas-based rendering for smooth performance' },
              { label: 'Historical Data', desc: 'Access extensive price history for analysis' },
              { label: 'Multiple Timeframes', desc: '1m–1d granularities' },
            ]}
          />

          <FeatureCard
            title="🔧 Platform Integration"
            src={IMAGES.multi}
            alt="SpotCanvas platform integration background hero"
            items={[
              { label: 'Chart API', desc: 'Programmatic control for external applications (coming soon)' },
              { label: 'TypeScript Support', desc: 'Full type definitions for developers (coming soon)' },
              { label: 'Event System', desc: 'Real-time notifications for state changes (coming soon)' },
              { label: 'React Components', desc: 'Ready-to-use components for integration (coming soon)' },
            ]}
          />

          <FeatureCard
            title="🚀 The Road Ahead: Professional Trading Tools and More"
            src={IMAGES.road}
            alt="Abstract blockchain network illustration for SpotCanvas roadmap"
            items={[
              { label: 'Multi-Asset Comparison', desc: 'Compare multiple cryptocurrencies side-by-side' },
              { label: 'Price Alerts', desc: 'Set notifications for price movements' },
              { label: 'Pattern Recognition', desc: 'Identify chart patterns automatically' },
              { label: 'Strategy Backtesting', desc: 'Test trading strategies on historical data' },
              { label: 'Export Capabilities', desc: 'Export chart images and data' },
              { label: 'Custom Indicators', desc: 'Create and save custom technical indicators' },
              { label: 'Watchlists', desc: 'Organize symbols into custom watchlists' },
              { label: 'Notes & Annotations', desc: 'Add text annotations to charts' },
              { label: 'Availability', desc: 'Planned availability during 2026' },
            ]}
          />
        </div>

        <div className="mt-16 rounded-2xl border border-gray-800 bg-gradient-to-r from-pricing-green/20 to-primary/20 p-8 text-center shadow-sm">
          <h3 className="text-2xl font-semibold text-white">Ready to chart smarter?</h3>
          <p className="mt-2 text-gray-400">Explore live charts in the dashboard.</p>
          <div className="mt-4">
            <Button asLink to="/chart" variant="primary" size="lg">
              Launch Dashboard
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/" className="inline-flex items-center text-gray-400 underline-offset-4 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Features