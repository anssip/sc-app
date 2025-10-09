#!/usr/bin/env node

/**
 * Script to grant free access to a user by creating a subscription in production Firestore
 * This creates a subscription document NOT linked to Stripe for extended free trials
 * Usage: node scripts/grant-free-access.mjs <email_or_uid> <expiration_date> <plan>
 * Example: node scripts/grant-free-access.mjs user@example.com 31/12/2025 Starter
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import * as readline from "readline/promises";

// Plan configurations (production price IDs)
const PLANS = {
  Starter: {
    name: "Starter",
    price_id: "price_0Rx7Lb22sagdNJ63Z15hBqxP",
    product_id: "prod_QfRN0kRLjOK9oZ",
  },
  Pro: {
    name: "Pro",
    price_id: "price_0Rx7MY22sagdNJ63sqxZfef5",
    product_id: "prod_QfRN0kRLjOK9oZ",
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error("❌ Invalid arguments");
  console.log("\nUsage: node scripts/grant-free-access.mjs <email_or_uid> <DD/MM/YYYY> <plan>");
  console.log("Example: node scripts/grant-free-access.mjs user@example.com 31/12/2025 Starter");
  console.log("\nAvailable plans: Starter, Pro");
  process.exit(1);
}

const [userIdentifier, expirationDateStr, planArg] = args;

// Validate plan
const plan = PLANS[planArg];
if (!plan) {
  console.error(`❌ Invalid plan: ${planArg}`);
  console.log("\nAvailable plans: Starter, Pro");
  console.log("(case-sensitive)");
  process.exit(1);
}

// Parse and validate expiration date
function parseExpirationDate(dateStr) {
  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid date format. Expected DD/MM/YYYY (e.g., 31/12/2025)"
    );
  }

  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error("Date must contain only numbers");
  }

  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12");
  }

  if (day < 1 || day > 31) {
    throw new Error("Day must be between 1 and 31");
  }

  if (year < 2025 || year > 2100) {
    throw new Error("Year seems invalid");
  }

  // JavaScript months are 0-indexed
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);

  // Validate the date is actually valid (e.g., not Feb 31)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    throw new Error("Invalid date (e.g., Feb 31 doesn't exist)");
  }

  // Check that date is in the future
  if (date <= new Date()) {
    throw new Error("Expiration date must be in the future");
  }

  return date;
}

let expirationDate;
try {
  expirationDate = parseExpirationDate(expirationDateStr);
} catch (error) {
  console.error("❌ Error parsing expiration date:", error.message);
  process.exit(1);
}

// Initialize Firebase Admin for production
let app;
try {
  // Try to load service account from environment variable or file
  let serviceAccount;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    serviceAccount = JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
    );
  } else {
    // Try default location
    try {
      serviceAccount = JSON.parse(
        readFileSync("./serviceAccountKey.json", "utf8")
      );
    } catch {
      console.error("❌ Service account credentials not found!");
      console.log(
        "\nPlease set GOOGLE_APPLICATION_CREDENTIALS environment variable"
      );
      console.log(
        "or place serviceAccountKey.json in the project root directory."
      );
      console.log(
        "\nDownload from: Firebase Console > Project Settings > Service Accounts"
      );
      process.exit(1);
    }
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error) {
  console.error("❌ Error initializing Firebase Admin:", error.message);
  process.exit(1);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Find user by email or UID
async function findUser(identifier) {
  try {
    // Try as UID first
    try {
      return await auth.getUser(identifier);
    } catch {
      // If not found as UID, try as email
      return await auth.getUserByEmail(identifier);
    }
  } catch (error) {
    throw new Error(`User not found: ${identifier}`);
  }
}

// Check for existing subscriptions
async function checkExistingSubscriptions(userId) {
  const snapshot = await db
    .collection("subscriptions")
    .where("firebase_uid", "==", userId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Confirm action with user
async function confirmAction(user, existingSubscriptions) {
  console.log("\n⚠️  PRODUCTION FIRESTORE - CONFIRMATION REQUIRED ⚠️");
  console.log("=".repeat(60));
  console.log("\nYou are about to create a free access subscription for:");
  console.log(`  User: ${user.email}`);
  console.log(`  UID: ${user.uid}`);
  console.log(`  Plan: ${plan.name}`);
  console.log(`  Expiration: ${expirationDate.toLocaleDateString()}`);

  if (existingSubscriptions.length > 0) {
    console.log(`\n⚠️  This user has ${existingSubscriptions.length} existing active subscription(s):`);
    existingSubscriptions.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.id}`);
      console.log(`     Status: ${sub.status}`);
      if (sub.current_period_end) {
        const endDate =
          sub.current_period_end.toDate?.() || sub.current_period_end;
        console.log(`     Expires: ${endDate.toLocaleDateString()}`);
      }
    });
  }

  console.log("\nThis will grant free access until the expiration date.");
  console.log("=".repeat(60));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question('\nType "yes" to confirm: ');
  rl.close();

  return answer.toLowerCase() === "yes";
}

// Create free access subscription
async function createFreeSubscription(user) {
  const now = new Date();
  const subscriptionId = `free_trial_${now.getTime()}`;

  const subscriptionData = {
    firebase_uid: user.uid,
    user_id: user.uid,
    email: user.email,
    status: "active",
    subscription_id: subscriptionId,
    customer_id: "manual_free_trial",
    price_id: plan.price_id,
    product_id: plan.product_id,
    created_at: now,
    current_period_start: now,
    current_period_end: expirationDate,
    trial_end: expirationDate,
    cancel_at_period_end: false,
    metadata: {
      environment: "production",
      type: "manual_free_trial",
      plan: plan.name.toLowerCase(),
      granted_at: now.toISOString(),
      granted_by: "admin_script",
      note: `Extended free trial (${plan.name}) - not linked to Stripe`,
    },
  };

  const subscriptionRef = db.collection("subscriptions").doc(subscriptionId);
  await subscriptionRef.set(subscriptionData);

  return subscriptionData;
}

// Main function
async function main() {
  console.log("Grant Free Access - Production Firestore");
  console.log("=".repeat(60));

  try {
    // Find the user
    console.log(`\n🔍 Looking up user: ${userIdentifier}...`);
    const user = await findUser(userIdentifier);
    console.log(`✅ Found user: ${user.email} (${user.uid})`);

    // Check for existing subscriptions
    console.log("\n🔍 Checking for existing subscriptions...");
    const existingSubscriptions = await checkExistingSubscriptions(user.uid);
    if (existingSubscriptions.length === 0) {
      console.log("✅ No existing active subscriptions found");
    }

    // Get confirmation
    const confirmed = await confirmAction(user, existingSubscriptions);
    if (!confirmed) {
      console.log("\n❌ Operation cancelled by user");
      process.exit(0);
    }

    // Create the subscription
    console.log("\n📝 Creating free access subscription...");
    const subscription = await createFreeSubscription(user);

    console.log("\n✅ SUCCESS! Free access granted");
    console.log("=".repeat(60));
    console.log("Subscription Details:");
    console.log(`  ID: ${subscription.subscription_id}`);
    console.log(`  User: ${subscription.email}`);
    console.log(`  Plan: ${plan.name}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Expires: ${expirationDate.toLocaleDateString()}`);
    console.log(`  Days remaining: ${Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24))}`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

main();
