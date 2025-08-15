import { Link, useLocation, useNavigate } from "@remix-run/react";
import Button from "~/components/Button";
import AccountMenu from "~/components/AccountMenu";
import { useAuth } from "~/lib/auth-context";
import { useSubscription } from "~/contexts/SubscriptionContext";

interface NavigationProps {
  showGetStarted?: boolean;
}

export default function Navigation({ showGetStarted = true }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status: subscriptionStatus } = useSubscription();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Determine button behavior based on user state
  const getStartedButtonConfig = () => {
    if (!user) {
      // User not logged in
      return {
        label: "Get started",
        onClick: () => navigate("/signin"),
      };
    } else if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      // User is subscribed
      return {
        label: "Open Charts",
        onClick: () => navigate("/chart"),
      };
    } else {
      // User logged in but not subscribed
      return {
        label: "Get started",
        onClick: () => navigate("/pricing"),
      };
    }
  };

  const buttonConfig = getStartedButtonConfig();

  return (
    <nav className="relative z-20 p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/full-logo-white.svg" 
            alt="Spot Canvas" 
            className="h-10"
          />
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/features"
            className={`transition-colors ${
              isActive("/features") ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className={`transition-colors ${
              isActive("/pricing") ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            className={`transition-colors ${
              isActive("/blog") ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Blog
          </Link>
          <a
            href="#contact"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>
        
        <div className="flex items-center gap-4">
          {showGetStarted && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={buttonConfig.onClick}
            >
              {buttonConfig.label}
            </Button>
          )}
          <AccountMenu />
        </div>
      </div>
    </nav>
  );
}