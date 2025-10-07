import type { MetaFunction } from "@remix-run/node";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import {
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Twitter,
} from "lucide-react";
import ProtectedRoute from "~/components/ProtectedRoute";
import { useAuth } from "~/lib/auth-context";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";
import {
  getTwitterCredentials,
  deleteTwitterCredentials,
} from "~/services/accountRepository";
import { getAuth } from "firebase/auth";

export const meta: MetaFunction = () => {
  return [
    { title: "Settings - Spot Canvas" },
    { name: "description", content: "Manage your Spot Canvas settings" },
  ];
};

interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  username: string;
  userId: string;
}

function SettingsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, emailVerified } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<TwitterCredentials | null>(
    null
  );
  // Check for OAuth callback status (now handled entirely server-side)
  useEffect(() => {
    const twitterConnected = searchParams.get("twitter_connected");
    const errorParam = searchParams.get("error");

    if (twitterConnected === "true") {
      setSuccess("X (Twitter) account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      // Reload credentials
      loadCredentials();
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => setError(null), 5000);
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  // Load existing credentials
  const loadCredentials = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const saved = await getTwitterCredentials(user.uid);
      if (saved) {
        setCredentials(saved);
      }
    } catch (error) {
      console.error("Error loading Twitter credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, [user]);

  const handleConnectTwitter = async () => {
    if (!user) {
      setError("You must be logged in to connect X account");
      return;
    }

    if (!emailVerified) {
      setError("Please verify your email address before connecting X account");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const auth = getAuth();
      const idToken = await user.getIdToken();

      // Call OAuth initiation endpoint
      const response = await fetch("/api/twitter-auth", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate Twitter authorization");
      }

      const data = await response.json();

      // OAuth flow is now handled entirely server-side
      // Just redirect to Twitter authorization page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting Twitter:", error);
      setError(
        error instanceof Error ? error.message : "Failed to connect X account"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectTwitter = async () => {
    if (!user) return;

    if (
      !confirm("Are you sure you want to disconnect your X (Twitter) account?")
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteTwitterCredentials(user.uid);
      setCredentials(null);
      setSuccess("X (Twitter) account disconnected");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error disconnecting Twitter:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to disconnect X account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark relative overflow-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20">
        <h1 className="text-4xl font-bold mb-8 text-white">Settings</h1>

        {/* Email Verification Warning */}
        {user && !emailVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-yellow-500 font-medium">
                  Email verification required
                </p>
                <p className="text-yellow-500/80 text-sm mt-1">
                  Please verify your email address before managing settings.
                  Check your inbox for the verification link.
                </p>
                <Button
                  asLink
                  to="/verify-email"
                  variant="secondary"
                  className="mt-3"
                  size="sm"
                >
                  Go to Verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* X (Twitter) Integration */}
        <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            X (Twitter) Integration
          </h2>

          <p className="text-gray-400 mb-6">
            Connect your X (Twitter) account to share chart analysis and
            insights directly to your timeline.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : credentials ? (
            // Connected state
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-500 font-medium">Connected to X</p>
                  <p className="text-gray-400 text-sm">
                    @{credentials.username}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDisconnectTwitter}
                variant="secondary"
                disabled={isLoading}
                className="inline-flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Disconnect X Account
              </Button>
            </div>
          ) : (
            // Not connected state
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                onClick={handleConnectTwitter}
                variant="primary"
                disabled={isConnecting || isLoading}
                className="inline-flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Twitter className="h-4 w-4" />
                    Connect X Account
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-500">
                You'll be redirected to X (Twitter) to authorize Spot Canvas to
                post on your behalf.
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">
            Quick Links
          </h2>

          <div className="space-y-4">
            <Button
              asLink
              to="/billing"
              variant="secondary"
              className="inline-flex items-center gap-2"
            >
              Billing & Subscription
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>
  );
}

export default function SettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
