/**
 * Customer.io Server-Side Sync via Firebase Cloud Functions
 *
 * This module contains Cloud Functions that automatically sync data to Customer.io:
 * - syncUserToCustomerIO: Syncs user profile data when users collection is updated
 * - syncSubscriptionToCustomerIO: Tracks subscription events when subscriptions collection is updated
 *
 * Uses the Customer.io Node.js SDK with EU region support.
 *
 * Environment variables required:
 * - CUSTOMER_IO_WRITE_KEY: Your Customer.io write key (set via Firebase Functions config)
 */

import {
  onDocumentWritten,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { Analytics } from "@customerio/cdp-analytics-node";
import { logger } from "firebase-functions/v2";

// Define secret for Customer.io write key
const customerIOWriteKey = defineSecret("CUSTOMER_IO_WRITE_KEY");

// Initialize Customer.io Analytics with EU region
const getCustomerIOClient = () => {
  const writeKey = customerIOWriteKey.value();

  logger.info(
    `Using Customer.io write key: ${writeKey.substring(
      0,
      3
    )}...${writeKey.substring(writeKey.length - 4)}`
  );

  return new Analytics({
    writeKey,
    host: "https://cdp-eu.customer.io", // EU region endpoint
  });
};

/**
 * Firestore trigger: Syncs user data to Customer.io
 * Triggers on any write (create/update) to users/{userId}
 */
export const syncUserToCustomerIO = onDocumentWritten(
  {
    document: "users/{userId}",
    region: "us-central1",
    secrets: [customerIOWriteKey],
  },
  async (event) => {
    try {
      const userId = event.params.userId;
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();

      // If document was deleted, skip
      if (!afterData) {
        logger.info(`User ${userId} deleted, skipping Customer.io sync`);
        return;
      }

      const cio = getCustomerIOClient();

      // Prepare user traits
      const traits: Record<string, any> = {
        email: afterData.email,
        marketing_consent: afterData.marketingConsent || false,
        email_verified: afterData.emailVerified || false,
      };

      // Add timestamps if available
      if (afterData.createdAt) {
        traits.created_at = Math.floor(afterData.createdAt.toMillis() / 1000);
      }
      if (afterData.verifiedAt) {
        traits.email_verified_at = Math.floor(
          afterData.verifiedAt.toMillis() / 1000
        );
      }
      if (afterData.consentTimestamp) {
        traits.marketing_consent_updated_at = Math.floor(
          afterData.consentTimestamp.toMillis() / 1000
        );
      }

      // Identify user in Customer.io

      cio.identify({
        userId,
        traits,
      });

      logger.info(`Identified user ${userId} in Customer.io`, { traits });

      // Track events based on what changed

      // 1. User just signed up (document created)
      if (!beforeData) {
        cio.track({
          userId,
          event: "user_signed_up",
          properties: {
            email: afterData.email,
            marketing_consent: afterData.marketingConsent || false,
            signup_method: "email", // Could be enhanced to track Google vs email
            email_verified: false,
          },
        });
        logger.info(`Tracked signup event for user ${userId}`);
      }

      // 2. Email verification status changed from false to true
      if (beforeData && !beforeData.emailVerified && afterData.emailVerified) {
        cio.track({
          userId,
          event: "email_verified",
          properties: {
            user_id: userId,
            email: afterData.email,
            verified_at: Date.now(),
          },
        });
        logger.info(`Tracked email verification event for user ${userId}`);
      }

      // 3. Marketing consent changed
      if (
        beforeData &&
        beforeData.marketingConsent !== afterData.marketingConsent
      ) {
        cio.track({
          userId,
          event: "marketing_consent_updated",
          properties: {
            user_id: userId,
            consent: afterData.marketingConsent,
            timestamp: Date.now(),
          },
        });
        logger.info(
          `Tracked marketing consent change for user ${userId}: ${afterData.marketingConsent}`
        );
      }

      // Flush the analytics client to ensure events are sent
      await cio.closeAndFlush();
    } catch (error) {
      logger.error("Error syncing user to Customer.io:", error);
      // Don't throw - we don't want to block Firestore writes if Customer.io fails
    }
  }
);

/**
 * Firestore trigger: Tracks subscription events to Customer.io
 * Triggers on document creation in subscriptions/{subscriptionId}
 */
export const syncSubscriptionToCustomerIO = onDocumentCreated(
  {
    document: "subscriptions/{subscriptionId}",
    region: "us-central1",
    secrets: [customerIOWriteKey],
  },
  async (event) => {
    try {
      const subscriptionId = event.params.subscriptionId;
      const subscriptionData = event.data?.data();

      if (!subscriptionData) {
        logger.warn(`Subscription ${subscriptionId} has no data, skipping`);
        return;
      }

      const cio = getCustomerIOClient();

      // Get the user ID from the subscription document
      const userId = subscriptionData.firebase_uid;
      if (!userId) {
        logger.warn(
          `Subscription ${subscriptionId} has no firebase_uid, skipping`
        );
        return;
      }

      // Prepare subscription event properties
      const properties: Record<string, any> = {
        subscription_id: subscriptionData.subscription_id || subscriptionId,
        ...subscriptionData,
        created_at: Date.now(),
      };

      // Add optional fields if available
      if (subscriptionData.trial_end) {
        properties.trial_end = subscriptionData.trial_end;
      }
      if (subscriptionData.current_period_end) {
        properties.current_period_end = subscriptionData.current_period_end;
      }
      if (subscriptionData.cancel_at_period_end !== undefined) {
        properties.cancel_at_period_end = subscriptionData.cancel_at_period_end;
      }

      // Track subscription started event
      cio.track({
        userId,
        event: "subscription_started",
        properties,
      });

      logger.info(`Tracked subscription_started event for user ${userId}`, {
        subscriptionId,
        properties,
      });

      // Flush the analytics client to ensure events are sent
      await cio.closeAndFlush();
    } catch (error) {
      logger.error("Error tracking subscription to Customer.io:", error);
      // Don't throw - we don't want to block Firestore writes if Customer.io fails
    }
  }
);
