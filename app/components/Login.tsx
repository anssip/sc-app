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
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-300 mb-4">{description}</p>
        </div>

        {authError && (
          <div className="text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded">
            {authError}
          </div>
        )}

        {showFeatures && (
          <div className="text-center text-sm text-gray-300">
            <p className="font-medium mb-2 text-white">Features available after sign-in:</p>
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
            className="w-full text-center px-4 py-2 text-sm font-medium text-primary-dark bg-accent-1 border border-transparent rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-accent-1"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-transparent border border-gray-500 rounded-md hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-gray-500"
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
        <div className="text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded">
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
          className="px-4 py-2 text-sm font-medium text-white bg-transparent border border-gray-500 rounded-md hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-gray-500"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-4 py-2 text-sm font-medium text-primary-dark bg-accent-1 border border-transparent rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-accent-1"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}