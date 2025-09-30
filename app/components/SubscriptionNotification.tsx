import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { X, AlertCircle, Clock } from "lucide-react";
import { useSubscription } from "~/contexts/SubscriptionContext";
import Button from "./Button";

export default function SubscriptionNotification() {
  const { status, plan, trialEndsAt, isLoading, isPreviewExpired, previewStartTime } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === "trialing" && trialEndsAt) {
      const now = new Date();
      const trial = new Date(trialEndsAt);
      const diffTime = trial.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [status, trialEndsAt]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Don't show on mobile devices
  if (isMobile) {
    return null;
  }

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Don't show if user has an active subscription or has dismissed
  if (status === "active" || isDismissed) {
    return null;
  }

  // Show trial ending warning or trial ended message
  if (status === "trialing" && daysRemaining !== null) {
    // Trial has ended (negative or zero days)
    if (daysRemaining <= 0) {
      return (
        <div className="relative bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 text-red-500/50 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-500 font-medium mb-1">
                Your trial has ended
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Choose a plan to continue using Spot Canvas.
              </p>
              <Button asLink to="/pricing" variant="primary" size="sm">
                Choose Plan
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Trial ending soon (1-3 days)
    if (daysRemaining <= 3) {
      return (
        <div className="relative bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 text-yellow-500/50 hover:text-yellow-500"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-yellow-500 font-medium mb-1">
                Your {plan} trial ends in {daysRemaining}{" "}
                {daysRemaining === 1 ? "day" : "days"}
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Choose your plan to continue using Spot Canvas after your trial
                ends.
              </p>
              <Button asLink to="/pricing" variant="primary" size="sm">
                Choose Plan
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show no subscription warning - but only if preview has expired for new users
  if (status === "none") {
    // If user is in preview period, show welcome message
    if (!isPreviewExpired && previewStartTime) {
      return (
        <div className="relative bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 text-blue-500/50 hover:text-blue-500"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-500 font-medium mb-1">
                Welcome to Spot Canvas!
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                You're enjoying a 5-minute preview. Start your 7-day free trial to unlock unlimited access.
              </p>
              <Button asLink to="/pricing" variant="primary" size="sm">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Preview expired - show subscription required
    return (
      <div className="relative bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 text-red-500/50 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-500 font-medium mb-1">
              Preview Ended
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Your 5-minute preview has ended. Start your 7-day free trial to continue using Spot Canvas.
            </p>
            <Button asLink to="/pricing" variant="primary" size="sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
