/**
 * Dedicated Cloud Function for sharing to X (Twitter)
 * Handles large POST bodies without Firebase Hosting proxy issues
 */

import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import cors from "cors";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { TweetQueueDocument } from "./types/tweet-queue";
import { sanitizeTextForTwitter, splitMessages } from "./utils/twitter.js";

interface ShareRequest {
  screenshot: string; // Base64 encoded image
  mainTweetText: string;
  selectedMessages?: Array<{
    role: string;
    content: string;
  }>;
  selectedTweets?: string[]; // New: pre-split tweet texts
}

interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  username: string;
  userId: string;
}

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

const app = express();

// Configure CORS to allow requests from your domain
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" })); // Allow large payloads for screenshots

/**
 * Get user's Twitter credentials from Firestore
 */
async function getUserTwitterCredentials(
  userId: string
): Promise<TwitterCredentials | null> {
  const db = getFirestore();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data();
  return data?.twitterCredentials || null;
}

/**
 * Verify Firebase auth token and get user ID
 */
async function verifyAuthToken(idToken: string): Promise<string> {
  const auth = getAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  return decodedToken.uid;
}

/**
 * Format Unix timestamp to human-readable time
 */
export function formatResetTime(resetTimestamp: number): string {
  const resetDate = new Date(resetTimestamp * 1000);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "now";
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${
      minutes !== 1 ? "s" : ""
    }`;
  }

  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

// POST endpoint for sharing to X
app.post("/", async (req: Request, res: Response) => {
  try {
    // Get and verify authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const userId = await verifyAuthToken(idToken);

    // Get user's Twitter credentials
    const credentials = await getUserTwitterCredentials(userId);
    if (!credentials) {
      return res.status(400).json({
        error:
          "Twitter API credentials not configured. Please add your credentials in Settings.",
      });
    }

    // Validate credentials are complete
    if (!credentials.accessToken || !credentials.accessSecret) {
      return res.status(400).json({
        error:
          "Incomplete Twitter API credentials. Please reconnect your X account in Settings.",
      });
    }

    console.log("Twitter credentials loaded for user:", userId);

    // Parse request body
    const data: ShareRequest = req.body;
    const { screenshot, mainTweetText, selectedMessages, selectedTweets } = data;

    // Validate inputs
    if (!mainTweetText || mainTweetText.trim().length === 0) {
      return res.status(400).json({ error: "Main tweet text is required" });
    }

    if (!screenshot) {
      return res.status(400).json({ error: "Screenshot is required" });
    }

    // Upload screenshot to Cloud Storage
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    console.log("Uploading image to Cloud Storage...");
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `tweet-images/${userId}/${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    // Make the file publicly readable
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("Image uploaded to:", imageUrl);

    // Prepare reply tweets
    const replies: string[] = [];

    // Use either pre-split tweets (new) or split messages (legacy)
    if (selectedTweets && selectedTweets.length > 0) {
      console.log("Using pre-split tweets:", selectedTweets.length);
      replies.push(...selectedTweets);
    } else if (selectedMessages && selectedMessages.length > 0) {
      const chunks = splitMessages(selectedMessages);
      console.log("Split messages into", chunks.length, "tweet chunks");
      replies.push(...chunks);
    }

    // Sanitize tweet text
    const sanitizedMainText = sanitizeTextForTwitter(mainTweetText);

    // Create Firestore document for queued tweets
    const db = getFirestore();
    const queueDoc: Omit<TweetQueueDocument, "id"> = {
      mainTweet: {
        text: sanitizedMainText,
        imageUrl,
      },
      replies,
      status: "pending",
      currentIndex: 0,
      tweetIds: [],
      userId,
      createdAt: Timestamp.now(),
      lastPostedAt: null,
      errorCount: 0,
      lastError: null,
      nextRetryAt: null,
    };

    const docRef = await db.collection("tweetQueue").add(queueDoc);
    console.log("Tweet queued with ID:", docRef.id);

    // Return queued status
    return res.json({
      success: true,
      queued: true,
      queueId: docRef.id,
      message: `Tweet queued! Your main tweet and ${replies.length} replies will be posted over the next ${replies.length + 1} minutes.`,
      totalTweets: replies.length + 1,
    });
  } catch (error) {
    console.error("Error queuing tweet:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to queue tweet",
    });
  }
});

// Export as Cloud Function
export const shareToX = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 100,
    region: "us-central1",
    invoker: "public",
    secrets: ["TWITTER_API_KEY", "TWITTER_API_SECRET"],
  },
  app
);
