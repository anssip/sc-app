import { Firestore, FieldValue } from "firebase-admin/firestore";

interface UsageData {
  sessionId: string;
  userId: string;
  subscriptionId: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp?: any;
  lastUpdated?: any;
  status: "pending" | "recorded" | "free_preview";
  isPreview?: boolean;
}

interface RecordUsageOptions {
  sessionId: string;
  userId: string;
  subscriptionId: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  isPreview?: boolean;
}

export class UsageService {
  constructor(private db: Firestore) {}

  /**
   * Records OpenAI API token usage to Firestore.
   * Stores in subscriptions/{subscriptionId}/usage/{sessionId} for paid users,
   * or in users/{userId}/free_usage/{sessionId} for preview users.
   */
  async recordUsage(options: RecordUsageOptions): Promise<void> {
    const {
      sessionId,
      userId,
      subscriptionId,
      promptTokens,
      completionTokens,
      totalTokens,
      model,
      isPreview = false,
    } = options;

    try {
      // Determine where to store the usage data
      let usageRef;
      let status: UsageData["status"];

      if (subscriptionId && !isPreview) {
        // Paid subscription usage
        usageRef = this.db
          .collection("subscriptions")
          .doc(subscriptionId)
          .collection("usage")
          .doc(sessionId);
        status = "pending";
      } else {
        // Free preview usage
        usageRef = this.db
          .collection("users")
          .doc(userId)
          .collection("free_usage")
          .doc(sessionId);
        status = "free_preview";
      }

      // Check if a usage record already exists for this session
      const existingDoc = await usageRef.get();

      if (existingDoc.exists) {
        // Update existing usage record by adding new tokens
        const existingData = existingDoc.data() as UsageData;
        await usageRef.update({
          promptTokens: (existingData.promptTokens || 0) + promptTokens,
          completionTokens:
            (existingData.completionTokens || 0) + completionTokens,
          totalTokens: (existingData.totalTokens || 0) + totalTokens,
          lastUpdated: FieldValue.serverTimestamp(),
        });

        console.log(
          `Updated usage for session ${sessionId}: +${totalTokens} tokens (total: ${
            (existingData.totalTokens || 0) + totalTokens
          })`
        );
      } else {
        // Create new usage record
        const usageData: UsageData = {
          sessionId,
          userId,
          subscriptionId,
          promptTokens,
          completionTokens,
          totalTokens,
          model,
          timestamp: FieldValue.serverTimestamp(),
          lastUpdated: FieldValue.serverTimestamp(),
          status,
        };

        if (isPreview) {
          usageData.isPreview = true;
        }

        await usageRef.set(usageData);

        console.log(
          `Created new usage record for session ${sessionId}: ${totalTokens} tokens (${
            status === "free_preview" ? "preview" : "paid"
          })`
        );
      }
    } catch (error) {
      console.error("Error recording usage:", error);
      // Don't throw - we don't want usage tracking errors to break the chat
      // The error is logged for monitoring
    }
  }

  /**
   * Gets the total pending usage for a subscription.
   * Used by the scheduled function to determine when to send to billing API.
   */
  async getPendingUsageTotal(subscriptionId: string): Promise<number> {
    try {
      const pendingUsage = await this.db
        .collection("subscriptions")
        .doc(subscriptionId)
        .collection("usage")
        .where("status", "==", "pending")
        .get();

      let totalTokens = 0;
      pendingUsage.forEach((doc) => {
        const data = doc.data() as UsageData;
        totalTokens += data.totalTokens || 0;
      });

      return totalTokens;
    } catch (error) {
      console.error(
        `Error getting pending usage for subscription ${subscriptionId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Gets all pending usage records for a subscription.
   * Used by the scheduled function to batch process usage.
   */
  async getPendingUsageRecords(
    subscriptionId: string
  ): Promise<Array<{ id: string; data: UsageData }>> {
    try {
      const pendingUsage = await this.db
        .collection("subscriptions")
        .doc(subscriptionId)
        .collection("usage")
        .where("status", "==", "pending")
        .get();

      return pendingUsage.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as UsageData,
      }));
    } catch (error) {
      console.error(
        `Error getting pending usage records for subscription ${subscriptionId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Marks usage records as recorded after successful billing API call.
   * Used by the scheduled function after sending to billing API.
   */
  async markUsageAsRecorded(
    subscriptionId: string,
    sessionIds: string[]
  ): Promise<void> {
    try {
      const batch = this.db.batch();

      for (const sessionId of sessionIds) {
        const usageRef = this.db
          .collection("subscriptions")
          .doc(subscriptionId)
          .collection("usage")
          .doc(sessionId);

        batch.update(usageRef, {
          status: "recorded",
          recordedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      console.log(
        `Marked ${sessionIds.length} usage records as recorded for subscription ${subscriptionId}`
      );
    } catch (error) {
      console.error(
        `Error marking usage as recorded for subscription ${subscriptionId}:`,
        error
      );
      throw error; // Re-throw as this is critical for billing accuracy
    }
  }

  /**
   * Gets the user's active subscription ID from Firestore.
   * Returns null if no active subscription found.
   */
  async getUserSubscriptionId(userId: string): Promise<string | null> {
    try {
      // Check if user has a subscription document
      // Note: The frontend stores with 'firebase_uid' field
      const subscriptionQuery = await this.db
        .collection("subscriptions")
        .where("firebase_uid", "==", userId)
        .where("status", "in", ["active", "trialing"])
        .limit(1)
        .get();

      if (!subscriptionQuery.empty) {
        const subscriptionId = subscriptionQuery.docs[0].id;
        const subscriptionData = subscriptionQuery.docs[0].data();
        console.log(
          `Found subscription for user ${userId}: ${subscriptionId}, status: ${subscriptionData.status}`
        );
        return subscriptionId;
      }

      console.log(`No active subscription found for user ${userId}`);
      return null;
    } catch (error) {
      console.error(`Error getting subscription for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Checks if a user is in their preview period.
   * Returns preview status based on localStorage key stored in Firestore.
   */
  async isUserInPreview(userId: string): Promise<boolean> {
    try {
      // Check user document for preview start time
      const userDoc = await this.db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return false;
      }

      const userData = userDoc.data();
      const previewStart = userData?.previewStartTime;

      if (!previewStart) {
        return false;
      }

      // Check if within 5-minute preview window
      const now = Date.now();
      const previewStartMs = previewStart.toMillis
        ? previewStart.toMillis()
        : previewStart;
      const elapsedMinutes = (now - previewStartMs) / (1000 * 60);

      return elapsedMinutes < 5;
    } catch (error) {
      console.error(`Error checking preview status for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Starts a preview period for a user.
   * Stores the start time in Firestore.
   */
  async startPreview(userId: string): Promise<void> {
    try {
      await this.db.collection("users").doc(userId).set(
        {
          previewStartTime: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`Started preview period for user ${userId}`);
    } catch (error) {
      console.error(`Error starting preview for user ${userId}:`, error);
    }
  }
}

// Export a factory function instead of an instance
export function createUsageService(db: Firestore): UsageService {
  return new UsageService(db);
}
