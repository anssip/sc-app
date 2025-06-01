import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
} from "firebase/firestore";

// Test the market data Firebase configuration
const marketFirebaseConfig = {
  apiKey: "AIzaSyDkDBUUnxUqV3YZBm9GOrkcULZjBT4azyc",
  authDomain: "spotcanvas-prod.firebaseapp.com",
  projectId: "spotcanvas-prod",
  storageBucket: "spotcanvas-prod.firebasestorage.app",
  messagingSenderId: "346028322665",
  appId: "1:346028322665:web:f278b8364243d165f8d7f8",
};

// Initialize Firebase app for market data
const marketApp = initializeApp(marketFirebaseConfig, "market-test");

// Initialize Firestore
const db = getFirestore(marketApp);

async function testFirestoreConnection() {
  try {
    console.log("Testing Firestore connection to spotcanvas-prod...");

    // Try to access a collection (this will trigger connection)
    const testCollection = collection(db, "trading_pairs");
    const snapshot = await getDocs(testCollection);

    console.log("✅ Successfully connected to Firestore!");
    console.log(`Found ${snapshot.size} documents in test collection`);

    // List available collections if any
    console.log("Connection successful. Database is accessible.");
  } catch (error) {
    console.error("❌ Failed to connect to Firestore:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "permission-denied") {
      console.log("\n💡 Possible solutions:");
      console.log(
        "1. Make sure Firestore is enabled in the spotcanvas-prod project"
      );
      console.log("2. Check Firestore security rules");
      console.log("3. Verify the project ID is correct");
    }
  }
}

testFirestoreConnection();
