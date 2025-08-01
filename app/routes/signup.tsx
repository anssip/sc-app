import type { MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { signUp, getErrorMessage } from "~/lib/auth";
import { useAuth } from "~/lib/auth-context";
import GoogleSignInButton from "~/components/GoogleSignInButton";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up - Spot Canvas" },
    { name: "description", content: "Create your account" },
  ];
};



export default function SignUp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is signed in
  useEffect(() => {
    if (user) {
      console.log("Redirecting to / - user signed up");
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
      await signUp({ email: formData.email, password: formData.password });
      console.log("Client-side sign-up successful");
      // Navigation will happen automatically via useEffect when user state changes
    } catch (signUpError) {
      console.error("Client-side sign-up failed:", signUpError);
      setError(getErrorMessage(signUpError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your <span className="text-accent-1">account</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{" "}
            <a
              href="/signin"
              className="font-medium text-accent-1 hover:text-accent-2 transition-colors"
            >
              sign in to your existing account
            </a>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-500">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <GoogleSignInButton
              onError={setError}
              disabled={isSubmitting}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-500" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-dark text-gray-300">Or create account with email</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
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

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-dark bg-accent-1 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-accent-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}