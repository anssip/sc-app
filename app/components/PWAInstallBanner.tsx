import React, { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { useAuth } from "~/lib/auth-context";

export default function PWAInstallBanner() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(true); // Start as dismissed, will check storage
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    setIsPWA(isStandalone);

    // Detect mobile device
    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      const isMobileDevice = width < 768 || 
                             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    // Detect platform
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    setIsAndroid(/Android/.test(userAgent));

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if already dismissed for this user
    if (user?.uid) {
      const storageKey = `pwa-install-dismissed-${user.uid}`;
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) {
        setIsDismissed(false);
      }
    } else {
      // For non-logged-in users, use a generic key
      const dismissed = localStorage.getItem('pwa-install-dismissed-guest');
      if (!dismissed) {
        setIsDismissed(false);
      }
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [user]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage
    const storageKey = user?.uid 
      ? `pwa-install-dismissed-${user.uid}`
      : 'pwa-install-dismissed-guest';
    localStorage.setItem(storageKey, 'true');
  };

  // Don't show if:
  // - Already dismissed
  // - Not on mobile
  // - Already running as PWA
  // - Not iOS or Android (unsupported platform)
  if (isDismissed || !isMobile || isPWA || (!isIOS && !isAndroid)) {
    return null;
  }

  return (
    <div className="relative bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mx-4 mt-2 mb-2">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-blue-500/50 hover:text-blue-500 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-blue-400 font-medium mb-1">
            Install Spot Canvas App
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            Add Spot Canvas to your home screen for the best experience - full screen charts without browser controls.
          </p>
          
          {isIOS && (
            <div className="text-gray-300 text-sm space-y-2">
              <p className="font-medium">How to install on iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button in Safari</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Tap "Add" to install</span>
                </li>
              </ol>
            </div>
          )}
          
          {isAndroid && (
            <div className="text-gray-300 text-sm space-y-2">
              <p className="font-medium">How to install on Android:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Tap the menu button (⋮) in your browser</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Tap "Add to Home screen" or "Install app"</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Tap "Add" or "Install" to confirm</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}