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
  const navigate = useNavigate();
  const { user, emailVerified, refreshUser, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) {
      console.log("Auth is loading, waiting...");
      return;
    }

    const checkVerification = async () => {
      if (!user) {
        // No user after auth has loaded, redirect to signup
        console.log("No user found after auth loaded, redirecting to signup");
        navigate("/signup");
        return;
      }

      console.log(
        "User found:",
        user.email,
        "emailVerified:",
        user.emailVerified
      );
      console.log("Context emailVerified:", emailVerified);

      // Force refresh user data to get latest verification status from Firebase
      await refreshUser();

      // Check both user.emailVerified and the context's emailVerified
      if (user.emailVerified || emailVerified) {
        try {
          console.log("Email is verified, updating Firestore and tracking");
          const { updateEmailVerificationStatus } = await import("~/lib/auth");
          await updateEmailVerificationStatus(user.uid, true);
          console.log("Email verification status updated - Customer.io will be synced automatically via Cloud Function");
        } catch (error) {
          console.error("Failed to update verification status:", error);
        }
        // Email is verified, show the welcome page
        setChecking(false);
      } else {
        console.log("Email not yet verified in Firebase Auth");
        // Force a hard refresh of the user object
        try {
          const { getAuth } = await import("firebase/auth");
          const auth = getAuth();
          if (auth.currentUser) {
            await auth.currentUser.reload();
            console.log(
              "After reload, emailVerified:",
              auth.currentUser.emailVerified
            );
            if (auth.currentUser.emailVerified) {
              // Update our state and Firestore
              const { updateEmailVerificationStatus } = await import(
                "~/lib/auth"
              );
              await updateEmailVerificationStatus(auth.currentUser.uid, true);
              window.location.reload(); // Force page reload to update auth context
            }
          }
        } catch (error) {
          console.error("Failed to reload user:", error);
        }
      }

      setChecking(false);
    };

    checkVerification();
  }, [user, navigate, refreshUser, loading, emailVerified]);

  const handleViewPricing = () => {
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
              Email <span className="text-accent-1">Verified!</span>
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
