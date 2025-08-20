import { Link, useLocation } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import AccountMenu from "~/components/AccountMenu";

interface NavigationProps {
  showGetStarted?: boolean;
}

export default function Navigation({ showGetStarted = true }: NavigationProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className="relative z-20 p-6" ref={menuRef}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - responsive */}
        <Link to="/" className="flex items-center">
          <img
            src="/icon-logo-white.svg"
            alt="Spot Canvas"
            className="h-10 md:hidden"
          />
          <img
            src="/full-logo-white.svg"
            alt="Spot Canvas"
            className="h-10 hidden md:block"
          />
        </Link>

        {/* Desktop/Tablet Navigation Links - visible on md and above */}
        <div className="hidden md:flex items-center md:gap-4 lg:gap-8">
          <Link
            to="/features"
            className={`transition-colors ${
              isActive("/features")
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className={`transition-colors ${
              isActive("/pricing")
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            className={`transition-colors ${
              isActive("/blog")
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Blog
          </Link>
          <a
            href="#contact"
            className="text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Contact
          </a>
        </div>

        {/* Right side - Account Menu and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <AccountMenu />

          {/* Mobile Menu Button - visible only on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-gray-300 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay - visible only on mobile when open */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6">
              <Link to="/" className="flex items-center">
                <img
                  src="/icon-logo-white.svg"
                  alt="Spot Canvas"
                  className="h-10"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Menu Links */}
            <div className="flex-1 flex flex-col justify-center px-8">
              <div className="space-y-6">
                <Link
                  to="/features"
                  className={`block text-2xl transition-colors ${
                    isActive("/features")
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className={`block text-2xl transition-colors ${
                    isActive("/pricing")
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Pricing
                </Link>
                <Link
                  to="/blog"
                  className={`block text-2xl transition-colors ${
                    isActive("/blog")
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Blog
                </Link>
                <a
                  href="#contact"
                  className="block text-2xl text-gray-400 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    document
                      .getElementById("contact")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
