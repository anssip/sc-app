import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createUsageService } from "./lib/usage-service.js";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

const db: Firestore = getFirestore();
const auth = getAuth();

// Billing API configuration
const BILLING_API_URL = process.env.BILLING_API_URL || "https://billing-server-346028322665.europe-west1.run.app";
const TOKEN_THRESHOLD = 1000000; // 1 million tokens
const TOKENS_PER_UNIT = 1000; // Billing API expects quantity / 1000

/**
 * Scheduled function to process pending usage records and send to billing API.
 * Runs every hour to batch process usage data.
 */
export const processUsageBilling = onSchedule({
  schedule: "every 1 hours",
  timeZone: "UTC",
  memory: "256MiB",
  timeoutSeconds: 300,
}, async (_context) => {
  console.log("Starting scheduled usage billing process...");

  try {
    const usageService = createUsageService(db);

    // Get all active subscriptions
    const subscriptionsSnapshot = await db
      .collection("subscriptions")
      .where("status", "in", ["active", "trialing"])
      .get();

    console.log(`Found ${subscriptionsSnapshot.size} active subscriptions to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each subscription
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const subscriptionId = subscriptionDoc.id;
      const subscriptionData = subscriptionDoc.data();
      const userId = subscriptionData.user_id;

      if (!userId) {
        console.error(`Subscription ${subscriptionId} has no user_id`);
        errorCount++;
        continue;
      }

      try {
        // Get total pending usage for this subscription
        const totalTokens = await usageService.getPendingUsageTotal(subscriptionId);

        if (totalTokens >= TOKEN_THRESHOLD) {
          console.log(
            `Subscription ${subscriptionId} has ${totalTokens} pending tokens - processing billing`
          );

          // Get all pending usage records
          const pendingRecords = await usageService.getPendingUsageRecords(subscriptionId);

          if (pendingRecords.length === 0) {
            console.warn(`No pending records found for subscription ${subscriptionId}`);
            continue;
          }

          // Calculate billing quantity (divide by 1000)
          const billingQuantity = Math.floor(totalTokens / TOKENS_PER_UNIT);

          // Send to billing API
          const success = await sendToBillingAPI(
            subscriptionId,
            billingQuantity,
            userId
          );

          if (success) {
            // Mark all processed records as recorded
            const sessionIds = pendingRecords.map(record => record.id);
            await usageService.markUsageAsRecorded(subscriptionId, sessionIds);

            console.log(
              `Successfully processed ${billingQuantity} units (${totalTokens} tokens) ` +
              `for subscription ${subscriptionId}`
            );

            // Record billing event in Firestore for audit
            await db.collection("billing_events").add({
              subscriptionId,
              userId,
              totalTokens,
              billingQuantity,
              recordCount: pendingRecords.length,
              timestamp: new Date(),
              status: "success",
            });

            processedCount++;
          } else {
            console.error(`Failed to send billing for subscription ${subscriptionId}`);

            // Record failed billing attempt
            await db.collection("billing_events").add({
              subscriptionId,
              userId,
              totalTokens,
              billingQuantity,
              recordCount: pendingRecords.length,
              timestamp: new Date(),
              status: "failed",
              error: "Billing API call failed",
            });

            errorCount++;
          }
        } else if (totalTokens > 0) {
          console.log(
            `Subscription ${subscriptionId} has ${totalTokens} pending tokens ` +
            `(below threshold of ${TOKEN_THRESHOLD})`
          );
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscriptionId}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Usage billing process completed: ${processedCount} processed, ${errorCount} errors`
    );

    // Log summary
    await db.collection("billing_process_logs").add({
      timestamp: new Date(),
      subscriptionsProcessed: processedCount,
      errors: errorCount,
      totalSubscriptions: subscriptionsSnapshot.size,
    });

  } catch (error) {
    console.error("Fatal error in usage billing process:", error);

    // Log critical error
    await db.collection("billing_process_logs").add({
      timestamp: new Date(),
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
});

/**
 * Sends usage data to the billing API.
 * Returns true if successful, false otherwise.
 */
async function sendToBillingAPI(
  subscriptionId: string,
  quantity: number,
  userId: string
): Promise<boolean> {
  try {
    // Get Firebase auth token for the service account
    // In production, this would use a service account with proper permissions
    let idToken: string;

    try {
      // For scheduled functions, we need to use a custom token approach
      // or store a service account token
      // For now, we'll use the admin SDK to create a custom token
      const customToken = await auth.createCustomToken(userId);

      // Note: In production, you'd want to exchange this for an ID token
      // or use a dedicated service account approach
      console.log("Using service account authentication for billing API");

      // For emulator/testing, we'll proceed without a real token
      if (process.env.FUNCTIONS_EMULATOR_HOST) {
        console.log("Skipping billing API call in emulator mode");
        return true;
      }

      // In production, you'd get a proper service account token here
      idToken = customToken; // This is a placeholder - needs proper implementation
    } catch (tokenError) {
      console.error("Error getting auth token:", tokenError);
      return false;
    }

    const url = `${BILLING_API_URL}/api/subscriptions/${subscriptionId}/record`;

    console.log(`Calling billing API: POST ${url} with quantity: ${quantity}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        event_name: "ai_token",
        quantity: quantity,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Billing API error: ${response.status} ${response.statusText} - ${errorText}`
      );
      return false;
    }

    const result = await response.json();
    console.log("Billing API response:", result);

    return true;
  } catch (error) {
    console.error("Error calling billing API:", error);
    return false;
  }
}

/**
 * Manual trigger for testing the billing process.
 * Can be called via HTTP endpoint for testing purposes.
 */
export const triggerUsageBilling = onSchedule({
  schedule: "every 24 hours", // Dummy schedule, will be triggered manually
  timeZone: "UTC",
  memory: "256MiB",
  timeoutSeconds: 300,
  labels: {
    deployment: "manual-trigger",
  },
}, async (context) => {
  console.log("Manual trigger of usage billing process");

  // Call the main processing function (simulate the same context)
  return processUsageBilling.run(context);
});