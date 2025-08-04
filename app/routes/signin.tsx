import type { MetaFunction } from "@remix-run/node";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { signIn, getErrorMessage } from "~/lib/auth";
import { useAuth } from "~/lib/auth-context";
import GoogleSignInButton from "~/components/GoogleSignInButton";
import Button from "~/components/Button";
import Navigation from "~/components/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign In - Spot Canvas" },
    { name: "description", content: "Sign in to your account" },
  ];
};

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user came from pricing/payment flow
  const fromPricing = searchParams.get('from') === 'pricing';
  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if user is signed in
  useEffect(() => {
    if (user) {
      console.log(`Redirecting to ${redirectTo} - user signed in`);
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    console.log("Client-side sign-in attempt with email:", formData.email);

    try {
      await signIn({ email: formData.email, password: formData.password });
      console.log("Client-side sign-in successful");
      // Navigation will happen automatically via useEffect when user state changes
    } catch (signInError) {
      console.error("Client-side sign-in failed:", signInError);
      setError(getErrorMessage(signInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-primary-dark">
      <Navigation showGetStarted={false} />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your <span className="text-accent-1">account</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{" "}
            <Button
              asLink
              to={`/signup${fromPricing ? '?from=pricing&redirect=' + encodeURIComponent(redirectTo) : ''}`}
              variant="outline"
              size="sm"
              outlineColor="var(--color-accent-1)"
              className="!px-3 !py-1 !text-xs border-2 hover:!bg-accent-1/10 hover:!text-accent-1"
            >
              create a new account
            </Button>
          </p>
          {fromPricing && (
            <div className="mt-4 p-4 bg-accent-1/10 border border-accent-1/30 rounded-lg">
              <p className="text-center text-sm text-accent-1">
                Welcome! Please sign in to continue with your subscription. 
                New to Spot Canvas? Create an account to get started with your free trial.
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
            <GoogleSignInButton onError={setError} disabled={isSubmitting} />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-500" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-dark text-gray-300">
                Or continue with email
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="blue"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
