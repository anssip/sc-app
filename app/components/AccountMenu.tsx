import { useState, useRef, useEffect } from "react";
import { Link } from "@remix-run/react";
import { User, ChevronDown } from "lucide-react";
import { useAuth } from "~/lib/auth-context";
import { logOut } from "~/lib/auth";
import Button from "~/components/Button";
import GoogleSignInButton from "~/components/GoogleSignInButton";

export default function AccountMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <User className="h-5 w-5" />
        <span>{user ? user.email : "Account"}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-black/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl z-50">
          {user ? (
            // Signed-in menu
            <div className="p-4">
              <div className="mb-4 pb-4 border-b border-gray-800">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Link
                  to="/chart"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Chart Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // Signed-out menu
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Sign in to Spot Canvas</h3>
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
  );
}