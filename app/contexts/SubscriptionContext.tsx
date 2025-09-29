import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { accountRepository } from "~/services/accountRepository";
import type {
  SubscriptionStatus,
  PlanType,
} from "~/services/accountRepository";

// Re-export types from accountRepository for backward compatibility
export type {
  SubscriptionStatus,
  PlanType,
} from "~/services/accountRepository";

interface SubscriptionData {
  status: SubscriptionStatus;
  plan: PlanType;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  subscriptionId?: string;
  customerId?: string;
  isLoading: boolean;
  previewStartTime?: number;
  isPreviewExpired?: boolean;
}

interface SubscriptionContextType extends SubscriptionData {
  refreshSubscription: () => Promise<void>;
  canAddMoreLayouts: (currentCount: number) => boolean;
  canAddMoreIndicators: (currentCount: number) => boolean;
  getLayoutLimit: () => number | null;
  getIndicatorLimit: () => number | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

// Map price IDs to plan names using environment variables
const PRICE_TO_PLAN: Record<string, PlanType> = {
  [import.meta.env.VITE_STRIPE_PRICE_ID_STARTER]: "starter",
  [import.meta.env.VITE_STRIPE_PRICE_ID_PRO]: "pro",
};

const PREVIEW_DURATION_MINUTES = 5;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: "none",
    plan: "none",
    isLoading: true, // Start with loading true to wait for auth check
  });
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);

  const refreshSubscription = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        // Check for preview status using AccountRepository
        const previewStatus = await accountRepository.getPreviewStatus(null);

        if (previewStatus.isPreview) {
          // Preview exists - check its status
          setSubscriptionData({
            status: "none",
            plan: "none",
            isLoading: false,
            previewStartTime: previewStatus.startTime,
            isPreviewExpired: previewStatus.isExpired,
          });

          // Set a timer to update when preview expires
          if (!previewStatus.isExpired && previewStatus.startTime) {
            const remainingMs =
              PREVIEW_DURATION_MINUTES * 60 * 1000 -
              (Date.now() - previewStatus.startTime);
            if (previewTimer) clearTimeout(previewTimer);
            const timer = setTimeout(() => {
              setSubscriptionData((prev) => ({
                ...prev,
                isPreviewExpired: true,
              }));
            }, remainingMs);
            setPreviewTimer(timer);
          }
        } else {
          // No preview started yet - just set basic state
          setSubscriptionData({
            status: "none",
            plan: "none",
            isLoading: false,
          });
        }

        return;
      }

      // Use AccountRepository for fetching subscription data
      // This will return cached data immediately if available
      const subscription = await accountRepository.getSubscription(user);

      if (subscription) {
        setSubscriptionData({
          status: subscription.status,
          plan: subscription.plan,
          subscriptionId: subscription.subscriptionId,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          customerId: subscription.customerId,
          isLoading: false,
          // Clear preview-related fields when subscription exists
          previewStartTime: undefined,
          isPreviewExpired: undefined,
        });
      } else {
        // If no subscription from API, check Firestore directly for canceled subscriptions

        const db = getFirestore();
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(
          subscriptionsRef,
          where("firebase_uid", "==", user.uid),
          orderBy("created_at", "desc"),
          limit(1)
        );

        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const subData = doc.data();
            if (subData.status === "canceled") {
              const plan = PRICE_TO_PLAN[subData.price_id] || "none";

              setSubscriptionData({
                status: "canceled",
                plan,
                subscriptionId: subData.subscription_id,
                trialEndsAt: subData.trial_end
                  ? new Date(subData.trial_end * 1000)
                  : undefined,
                isLoading: false,
              });
              return;
            }
          }
        } catch (firestoreError) {}

        // If still no subscription found, check preview status
        const previewStatus = await accountRepository.getPreviewStatus(user);

        if (!previewStatus.isPreview) {
          // First time user - start the preview timer
          accountRepository.startPreview(user);
          const newPreviewStatus = await accountRepository.getPreviewStatus(
            user
          );

          setSubscriptionData({
            status: "none",
            plan: "none",
            isLoading: false,
            previewStartTime: newPreviewStatus.startTime,
            isPreviewExpired: false,
          });

          // Set a timer to update when preview expires
          const remainingMs = PREVIEW_DURATION_MINUTES * 60 * 1000;
          if (previewTimer) clearTimeout(previewTimer);
          const timer = setTimeout(() => {
            setSubscriptionData((prev) => ({
              ...prev,
              isPreviewExpired: true,
            }));
          }, remainingMs);
          setPreviewTimer(timer);
        } else {
          setSubscriptionData({
            status: "none",
            plan: "none",
            isLoading: false,
            previewStartTime: previewStatus.startTime,
            isPreviewExpired: previewStatus.isExpired,
          });

          // Set a timer to update when preview expires
          if (!previewStatus.isExpired && previewStatus.startTime) {
            const remainingMs =
              PREVIEW_DURATION_MINUTES * 60 * 1000 -
              (Date.now() - previewStatus.startTime);
            if (previewTimer) clearTimeout(previewTimer);
            const timer = setTimeout(() => {
              setSubscriptionData((prev) => ({
                ...prev,
                isPreviewExpired: true,
              }));
            }, remainingMs);
            setPreviewTimer(timer);
          }
        }
      }
    } catch (error) {
      setSubscriptionData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    refreshSubscription();

    // Listen for auth state changes
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Update the account repository with current user
      accountRepository.setCurrentUser(user);

      if (user) {
        // Clear anonymous preview timer when user logs in
        const anonymousPreviewKey = "anonymous_preview_start";
        if (localStorage.getItem(anonymousPreviewKey)) {
          localStorage.removeItem(anonymousPreviewKey);
        }

        // Clear any stale cache and force refresh when user logs in
        // Force refresh to get fresh data from server on login
        setSubscriptionData((prev) => ({ ...prev, isLoading: true }));
        const subscription = await accountRepository.getSubscription(
          user,
          true
        ); // Force refresh on login

        if (subscription) {
          setSubscriptionData({
            status: subscription.status,
            plan: subscription.plan,
            subscriptionId: subscription.subscriptionId,
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodEnd: subscription.currentPeriodEnd,
            customerId: subscription.customerId,
            isLoading: false,
            // Clear preview-related fields when subscription exists
            previewStartTime: undefined,
            isPreviewExpired: undefined,
          });
        } else {
          // Continue with existing logic for checking Firestore and preview
          refreshSubscription();
        }
      } else {
        // User logged out - clear subscription data
        setSubscriptionData({
          status: "none",
          plan: "none",
          isLoading: false,
        });
      }
    });

    // Subscribe to subscription updates from the repository
    const unsubscribeFromRepo = accountRepository.subscribeToSubscription(
      (subscriptionData) => {
        if (subscriptionData) {
          setSubscriptionData({
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            subscriptionId: subscriptionData.subscriptionId,
            trialEndsAt: subscriptionData.trialEndsAt,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            customerId: subscriptionData.customerId,
            isLoading: false,
            // Clear preview-related fields when subscription exists
            previewStartTime: undefined,
            isPreviewExpired: undefined,
          });
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeFromRepo();
      if (previewTimer) clearTimeout(previewTimer);
    };
  }, []);

  // Helper functions for checking plan limitations
  const canAddMoreLayouts = (currentCount: number): boolean => {
    // During trial, both plans have unlimited access
    if (subscriptionData.status === "trialing") {
      return true;
    }

    // Active, past_due, incomplete subscription with Starter plan has limit of 2 layouts
    // Include incomplete to handle payment processing states
    const hasStarterAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "starter";
    if (hasStarterAccess) {
      return currentCount < 2;
    }

    // Pro plan has unlimited layouts
    const hasProAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "pro";
    if (hasProAccess) {
      return true;
    }

    // No subscription, canceled, or expired - should prompt to subscribe
    return false;
  };

  const canAddMoreIndicators = (currentCount: number): boolean => {
    // During trial, both plans have unlimited access
    if (subscriptionData.status === "trialing") {
      return true;
    }

    // Active, past_due, incomplete subscription with Starter plan has limit of 2 indicators per chart
    const hasStarterAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "starter";
    if (hasStarterAccess) {
      return currentCount < 2;
    }

    // Pro plan has unlimited indicators
    const hasProAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "pro";
    if (hasProAccess) {
      return true;
    }

    // No subscription, canceled, or expired - should prompt to subscribe
    return false;
  };

  const getLayoutLimit = (): number | null => {
    if (subscriptionData.status === "trialing") {
      return null; // unlimited during trial
    }

    const hasStarterAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "starter";
    if (hasStarterAccess) {
      return 2;
    }

    const hasProAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "pro";
    if (hasProAccess) {
      return null; // unlimited for pro
    }

    return 0; // no subscription
  };

  const getIndicatorLimit = (): number | null => {
    if (subscriptionData.status === "trialing") {
      return null; // unlimited during trial
    }

    const hasStarterAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "starter";
    if (hasStarterAccess) {
      return 2;
    }

    const hasProAccess =
      ["active", "past_due", "incomplete"].includes(subscriptionData.status) &&
      subscriptionData.plan === "pro";
    if (hasProAccess) {
      return null; // unlimited for pro
    }

    return 0; // no subscription
  };

  return (
    <SubscriptionContext.Provider
      value={{
        ...subscriptionData,
        refreshSubscription,
        canAddMoreLayouts,
        canAddMoreIndicators,
        getLayoutLimit,
        getIndicatorLimit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  // Return a default value instead of throwing to maintain hook order
  if (context === undefined) {
    return {
      status: "none" as SubscriptionStatus,
      plan: "none" as PlanType,
      isLoading: true,
      refreshSubscription: async () => {},
      canAddMoreLayouts: () => false,
      canAddMoreIndicators: () => false,
      getLayoutLimit: () => 0,
      getIndicatorLimit: () => 0,
    };
  }
  return context;
}
