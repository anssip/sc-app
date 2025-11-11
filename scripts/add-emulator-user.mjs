#!/usr/bin/env node

/**
 * Script to add a user to Firebase Auth Emulator with subscription
 * Uses Firebase Admin SDK to create user with specific UID
 * Also creates a Starter subscription document in Firestore
 * Usage: node scripts/add-emulator-user.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Set environment to use emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8090";

// Initialize Firebase Admin with emulator
const app = initializeApp({
  projectId: "spotcanvas-prod",
});

const auth = getAuth(app);
const db = getFirestore(app);

// User configuration
const TEST_USER = {
  uid: "Nf1YGMLq7gbbe09zZl3q4qqchPY2", // Same as production
  email: "anssip@gmail.com",
  emailVerified: true,
  password: "testpassword123",
  displayName: "Anssi Piirainen",
};

// Subscription configuration for Starter plan
const SUBSCRIPTION_DATA = {
  firebase_uid: TEST_USER.uid,
  user_id: TEST_USER.uid,
  email: TEST_USER.email,
  status: "active",
  subscription_id: "sub_1Rr0DXS4gOnN3XylBwrkqkl8", // Test subscription ID
  customer_id: "cus_TestCustomer123",
  price_id: "price_1RnwAnS4gOnN3Xyl1wfddJBD", // Starter plan price ID from .env.example
  product_id: "prod_QfRN0kRLjOK9oZ",
  created_at: new Date(),
  current_period_start: new Date(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
  cancel_at_period_end: false,
  metadata: {
    environment: "emulator",
    plan: "starter",
  },
};

async function createUserDocument() {
  try {
    // Create or update user document with Twitter credentials for testing
    const userRef = db.collection("users").doc(TEST_USER.uid);

    await userRef.set(
      {
        email: TEST_USER.email,
        displayName: TEST_USER.displayName,
        createdAt: new Date(),
        // Add test Twitter credentials for emulator
        twitterCredentials: {
          accessToken: "77168577-TD3GgMZfjI0KjpxdvrpFrPwjQv7ftcrY4EFu7v2wL",
          accessSecret: "GUSVPvBvc3bVe9dkWQ0dcGBUZpXeP42JOYm9oWqm55GP6",
          username: "anssip",
          userId: "77168577",
        },
      },
      { merge: true }
    );

    console.log(
      "✅ Successfully created user document with Twitter credentials"
    );
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
}

async function createSubscription() {
  try {
    // Check if subscription already exists and delete it
    const subscriptionRef = db
      .collection("subscriptions")
      .doc(SUBSCRIPTION_DATA.subscription_id);
    const existingDoc = await subscriptionRef.get();

    if (existingDoc.exists) {
      console.log("Deleting existing subscription...");
      await subscriptionRef.delete();
    }

    // Create subscription document
    await subscriptionRef.set(SUBSCRIPTION_DATA);

    console.log("✅ Successfully created subscription:");
    console.log("   Status:", SUBSCRIPTION_DATA.status);
    console.log("   Plan: Starter");
    console.log("   Subscription ID:", SUBSCRIPTION_DATA.subscription_id);
    console.log(
      "   Trial ends:",
      SUBSCRIPTION_DATA.trial_end.toLocaleDateString()
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

async function createUser() {
  try {
    // Check if user already exists
    try {
      const existingUser = await auth.getUser(TEST_USER.uid);
      console.log("User already exists:", existingUser.email);
      console.log("Deleting existing user...");
      await auth.deleteUser(TEST_USER.uid);
    } catch (error) {
      // User doesn't exist, that's fine
      console.log("Creating new user...");
    }

    // Create the user with specific UID
    const userRecord = await auth.createUser({
      uid: TEST_USER.uid,
      email: TEST_USER.email,
      emailVerified: TEST_USER.emailVerified,
      password: TEST_USER.password,
      displayName: TEST_USER.displayName,
    });

    console.log("✅ Successfully created user:");
    console.log("   UID:", userRecord.uid);
    console.log("   Email:", userRecord.email);
    console.log("   Display Name:", userRecord.displayName);
    console.log("   Email Verified:", userRecord.emailVerified);

    // Create user document with Twitter credentials
    console.log("\nCreating user document...");
    await createUserDocument();

    // Create subscription for the user
    console.log("\nCreating subscription...");
    await createSubscription();

    console.log("\n==============================================");
    console.log("User and Subscription created in Emulators!");
    console.log("==============================================");
    console.log("You can now login with:");
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  UID: ${TEST_USER.uid}`);
    console.log(`  Plan: Starter (with 7-day trial)`);
    console.log(`  Twitter: Test credentials configured`);
    console.log("==============================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

// Check if emulators are running
async function checkEmulators() {
  try {
    // Try to list users - this will fail if emulator is not running
    await auth.listUsers(1);
    return true;
  } catch (error) {
    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.error("❌ Auth Emulator is not running!");
      console.log("Please start the emulators first:");
      console.log("  firebase emulators:start --only auth,firestore");
      process.exit(1);
    }
    // Other errors are fine (like no users exist)
    return true;
  }
}

// Main
async function main() {
  console.log(
    "Firebase Auth & Firestore Emulator - Setup User with Subscription"
  );
  console.log(
    "==================================================================\n"
  );

  await checkEmulators();
  await createUser();
}

main().catch(console.error);
