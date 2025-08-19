import { Link } from "@remix-run/react";

interface FooterProps {
  variant?: "default" | "dark";
}

export default function Footer({ variant = "default" }: FooterProps) {
  const isDark = variant === "dark";
  
  return (
    <footer id="contact" className={`${isDark ? "bg-black text-white border-t border-white/20" : "bg-accent-1 text-black rounded-t-3xl"}`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className={`${isDark ? "text-white" : "text-black"} font-bold mb-4`}>Contact</h3>
            <div className={`space-y-2 ${isDark ? "text-gray-300" : "text-black/80"} text-sm`}>
              <p>Northern Peaks Development</p>
              <p>Espoo, Finland</p>
              <p className="mt-4">Contact Person: Anssi Piirainen</p>
              <p>
                <a
                  href="tel:+358408498385"
                  className={`${isDark ? "hover:text-white" : "hover:text-black"} font-medium transition-colors`}
                >
                  +358 40 849 8385
                </a>
              </p>
              <p>
                <a
                  href="mailto:anssip@gmail.com"
                  className={`${isDark ? "hover:text-white" : "hover:text-black"} font-medium transition-colors`}
                >
                  anssip@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className={`${isDark ? "text-white" : "text-black"} font-bold mb-4`}>Navigation</h3>
            <nav className="space-y-2">
              <Link
                to="/pricing"
                className={`block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`}
              >
                Plans
              </Link>
              <a
                href="#features"
                className={`block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`}
              >
                Features
              </a>
              <a
                href="mailto:anssip@gmail.com"
                className={`block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`}
              >
                Contact Us
              </a>
              <a
                href="/waitlist"
                className={`block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`}
              >
                Join Waitlist
              </a>
            </nav>
          </div>

          {/* Community */}
          <div>
            <h3 className={`${isDark ? "text-white" : "text-black"} font-bold mb-4`}>Community</h3>
            <nav className="space-y-2">
              <a
                href="https://discord.gg/wXcRQ7M8Ey"
                target="_blank"
                rel="noopener noreferrer"
                className={`block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`}
              >
                Discord
              </a>
            </nav>
          </div>

          {/* Logo and Copyright */}
          <div className="flex flex-col justify-between">
            <div>
              <Link to="/" className="block mb-4">
                <img 
                  src={isDark ? "/full-logo-white.svg" : "/full-logo-black.svg"} 
                  alt="Spot Canvas" 
                  className="h-10"
                />
              </Link>
              <p className={`${isDark ? "text-gray-400" : "text-black/80"} text-sm`}>
                Trading Charts Reimagined.
              </p>
            </div>
            <p className={`${isDark ? "text-gray-500" : "text-black/60"} text-xs mt-8`}>
              © {new Date().getFullYear()} Northern Peaks Development. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
