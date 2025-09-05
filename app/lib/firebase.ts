import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration
// These are client-side keys and safe to expose
const firebaseConfig = {
  apiKey: "AIzaSyDkDBUUnxUqV3YZBm9GOrkcULZjBT4azyc",
  authDomain: "spotcanvas-prod.firebaseapp.com",
  projectId: "spotcanvas-prod",
  storageBucket: "spotcanvas-prod.firebasestorage.app",
  messagingSenderId: "346028322665",
  appId: "1:346028322665:web:f278b8364243d165f8d7f8",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Connect to emulators in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Check if we haven't already connected to avoid errors
  if (!window.localStorage.getItem('firebase-emulator-warning')) {
    try {
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, 'localhost', 8090);
      console.log('Connected to Firestore emulator on localhost:8090');
      
      // Connect to Auth emulator if available
      if (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
        connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
        console.log('Connected to Auth emulator on', import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST);
      }
      
      // Set flag to prevent reconnection attempts
      window.localStorage.setItem('firebase-emulator-warning', 'true');
    } catch (error) {
      console.warn('Failed to connect to Firebase emulators:', error);
    }
  }
}

export { auth, db, firebaseConfig };
export default app;
