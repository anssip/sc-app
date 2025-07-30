import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

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

export { auth, db, firebaseConfig };
export default app;
