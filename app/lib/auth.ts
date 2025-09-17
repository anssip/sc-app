import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup,
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

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
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
  marketingConsent: boolean
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email,
      marketingConsent,
      consentTimestamp: serverTimestamp(),
      emailVerified: false,
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