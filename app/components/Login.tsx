import { useState } from "react";
import GoogleSignInButton from "~/components/GoogleSignInButton";
import Button from "~/components/Button";

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
          <Button
            asLink
            to="/signin"
            variant="blue"
            fullWidth
          >
            Sign In
          </Button>
          <Button
            asLink
            to="/signup"
            variant="secondary"
            fullWidth
          >
            Create Account
          </Button>
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
        <Button
          asLink
          to="/signin"
          variant="blue"
          size="sm"
        >
          Sign In
        </Button>
        <Button
          asLink
          to="/signup"
          variant="primary"
          size="sm"
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
}