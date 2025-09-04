import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import ManualCard from "~/components/ManualCard";
import { getAllManualEntries, type ManualEntryMeta } from "~/lib/manual.server";
import { getCacheHeaders, CacheProfiles } from "~/lib/cache.server";

export const meta: MetaFunction = () => {
  return [
    { title: "User Manual | Spot Canvas - Learn How to Trade" },
    {
      name: "description",
      content:
        "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features.",
    },
    { property: "og:title", content: "User Manual | Spot Canvas" },
    {
      property: "og:description",
      content:
        "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features.",
    },
    { property: "og:type", content: "website" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: "User Manual | Spot Canvas" },
    {
      property: "twitter:description",
      content:
        "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features.",
    },
  ];
};

interface LoaderData {
  entries: ManualEntryMeta[];
}

export const loader: LoaderFunction = async () => {
  const entries = await getAllManualEntries();
  return json<LoaderData>(
    { entries },
    {
      headers: getCacheHeaders(CacheProfiles.MANUAL_INDEX),
    }
  );
};

export default function ManualIndex() {
  const { entries } = useLoaderData<LoaderData>();

  return (
    <>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />

        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4">
              User Manual
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about using Spot Canvas effectively
            </p>
          </header>

          {entries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                No manual entries available yet. Check back soon for comprehensive guides.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {entries.map((entry) => (
                  <ManualCard key={entry.slug} entry={entry} />
                ))}
              </div>

              {entries.length < 3 && (
                <div className="mt-16 text-center">
                  <p className="text-gray-400">
                    More guides and documentation coming soon.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer variant="dark" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Spot Canvas User Manual",
            description:
              "Comprehensive documentation and guides for using Spot Canvas trading platform",
            publisher: {
              "@type": "Organization",
              name: "Spot Canvas",
              logo: {
                "@type": "ImageObject",
                url: "https://spotcanvas.com/full-logo-white.svg",
              },
            },
            hasPart: entries.map((entry) => ({
              "@type": "TechArticle",
              headline: entry.title,
              description: entry.excerpt,
              author: {
                "@type": "Person",
                name: entry.author,
              },
              datePublished: entry.publishDate,
              url: `https://spotcanvas.com/manual/${entry.slug}`,
            })),
          }),
        }}
      />
    </>
  );
}