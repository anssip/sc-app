import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Login from "~/components/Login";
import { useState } from "react";

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
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <div className="flex justify-between items-center w-full max-w-4xl">
            <h1 className="leading text-4xl font-bold text-gray-800 dark:text-gray-100">
              Spot Canvas App
            </h1>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    Welcome, {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Login layout="horizontal" />
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl">
            A powerful financial charting application built with Remix and
            sc-charts
          </p>
        </header>

        {/* Conditional navigation based on auth state */}
        {user ? (
          // Authenticated user navigation
          <nav className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
            <p className="leading-6 text-gray-700 dark:text-gray-200">
              Welcome back! Ready to start trading?
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/chart"
                className="group flex items-center gap-3 self-stretch p-4 leading-normal text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="text-white"
                >
                  <path
                    d="M3 13L6 10L10 14L17 7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                    fill="none"
                  />
                </svg>
                Open Trading Chart
              </Link>
              <ul>
                {resources.map(({ href, text, icon }) => (
                  <li key={href}>
                    <a
                      className="group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500"
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {icon}
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        ) : (
          // Unauthenticated user navigation
          <nav className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
            <p className="leading-6 text-gray-700 dark:text-gray-200">
              Sign in to access professional trading charts
            </p>
            <Login
              title=""
              description=""
              showFeatures={true}
              layout="vertical"
              className="w-full max-w-sm"
            />
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
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
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
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
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
