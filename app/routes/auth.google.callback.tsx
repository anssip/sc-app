import type { MetaFunction } from "@remix-run/node";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { getAuth, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "~/lib/firebase";

export const meta: MetaFunction = () => {
  return [
    { title: "Completing Sign In - Spot Canvas" },
    { name: "description", content: "Completing your Google sign-in" },
  ];
};

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Processing sign-in...");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const auth = getAuth();
        setStatus("Completing Google sign-in...");

        const result = await getRedirectResult(auth);

        if (!result) {
          // No redirect result - user may have navigated here directly
          setError("No sign-in detected. Redirecting...");
          setIsProcessing(false);
          setTimeout(() => navigate("/signup"), 2000);
          return;
        }

        const user = result.user;
        console.log("Google sign-in successful for:", user.email);

        // Get state from URL params (most reliable), then sessionStorage, then localStorage
        let isSignup = false;
        let marketingConsent = false;
        let redirectTo = "/";

        try {
          let storedState = null;
          let source = 'none';

          // 1. Try URL params first (passed from signup/signin pages)
          const urlState = searchParams.get('authState');
          if (urlState) {
            storedState = decodeURIComponent(urlState);
            source = 'URL params';
          }

          // 2. Fall back to sessionStorage (works for localhost)
          if (!storedState) {
            storedState = sessionStorage.getItem('googleAuthState');
            if (storedState) source = 'sessionStorage';
          }

          // 3. Fall back to localStorage (production Safari)
          if (!storedState) {
            storedState = localStorage.getItem('googleAuthState');
            source = 'localStorage';

            // Check if localStorage data is recent (within last 5 minutes)
            const stateTime = localStorage.getItem('googleAuthStateTime');
            if (stateTime) {
              const age = Date.now() - parseInt(stateTime);
              if (age > 5 * 60 * 1000) {
                console.warn("localStorage auth state is too old, ignoring");
                storedState = null;
              }
            }
          }

          console.log(`Raw stored state from ${source}:`, storedState);

          if (storedState) {
            const stateData = JSON.parse(storedState);
            isSignup = stateData.isSignup || false;
            marketingConsent = stateData.marketingConsent || false;
            redirectTo = stateData.redirectTo || "/";
            console.log("Retrieved auth state:", { isSignup, marketingConsent, redirectTo, source });

            // Clean up all storages
            sessionStorage.removeItem('googleAuthState');
            sessionStorage.removeItem('processedCallback');
            localStorage.removeItem('googleAuthState');
            localStorage.removeItem('googleAuthStateTime');
          } else {
            console.warn("No googleAuthState found in URL, sessionStorage, or localStorage");
          }
        } catch (e) {
          console.error("Failed to parse stored state:", e);
        }

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userExists = userDoc.exists();

        console.log("User check:", { uid: user.uid, userExists, isSignup });
        setStatus("Setting up your account...");

        // IMPORTANT: If no state was found, determine signup based on user existence
        // This is the fallback for Safari iOS where storage might be blocked
        const isActuallySignup = !userExists || isSignup;
        const actualMarketingConsent = userExists && userDoc.data()?.marketingConsent
          ? userDoc.data()?.marketingConsent
          : marketingConsent;

        console.log("Final decision:", {
          isActuallySignup,
          actualMarketingConsent,
          stateFound: isSignup !== false || marketingConsent !== false
        });

        // If this is a new user or we're in signup flow, save preferences
        if (isActuallySignup) {
          console.log("Creating/updating user - new user or signup flow");
          await setDoc(
            userDocRef,
            {
              email: user.email,
              marketingConsent: actualMarketingConsent,
              consentTimestamp: serverTimestamp(),
              emailVerified: true, // Google users have verified emails
              createdAt: userExists ? userDoc.data()?.createdAt : serverTimestamp(),
            },
            { merge: true }
          );
          console.log("User preferences saved, redirecting to /welcome");

          // Set a flag to indicate we're sending user to welcome (not a redirect loop)
          sessionStorage.setItem('justCompletedSignup', 'true');

          // New users go to welcome page
          // Use window.location to force a full page load and avoid Remix navigation issues
          window.location.href = "/welcome";
        } else {
          // Existing user signing in
          console.log("Existing user signing in, redirecting to:", redirectTo);
          window.location.href = redirectTo;
        }
      } catch (err: any) {
        console.error("Error handling Google redirect:", err);
        setError(err.message || "Failed to complete sign-in");
        setStatus("Sign-in failed");
        setIsProcessing(false);

        // Redirect to signup after showing error
        setTimeout(() => {
          navigate("/signup");
        }, 3000);
      }
    };

    handleGoogleRedirect();
  }, [navigate]);

  // Don't render anything until we've started processing
  // This prevents any flash of error state
  if (isProcessing && !error) {
    return null;
  }

  // Only show error UI if there's actually an error
  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-8">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Sign-in Failed</h2>
            <p className="text-red-400">{error}</p>
            <p className="text-gray-400 mt-4">Redirecting you back...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show minimal screen while processing (will redirect immediately)
  return (
    <div className="min-h-screen bg-primary-dark"></div>
  );
}
