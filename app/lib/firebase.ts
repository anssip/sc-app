import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

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

// Track if emulators are connected
export const isEmulatorMode = () => import.meta.env.DEV;

// Initialize Firebase
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Connect to emulators FIRST in development
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // Check if emulators are already connected to avoid duplicate connections
  const emulatorKey = "firebase-emulator-connected";

  // Always try to connect on page load in dev mode
  if (!auth.emulatorConfig) {
    try {
      // Connect to Auth emulator
      connectAuthEmulator(auth, "http://localhost:9099", {
        disableWarnings: true,
      });
    } catch (error) {
      // Silently ignore if already connected
      if (!error?.message?.includes("already")) {
      }
    }
  }

  // Check Firestore emulator connection
  if (!(db as any)._settings?.host?.includes("localhost:8090")) {
    try {
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, "localhost", 8090);
    } catch (error) {
      // Silently ignore if already connected
      if (!error?.message?.includes("already")) {
      }
    }
  }
}

// Set auth persistence AFTER emulator connection
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {})
    .catch((error) => {});
}

export { auth, db, firebaseConfig };
export default app;
