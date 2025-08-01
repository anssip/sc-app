import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useAuth } from "~/lib/auth-context";
import Login from "~/components/Login";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Spot" },
    {
      name: "description",
      content: "Financial charting for stocks & crypto",
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
      <Navigation showGetStarted={false} />

      <div className="container mx-auto px-6 max-w-6xl py-16">
        <header className="mb-20">
          <h1 className="text-5xl lg:text-7xl font-bold font-primary mb-6">
            <span className="text-white">Spot</span>{" "}
            <span className="text-accent-1">Canvas</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl leading-relaxed">
            A powerful <span className="text-accent-1">financial charting</span>{" "}
            application with cloud-based layout persistence, real-time
            synchronization, and
            <span className="text-accent-2">offline support</span>
          </p>
        </header>

        {/* Conditional navigation based on auth state */}
        {user ? (
          // Authenticated user navigation
          <nav className="mt-16 max-w-2xl">
            <p className="text-lg text-gray-300 mb-8">
              Welcome back! Your saved layouts and preferences are synced and
              ready.
            </p>
            <div className="flex flex-col gap-4">
              <Button asLink to="/chart" variant="primary" size="lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="text-black"
                >
                  <path
                    d="M3 13L6 10L10 14L17 7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                    fill="none"
                  />
                </svg>
                Open Chart Dashboard
              </Button>
              <div className="flex gap-4 mt-6">
                {resources.map(({ href, text, icon }) => (
                  <a
                    key={href}
                    className="group flex items-center gap-2 text-gray-300 hover:text-accent-1 transition-colors"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {icon}
                    {text}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        ) : (
          // Unauthenticated user navigation
          <nav className="mt-16">
            <div className="mb-8">
              <p className="text-xl text-gray-300 mb-8">
                Sign in to access{" "}
                <span className="text-accent-1">
                  professional trading charts
                </span>{" "}
                with cloud sync
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="bg-primary-dark-70 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6">
                  <div className="text-accent-1 text-2xl mb-3">💾</div>
                  <div className="font-medium text-white mb-2">
                    Save Layouts
                  </div>
                  <div className="text-gray-300">
                    Create and save custom chart arrangements
                  </div>
                </div>
                <div className="bg-primary-dark-70 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6">
                  <div className="text-accent-1 text-2xl mb-3">🔄</div>
                  <div className="font-medium text-white mb-2">
                    Real-time Sync
                  </div>
                  <div className="text-gray-300">
                    Access your layouts from any device
                  </div>
                </div>
                <div className="bg-primary-dark-70 backdrop-blur-sm border border-gray-500/20 rounded-lg p-6">
                  <div className="text-accent-1 text-2xl mb-3">📱</div>
                  <div className="font-medium text-white mb-2">
                    Offline Support
                  </div>
                  <div className="text-gray-300">
                    Works without internet connection
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-md">
              <Login
                title=""
                description=""
                showFeatures={true}
                layout="vertical"
                className="w-full"
              />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

const resources = [
  {
    href: "https://www.npmjs.com/package/@anssipiirainen/sc-charts",
    text: "SC Charts Docs",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-current"
      >
        <path
          d="M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "https://remix.run/docs",
    text: "Remix Docs",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-current"
      >
        <path
          d="M8.51851 12.0741L7.92592 18L15.6296 9.7037L11.4815 7.33333L12.0741 2L4.37036 10.2963L8.51851 12.0741Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];
