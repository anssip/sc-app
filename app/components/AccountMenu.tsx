import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "@remix-run/react";
import { User, ChevronDown, Crown, Zap } from "lucide-react";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Button from "~/components/Button";
import GoogleSignInButton from "~/components/GoogleSignInButton";
import { useSubscription } from "~/contexts/SubscriptionContext";

export default function AccountMenu() {
  const { user } = useAuth();
  const { status, plan, trialEndsAt } = useSubscription();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if we're on the chart page
  const isOnChartPage = location.pathname === "/chart";

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      setIsOpen(false);
    } catch (error) {}
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="hidden md:inline">
            {user ? user.email : "Account"}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu - Desktop */}
        {isOpen && (
          <div className="hidden sm:block absolute left-auto right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-[9999] max-h-[80vh] overflow-y-auto">
            {user ? (
              // Signed-in menu
              <div className="p-4 sm:p-4">
                <div className="mb-4 pb-4 border-b border-gray-800">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-white font-medium break-words text-sm sm:text-base">
                    {user.email}
                  </p>

                  {/* Subscription Status */}
                  {status !== "none" && (
                    <div className="mt-3">
                      {status === "trialing" && trialEndsAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-yellow-500 whitespace-nowrap">
                            Trial ends{" "}
                            {new Date(trialEndsAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {status === "active" && (
                        <div className="flex items-center gap-2 text-sm">
                          {plan === "pro" ? (
                            <>
                              <Crown className="h-4 w-4 text-pricing-green flex-shrink-0" />
                              <span className="text-pricing-green whitespace-nowrap">
                                Pro Plan
                              </span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-blue-500 whitespace-nowrap">
                                Starter Plan
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {!isOnChartPage && (
                    <Link
                      to="/chart"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                    >
                      Chart Dashboard
                    </Link>
                  )}
                  <Link
                    to="/billing"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                  >
                    Billing & Subscription
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                  >
                    Home
                  </Link>
                </div>
              </div>
            ) : (
              // Signed-out menu
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Sign in to Spot Canvas
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Access professional trading charts with cloud sync
                </p>

                {authError && (
                  <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded mb-3">
                    {authError}
                  </div>
                )}

                <div className="space-y-3">
                  <GoogleSignInButton
                    onError={setAuthError}
                    className="w-full"
                  />
                  <Button
                    asLink
                    to="/signin"
                    variant="secondary"
                    fullWidth
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Button>
                  <Button
                    asLink
                    to="/signup"
                    variant="primary"
                    fullWidth
                    onClick={() => setIsOpen(false)}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown menu - Mobile Full Width */}
      {isOpen && (
        <div className="sm:hidden fixed inset-x-0 top-[60px] bg-gray-800 border-t border-gray-800 shadow-xl z-[9999] max-h-[calc(100vh-60px)] overflow-y-auto">
          {user ? (
            // Signed-in menu
            <div className="p-4">
              <div className="mb-4 pb-4 border-b border-gray-800">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-white font-medium break-words text-sm">
                  {user.email}
                </p>

                {/* Subscription Status */}
                {status !== "none" && (
                  <div className="mt-3">
                    {status === "trialing" && trialEndsAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-yellow-500">
                          Trial ends{" "}
                          {new Date(trialEndsAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {status === "active" && (
                      <div className="flex items-center gap-2 text-sm">
                        {plan === "pro" ? (
                          <>
                            <Crown className="h-4 w-4 text-pricing-green flex-shrink-0" />
                            <span className="text-pricing-green">Pro Plan</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-blue-500">Starter Plan</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {!isOnChartPage && (
                  <Link
                    to="/chart"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Chart Dashboard
                  </Link>
                )}
                <Link
                  to="/billing"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Billing & Subscription
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Sign Out
                </button>
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>
          ) : (
            // Signed-out menu
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Sign in to Spot Canvas
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Access professional trading charts with cloud sync
              </p>

              {authError && (
                <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded mb-3">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <GoogleSignInButton onError={setAuthError} className="w-full" />
                <Button
                  asLink
                  to="/signin"
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Button>
                <Button
                  asLink
                  to="/signup"
                  variant="primary"
                  fullWidth
                  onClick={() => setIsOpen(false)}
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
