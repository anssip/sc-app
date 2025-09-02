import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, reload } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateEmailVerificationStatus } from './auth';
import { accountRepository } from '~/services/accountRepository';

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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
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
      
      console.log("User refreshed, emailVerified:", user.emailVerified);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Component has mounted, we're on the client
    setMounted(true);
    
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User: ${user.email}` : "No user");
      setUser(user);
      
      if (user) {
        setEmailVerified(user.emailVerified);
        
        // Warm the cache with user data when they sign in
        accountRepository.setCurrentUser(user);
        accountRepository.warmCache(user).then(() => {
          console.log("Account cache warmed for user:", user.email);
        }).catch((error) => {
          console.error("Failed to warm cache:", error);
        });
        
        // Set up a periodic check for email verification
        if (!user.emailVerified) {
          const intervalId = setInterval(async () => {
            await reload(user);
            if (user.emailVerified) {
              setEmailVerified(true);
              await updateEmailVerificationStatus(user.uid, true);
              clearInterval(intervalId);
              console.log("Email verified!");
            }
          }, 30000); // Check every 30 seconds
          
          // Clean up interval on unmount
          return () => clearInterval(intervalId);
        }
      } else {
        setEmailVerified(false);
        // Clear cache when user signs out
        accountRepository.setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore user document for real-time updates
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        console.log("User document updated:", userData);
        // You can use this data for additional user preferences
      }
    }, (error) => {
      console.error("Error listening to user document:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const value = {
    user,
    loading,
    emailVerified,
    refreshUser,
  };

  // Debug logging
  console.log("AuthProvider render:", { 
    user: user ? user.email : null, 
    loading,
    emailVerified,
    mounted 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};