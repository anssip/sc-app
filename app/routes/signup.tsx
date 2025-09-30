import type { MetaFunction } from "@remix-run/node";
import { useNavigate, useSearchParams } from "@remix-run/react";
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { signUp, signInWithGoogle, getErrorMessage, saveUserPreferences, handleGoogleRedirectResult } from "~/lib/auth";
import { useAuth } from "~/lib/auth-context";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up - Spot Canvas" },
    { name: "description", content: "Create your account" },
  ];
};

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    marketingConsent: false,
    termsAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize hooks after state
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Check if user came from pricing/payment flow
  const fromPricing = searchParams.get('from') === 'pricing';
  const redirectTo = searchParams.get('redirect') || '/';

  // Handle Google redirect result after returning from Google authentication
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const redirectUser = await handleGoogleRedirectResult();
        if (redirectUser) {
          console.log("Google redirect sign-in successful for user:", redirectUser.uid);

          // Save user preferences after successful Google sign-in via redirect
          try {
            // Get marketing consent from localStorage if it was saved before redirect
            const savedConsent = localStorage.getItem('pendingMarketingConsent');
            const marketingConsent = savedConsent === 'true';

            await saveUserPreferences(redirectUser.uid, redirectUser.email || '', marketingConsent);
            console.log("User preferences saved after Google redirect sign-in - Customer.io will be synced automatically via Cloud Function");

            // Clean up localStorage
            localStorage.removeItem('pendingMarketingConsent');
          } catch (error) {
            console.error("Failed to save user preferences after redirect:", error);
          }

          // Redirect to verify-email page
          navigate(`/verify-email?email=${encodeURIComponent(redirectUser.email || '')}&marketing=${marketingConsent}`);
        }
      } catch (error: any) {
        console.error("Error handling Google redirect:", error);
        setError(getErrorMessage(error));
      }
    };

    handleRedirect();
  }, []);

  // Don't auto-redirect on signup - we want to show verify-email page
  // Only redirect if user is already signed in when they visit this page
  useEffect(() => {
    if (user && !isSubmitting) {
      // User is already signed in, redirect them away from signup
      console.log(`User already signed in, redirecting to ${redirectTo}`);
      navigate(redirectTo);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    console.log("Client-side sign-up attempt with email:", formData.email);

    try {
      const newUser = await signUp({ email: formData.email, password: formData.password });
      console.log("Client-side sign-up successful");
      
      // Store user preferences in Firestore
      try {
        await saveUserPreferences(newUser.uid, formData.email, formData.marketingConsent);
        console.log("User preferences saved - Customer.io will be synced automatically via Cloud Function");
      } catch (prefError) {
        console.error("Failed to save user preferences:", prefError);
        // Continue anyway - don't block the user
      }
      
      // Redirect to email verification page
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&marketing=${formData.marketingConsent}`);
    } catch (signUpError) {
      console.error("Client-side sign-up failed:", signUpError);
      setError(getErrorMessage(signUpError));
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGoogleSignIn = async () => {
    // Check terms acceptance first
    if (!formData.termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    // Clear any previous errors
    setError(null);

    try {
      // Save marketing consent to localStorage before redirect
      localStorage.setItem('pendingMarketingConsent', formData.marketingConsent.toString());

      // Initiate Google sign-in redirect (works for all devices)
      await signInWithGoogle();
      // User will be redirected to Google, then back to this page
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in with Google';
      setError(errorMessage);

      // Clean up localStorage on error
      localStorage.removeItem('pendingMarketingConsent');
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Navigation showGetStarted={false} />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your <span className="text-accent-1">account</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{" "}
            <a
              href={`/signin${fromPricing ? '?from=pricing&redirect=' + encodeURIComponent(redirectTo) : ''}`}
              className="font-medium text-accent-1 hover:text-accent-2 transition-colors"
            >
              sign in to your existing account
            </a>
          </p>
          {fromPricing && (
            <div className="mt-4 p-4 bg-accent-1/10 border border-accent-1/30 rounded-lg">
              <p className="text-center text-sm text-accent-1">
                Welcome! Create your account to get started with your 7-day free trial. 
                Already have an account?{' '}
                <a 
                  href={`/signin?from=pricing&redirect=${encodeURIComponent(redirectTo)}`}
                  className="underline hover:text-white transition-colors"
                >
                  Sign in
                </a>
                {' '}to continue.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-500">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-500 rounded-md text-sm font-medium text-white bg-transparent hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSubmitting ? "Signing in..." : "Continue with Google"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-500" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-dark text-gray-300">
                Or create account with email
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm"
                placeholder="Create a password (min 6 characters)"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                id="marketingConsent"
                name="marketingConsent"
                type="checkbox"
                checked={formData.marketingConsent}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-accent-1 border-gray-500 rounded focus:ring-accent-1"
                disabled={isSubmitting}
              />
              <label htmlFor="marketingConsent" className="ml-2 block text-sm text-gray-300">
                I'd like to receive helpful tips, product updates, and exclusive offers
                <span className="block text-xs text-gray-400 mt-1">You can unsubscribe at any time</span>
              </label>
            </div>
            
            <div className="flex items-start">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-accent-1 border-gray-500 rounded focus:ring-accent-1"
                disabled={isSubmitting}
                required
              />
              <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-accent-1 hover:text-accent-2 underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className="text-accent-1 hover:text-accent-2 underline">
                  Privacy Policy
                </a>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
