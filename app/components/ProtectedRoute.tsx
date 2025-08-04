import { useAuth } from "~/lib/auth-context";
import { Navigate, useLocation } from "@remix-run/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // If coming from payment-method page, add query params to indicate pricing flow
    const isPricingFlow = location.pathname === '/payment-method';
    const redirectUrl = isPricingFlow 
      ? `/signin?from=pricing&redirect=${encodeURIComponent(location.pathname + location.search)}`
      : '/signin';
    
    return fallback || <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}