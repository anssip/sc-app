import type { MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAuth } from "~/lib/auth-context";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Welcome to Spot Canvas" },
    {
      name: "description",
      content: "Your email has been verified successfully",
    },
  ];
};

export default function Welcome() {
  console.log("=== WELCOME PAGE COMPONENT RENDERED ===");

  const navigate = useNavigate();
  const { user, emailVerified, refreshUser, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log("Welcome page useEffect:", {
      loading,
      user: user?.email,
      hasChecked,
      checking,
      currentURL: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
    });
    // Prevent re-running if we've already checked
    if (hasChecked) {
      return;
    }

    // Don't do anything while auth is loading
    if (loading) {
      return;
    }

    const checkVerification = async () => {
      if (!user) {
        // No user yet - keep showing loading, don't redirect
        // The effect will run again when user becomes available
        console.log("Welcome page: No user yet, staying in loading state");
        setChecking(true);
        return;
      }

      console.log("Welcome page: User found, processing:", user.email);

      // Force refresh user data to get latest verification status from Firebase
      await refreshUser();

      // Update Firestore with verification status
      try {
        const { updateEmailVerificationStatus } = await import("~/lib/auth");
        await updateEmailVerificationStatus(user.uid, true);
        console.log("Welcome page: Updated email verification in Firestore");
      } catch (error) {
        console.error("Welcome page: Error updating Firestore:", error);
      }

      // Show the welcome page
      console.log("Welcome page: Showing welcome screen");
      setChecking(false);
      setHasChecked(true);
    };

    checkVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasChecked, user]); // Depend on user so we can detect when it becomes available

  const handleViewPricing = () => {
    // Clear the signup flag when user navigates away
    sessionStorage.removeItem('justCompletedSignup');
    navigate("/pricing");
  };

  // Always show loading while auth is loading or we're checking verification
  if (loading || checking) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-white">
          {loading ? "Loading authentication..." : "Verifying your email..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <Navigation showGetStarted={false} />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Success icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500/30 mb-8">
              <svg
                className="h-10 w-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold text-white">
              Your account <span className="text-accent-1">is ready</span>
            </h2>

            <p className="mt-4 text-gray-300">
              Welcome to Spot Canvas, {user?.email}
            </p>

            <p className="mt-6 text-gray-400">
              Your account has been successfully verified. You are a few clicks
              away from full access to all features.
            </p>
          </div>

          {/* What's next section */}
          <div className="bg-primary-light rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              What's next?
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Start your 7-day free trial to unlock all features</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Create and customize your trading charts</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Access real-time market data and indicators</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Save and share your chart configurations</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button onClick={handleViewPricing} variant="primary" fullWidth>
              View Plans and Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
