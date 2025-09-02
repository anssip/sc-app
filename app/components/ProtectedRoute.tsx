import { useAuth } from "~/lib/auth-context";
import { Navigate, useLocation } from "@remix-run/react";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowPreview?: boolean;
}

const PREVIEW_DURATION_MINUTES = 5;

export default function ProtectedRoute({ children, fallback, allowPreview = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [previewExpired, setPreviewExpired] = useState(false);
  const [previewStartTime, setPreviewStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (allowPreview && !user) {
      // Check and initialize preview for non-authenticated users
      const previewKey = 'anonymous_preview_start';
      let storedTime = localStorage.getItem(previewKey);
      
      if (!storedTime) {
        // First time anonymous user - start the preview timer
        const now = Date.now();
        localStorage.setItem(previewKey, now.toString());
        setPreviewStartTime(now);
      } else {
        const startTime = parseInt(storedTime);
        setPreviewStartTime(startTime);
        
        // Check if preview has expired
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        if (elapsedMinutes >= PREVIEW_DURATION_MINUTES) {
          setPreviewExpired(true);
        } else {
          // Set a timer to mark preview as expired
          const remainingMs = (PREVIEW_DURATION_MINUTES * 60 * 1000) - (Date.now() - startTime);
          const timer = setTimeout(() => {
            setPreviewExpired(true);
          }, remainingMs);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, [allowPreview, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Allow access if user is authenticated OR if preview is allowed and not expired
  const hasAccess = user || (allowPreview && !previewExpired);

  if (!hasAccess) {
    // If coming from payment-method page, add query params to indicate pricing flow
    const isPricingFlow = location.pathname === '/payment-method';
    const redirectUrl = isPricingFlow 
      ? `/signin?from=pricing&redirect=${encodeURIComponent(location.pathname + location.search)}`
      : '/signin';
    
    return fallback || <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}