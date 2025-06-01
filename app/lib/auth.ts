import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

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
    console.log("Attempting to sign up with email:", email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Sign-up successful:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Sign-up failed:", error);
    throw error;
  }
};

export const signIn = async ({ email, password }: SignInData): Promise<User> => {
  try {
    console.log("Attempting to sign in with email:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign-in successful:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Sign-in failed:", error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log("Attempting to sign in with Google");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    console.log("Google sign-in successful:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    console.log("Attempting to sign out");
    await signOut(auth);
    console.log("Sign-out successful");
  } catch (error) {
    console.error("Sign-out failed:", error);
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