import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import Button from "~/components/Button";
import { getManualEntry, type ManualEntry } from "~/lib/manual.server";
import { getCacheHeaders, CacheProfiles } from "~/lib/cache.server";
import { ArrowLeft } from "lucide-react";

interface LoaderData {
  entry: ManualEntry;
}

export const loader: LoaderFunction = async ({ params }) => {
  const slug = params.slug;

  if (!slug) {
    return redirect("/manual");
  }

  const entry = await getManualEntry(slug);

  if (!entry) {
    return redirect("/manual");
  }

  return json<LoaderData>(
    { entry },
    {
      headers: getCacheHeaders(CacheProfiles.MANUAL_ENTRY),
    }
  );
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Page Not Found | Spot Canvas User Manual" },
      {
        name: "description",
        content: "The requested manual page could not be found.",
      },
    ];
  }

  const { entry } = data as LoaderData;

  return [
    { title: `${entry.title} | Spot Canvas User Manual` },
    { name: "description", content: entry.excerpt },
    { name: "author", content: entry.author },
    { property: "article:published_time", content: entry.publishDate },
    { property: "article:author", content: entry.author },
    { property: "og:title", content: entry.title },
    { property: "og:description", content: entry.excerpt },
    { property: "og:type", content: "article" },
    { property: "og:article:published_time", content: entry.publishDate },
    { property: "og:article:author", content: entry.author },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: entry.title },
    { property: "twitter:description", content: entry.excerpt },
  ];
};

export default function ManualEntryPage() {
  const { entry } = useLoaderData<LoaderData>();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />

        <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20">
          <Link
            to="/manual"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Manual
          </Link>

          <article>
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  {entry.category}
                </span>
                <span className="text-gray-400">
                  Last updated: {formatDate(entry.publishDate)}
                </span>
                {entry.readingTime && (
                  <span className="text-gray-400">• {entry.readingTime}</span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {entry.title}
              </h1>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm font-medium text-green-400">
                    {entry.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{entry.author}</p>
                  <p className="text-sm text-gray-400">Spot Canvas Team</p>
                </div>
              </div>
            </header>

            <div
              className="manual-content prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </article>

          <div
            className="mt-16 rounded-2xl border border-white/20 p-8 text-center shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(143, 255, 0, 0.1), rgba(93, 215, 0, 0.05))",
            }}
          >
            <h3 className="text-2xl font-semibold text-white">
              Ready to start trading?
            </h3>
            <p className="mt-2 text-gray-400">
              Put your knowledge into practice with our professional charting tools.
            </p>
            <div className="mt-4">
              <Button asLink to="/chart" variant="primary" size="lg">
                Launch Dashboard
              </Button>
            </div>
          </div>
          <div className="mt-16 pt-8 border-gray-800">
            <Link
              to="/manual"
              className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all guides
            </Link>
          </div>
        </main>
      </div>

      <Footer variant="dark" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: entry.title,
            description: entry.excerpt,
            author: {
              "@type": "Person",
              name: entry.author,
            },
            datePublished: entry.publishDate,
            publisher: {
              "@type": "Organization",
              name: "Spot Canvas",
              logo: {
                "@type": "ImageObject",
                url: "https://spotcanvas.com/full-logo-white.svg",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://spotcanvas.com/manual/${entry.slug}`,
            },
          }),
        }}
      />

      <style jsx>{`
        .manual-content {
          color: #e5e7eb;
        }
        .manual-content h1,
        .manual-content h2,
        .manual-content h3,
        .manual-content h4,
        .manual-content h5,
        .manual-content h6 {
          color: #ffffff;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .manual-content h1 {
          font-size: 2.25rem;
        }
        .manual-content h2 {
          font-size: 1.875rem;
        }
        .manual-content h3 {
          font-size: 1.5rem;
        }
        .manual-content p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
        }
        .manual-content ul,
        .manual-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .manual-content li {
          margin-bottom: 0.5rem;
        }
        .manual-content strong {
          color: #ffffff;
          font-weight: 600;
        }
        .manual-content code {
          background-color: rgba(143, 255, 0, 0.1);
          color: #8fff00;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .manual-content pre {
          background-color: #1a1a1a;
          border: 1px solid rgba(143, 255, 0, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .manual-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .manual-content table {
          width: 100%;
          margin-bottom: 1.25rem;
          border-collapse: collapse;
        }
        .manual-content th {
          background-color: rgba(143, 255, 0, 0.1);
          color: #ffffff;
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border: 1px solid rgba(143, 255, 0, 0.2);
        }
        .manual-content td {
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .manual-content blockquote {
          border-left: 4px solid #8fff00;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 1.25rem;
          font-style: italic;
          color: #9ca3af;
        }
        .manual-content a {
          color: #8fff00;
          text-decoration: underline;
        }
        .manual-content a:hover {
          color: #a3ff33;
        }
      `}</style>
    </>
  );
}