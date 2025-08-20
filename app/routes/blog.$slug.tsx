import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import Button from "~/components/Button";
import { getBlogPost, type BlogPost } from "~/lib/blog.server";
import { ArrowLeft } from "lucide-react";

interface LoaderData {
  post: BlogPost;
}

export const loader: LoaderFunction = async ({ params }) => {
  const slug = params.slug;

  if (!slug) {
    return redirect("/blog");
  }

  const post = await getBlogPost(slug);

  if (!post) {
    return redirect("/blog");
  }

  return json<LoaderData>({ post });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Post Not Found | Spot Canvas Blog" },
      {
        name: "description",
        content: "The requested blog post could not be found.",
      },
    ];
  }

  const { post } = data as LoaderData;

  return [
    { title: `${post.title} | Spot Canvas Blog` },
    { name: "description", content: post.excerpt },
    { name: "author", content: post.author },
    { property: "article:published_time", content: post.publishDate },
    { property: "article:author", content: post.author },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.excerpt },
    { property: "og:type", content: "article" },
    { property: "og:article:published_time", content: post.publishDate },
    { property: "og:article:author", content: post.author },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: post.title },
    { property: "twitter:description", content: post.excerpt },
  ];
};

export default function BlogPostPage() {
  const { post } = useLoaderData<LoaderData>();

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
            to="/blog"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          <article>
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {post.category}
                </span>
                <span className="text-gray-400">
                  {formatDate(post.publishDate)}
                </span>
                {post.readingTime && (
                  <span className="text-gray-400">• {post.readingTime}</span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {post.title}
              </h1>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm font-medium text-purple-400">
                    {post.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{post.author}</p>
                  <p className="text-sm text-gray-400">Spot Canvas Team</p>
                </div>
              </div>
            </header>

            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
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
          <div className="mt-16 pt-8 border-gray-800">
            <Link
              to="/blog"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all posts
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
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            author: {
              "@type": "Person",
              name: post.author,
            },
            datePublished: post.publishDate,
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
              "@id": `https://spotcanvas.com/blog/${post.slug}`,
            },
          }),
        }}
      />
    </>
  );
}
