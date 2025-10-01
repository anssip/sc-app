import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async ({ email, password }: SignUpData): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email immediately after signup
    await sendVerificationEmail(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signIn = async ({ email, password }: SignInData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export interface GoogleSignInOptions {
  isSignup?: boolean;
  marketingConsent?: boolean;
  redirectTo?: string;
}

export const signInWithGoogle = async (options: GoogleSignInOptions = {}): Promise<void> => {
  try {
    const provider = new GoogleAuthProvider();

    // Prepare state data to pass through OAuth flow
    const authState = {
      isSignup: options.isSignup || false,
      marketingConsent: options.marketingConsent || false,
      redirectTo: options.redirectTo || '/',
    };

    // Store in BOTH sessionStorage AND localStorage
    // sessionStorage works for localhost/emulator
    // localStorage persists across the Firebase auth domain redirect
    sessionStorage.setItem('googleAuthState', JSON.stringify(authState));
    localStorage.setItem('googleAuthState', JSON.stringify(authState));

    // Also store a timestamp to detect stale data
    localStorage.setItem('googleAuthStateTime', Date.now().toString());

    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    // Use redirect flow for all devices (more reliable, works everywhere)
    await signInWithRedirect(auth, provider);
    // User will be redirected to Google, then back to the current page
  } catch (error) {
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    } catch (error) {
    throw error;
  }
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    // Check if email is already verified
    if (user.emailVerified) {
      return;
    }
    
    await sendEmailVerification(user, {
      url: `${window.location.origin}/welcome`, // Redirect after verification
      handleCodeInApp: false, // Don't handle the action code in the app
    });
    } catch (error: any) {
    // Specific error handling
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification emails sent. Please wait a few minutes and try again.');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign in again to send verification email.');
    }
    
    throw error;
  }
};

export const refreshUser = async (user: User): Promise<void> => {
  try {
    await reload(user);
    } catch (error) {
    throw error;
  }
};

export const saveUserPreferences = async (
  userId: string,
  email: string,
  marketingConsent: boolean,
  emailVerified: boolean = false
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email,
      marketingConsent,
      consentTimestamp: serverTimestamp(),
      emailVerified,
      createdAt: serverTimestamp(),
    }, { merge: true });
    } catch (error) {
    throw error;
  }
};

export const updateEmailVerificationStatus = async (
  userId: string, 
  verified: boolean
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      emailVerified: verified,
      verifiedAt: verified ? serverTimestamp() : null,
    }, { merge: true });
    } catch (error) {
    throw error;
  }
};

export const getErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please use a different email or sign in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up blocked. Please allow pop-ups and try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in cancelled. Please try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};