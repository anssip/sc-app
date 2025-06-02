import { Link } from "@remix-run/react";
import { useState } from "react";
import GoogleSignInButton from "~/components/GoogleSignInButton";

interface LoginProps {
  title?: string;
  description?: string;
  showFeatures?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}

export default function Login({
  title = "Authentication Required",
  description = "Please sign in to continue",
  showFeatures = false,
  layout = "horizontal",
  className = "",
}: LoginProps) {
  const [authError, setAuthError] = useState<string | null>(null);

  const features = [
    "Real-time cryptocurrency charts",
    "Technical indicators",
    "Portfolio tracking",
    "Live market data",
  ];

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center gap-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>

        {authError && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
            {authError}
          </div>
        )}

        {showFeatures && (
          <div className="text-center text-sm text-gray-500">
            <p className="font-medium mb-2">Features available after sign-in:</p>
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <GoogleSignInButton
            onError={setAuthError}
            className="w-full"
          />
          <Link
            to="/signin"
            className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end gap-3 ${className}`}>
      {authError && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
          {authError}
        </div>
      )}
      <div className="flex items-center gap-2">
        <GoogleSignInButton
          onError={setAuthError}
          className="px-3 py-1.5 text-xs"
        />
        <Link
          to="/signin"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}