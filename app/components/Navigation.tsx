import { Link, useLocation } from "@remix-run/react";
import Button from "~/components/Button";
import AccountMenu from "~/components/AccountMenu";

interface NavigationProps {
  showGetStarted?: boolean;
}

export default function Navigation({ showGetStarted = true }: NavigationProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="relative z-20 p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pricing-green rounded-sm"></div>
            <span className="text-white font-bold text-xl">Spot Canvas</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`transition-colors ${
              isActive("/") ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <Link
            to="/pricing"
            className={`transition-colors ${
              isActive("/pricing") ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Pricing
          </Link>
          <a
            href="#blog"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Blog
          </a>
          <a
            href="#contact"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Contact
          </a>
        </div>
        
        <div className="flex items-center gap-4">
          {showGetStarted && (
            <Button variant="primary" size="sm">
              Get started
            </Button>
          )}
          <AccountMenu />
        </div>
      </div>
    </nav>
  );
}