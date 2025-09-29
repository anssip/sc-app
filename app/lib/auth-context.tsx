import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, reload } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { updateEmailVerificationStatus } from "./auth";
import { accountRepository } from "~/services/accountRepository";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true, // Default to true - we're loading until proven otherwise
  emailVerified: false,
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return a default value instead of throwing to maintain hook order
  if (!context) {
    return {
      user: null,
      loading: true,
      emailVerified: false,
      refreshUser: async () => {},
    };
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  // Start with true - we're loading until we know auth state
  // This prevents premature redirects on routes that check for user
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Function to refresh user data and check email verification
  const refreshUser = async () => {
    if (!user) return;

    try {
      await reload(user);
      setEmailVerified(user.emailVerified);

      // Update Firestore if verification status changed
      if (user.emailVerified) {
        await updateEmailVerificationStatus(user.uid, true);
      }
    } catch (error) {}
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Component has mounted, we're on the client
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        setEmailVerified(user.emailVerified);

        // Warm the cache with user data when they sign in
        accountRepository.setCurrentUser(user);
        accountRepository
          .warmCache(user)
          .then(() => {})
          .catch((error) => {});

        // Set up a periodic check for email verification
        if (!user.emailVerified) {
          const intervalId = setInterval(async () => {
            await reload(user);
            if (user.emailVerified) {
              setEmailVerified(true);
              await updateEmailVerificationStatus(user.uid, true);
              clearInterval(intervalId);
            }
          }, 30000); // Check every 30 seconds

          // Clean up interval on unmount
          return () => clearInterval(intervalId);
        }
      } else {
        setEmailVerified(false);
        // Clear cache when user signs out
        accountRepository.setCurrentUser(null);
        // Clear all cached data for clean state
        accountRepository
          .clearCache()
          .then(() => {})
          .catch((error) => {});
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore user document for real-time updates
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          // You can use this data for additional user preferences
        }
      },
      (error) => {}
    );

    return () => unsubscribe();
  }, [user]);

  const value = {
    user,
    loading,
    emailVerified,
    refreshUser,
  };

  // Debug logging
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
