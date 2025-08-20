import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import BlogCard from "~/components/BlogCard";
import { getAllBlogPosts, type BlogPostMeta } from "~/lib/blog.server";
import { getCacheHeaders, CacheProfiles } from "~/lib/cache.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Blog | Spot Canvas - Trading Insights & Updates" },
    {
      name: "description",
      content:
        "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team.",
    },
    { property: "og:title", content: "Blog | Spot Canvas" },
    {
      property: "og:description",
      content:
        "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team.",
    },
    { property: "og:type", content: "website" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: "Blog | Spot Canvas" },
    {
      property: "twitter:description",
      content:
        "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team.",
    },
  ];
};

interface LoaderData {
  posts: BlogPostMeta[];
}

export const loader: LoaderFunction = async () => {
  const posts = await getAllBlogPosts();
  return json<LoaderData>(
    { posts },
    {
      headers: getCacheHeaders(CacheProfiles.BLOG_INDEX),
    }
  );
};

export default function BlogIndex() {
  const { posts } = useLoaderData<LoaderData>();

  return (
    <>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navigation />

        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4">
              Spot the Difference
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Insights, strategies, and analysis from the world of trading and
              finance
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                No blog posts yet. Check back soon for the latest insights and
                strategies.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>

              {posts.length < 3 && (
                <div className="mt-16 text-center">
                  <p className="text-gray-400">
                    Stay tuned for the latest insights and strategies.
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
            "@type": "Blog",
            name: "Spot Canvas Blog",
            description:
              "Trading insights, product updates, and market analysis",
            publisher: {
              "@type": "Organization",
              name: "Spot Canvas",
              logo: {
                "@type": "ImageObject",
                url: "https://spotcanvas.com/full-logo-white.svg",
              },
            },
            blogPost: posts.map((post) => ({
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt,
              author: {
                "@type": "Person",
                name: post.author,
              },
              datePublished: post.publishDate,
              url: `https://spotcanvas.com/blog/${post.slug}`,
            })),
          }),
        }}
      />
    </>
  );
}
