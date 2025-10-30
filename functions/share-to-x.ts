/**
 * Dedicated Cloud Function for sharing to X (Twitter)
 * Handles large POST bodies without Firebase Hosting proxy issues
 */

import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import cors from "cors";
import { TwitterApi } from "twitter-api-v2";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

interface ShareRequest {
  screenshot: string; // Base64 encoded image
  mainTweetText: string;
  selectedMessages: Array<{
    role: string;
    content: string;
  }>;
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
 * Get Twitter API client instance using app credentials + user access tokens
 */
function getTwitterClient(credentials: TwitterCredentials): TwitterApi {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Twitter API credentials not configured on server");
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: credentials.accessToken,
    accessSecret: credentials.accessSecret,
  });
}

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
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Strip markdown and HTML from text for Twitter
 */
export function sanitizeTextForTwitter(text: string): string {
  let sanitized = text;

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove markdown code blocks (```code```)
  sanitized = sanitized.replace(/```[\s\S]*?```/g, "");

  // Remove inline code (`code`)
  sanitized = sanitized.replace(/`([^`]+)`/g, "$1");

  // Remove markdown images FIRST (![alt](url)) before links are processed
  sanitized = sanitized.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove markdown links but keep the text ([text](url) -> text)
  sanitized = sanitized.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove markdown bold/italic (**bold**, __bold__, *italic*, _italic_)
  // Using .+? for non-greedy matching and s flag for multiline support
  sanitized = sanitized.replace(/\*\*(.+?)\*\*/gs, "$1");
  sanitized = sanitized.replace(/__(.+?)__/gs, "$1");
  sanitized = sanitized.replace(/\*(.+?)\*/gs, "$1");
  sanitized = sanitized.replace(/_(.+?)_/gs, "$1");

  // Remove markdown headers (# Header)
  sanitized = sanitized.replace(/^#{1,6}\s+/gm, "");

  // Clean up any remaining orphaned markdown markers that weren't part of matched pairs
  sanitized = sanitized.replace(/\*\*/g, "");
  sanitized = sanitized.replace(/__/g, "");
  sanitized = sanitized.replace(/\*/g, "");
  sanitized = sanitized.replace(/_/g, "");

  // Normalize whitespace (multiple spaces/newlines to single)
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  sanitized = sanitized.replace(/  +/g, " ");

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Split messages into tweet-sized chunks
 * NOTE: Sanitizes text BEFORE splitting to get accurate length calculations
 */
function splitMessages(
  messages: Array<{ role: string; content: string }>,
  maxLength: number = 280
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const message of messages) {
    // Sanitize content FIRST to get accurate character count
    // (markdown/HTML will be removed, so we need to measure the final text)
    const sanitizedContent = sanitizeTextForTwitter(message.content);
    const messageText = `${
      message.role === "user" ? "👤" : "🤖"
    } ${sanitizedContent}`;
    const separator = currentChunk ? "\n\n---\n\n" : "";
    const combined = currentChunk + separator + messageText;

    if (combined.length <= maxLength) {
      currentChunk = combined;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      if (messageText.length > maxLength) {
        const words = messageText.split(" ");
        let tempChunk = "";

        for (const word of words) {
          if ((tempChunk + " " + word).length > maxLength) {
            if (tempChunk) {
              chunks.push(tempChunk.trim());
            }
            tempChunk = word;
          } else {
            tempChunk = tempChunk ? tempChunk + " " + word : word;
          }
        }

        currentChunk = tempChunk;
      } else {
        currentChunk = messageText;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
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
    const { screenshot, mainTweetText, selectedMessages } = data;

    // Validate inputs
    if (!mainTweetText || mainTweetText.trim().length === 0) {
      return res.status(400).json({ error: "Main tweet text is required" });
    }

    if (!screenshot) {
      return res.status(400).json({ error: "Screenshot is required" });
    }

    // Get Twitter client
    const client = getTwitterClient(credentials);

    // Upload screenshot (convert base64 to buffer)
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    console.log("Uploading image to Twitter...");
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: "image/jpeg",
    });
    console.log("Image uploaded, mediaId:", mediaId);

    // Post main tweet with image
    console.log("Posting main tweet...");
    const sanitizedMainText = sanitizeTextForTwitter(mainTweetText);
    const mainTweet = await client.v2.tweet({
      text: sanitizedMainText,
      media: {
        media_ids: [mediaId],
      },
    });

    console.log("Main tweet posted:", mainTweet.data.id);

    // Track posted replies for partial success reporting
    const postedReplies: string[] = [];
    let lastSuccessfulTweetId = mainTweet.data.id;

    if (selectedMessages && selectedMessages.length > 0) {
      console.log("Creating thread with", selectedMessages.length, "messages");

      const chunks = splitMessages(selectedMessages);
      console.log("Split into", chunks.length, "tweet chunks");

      // Use the dedicated .reply method for creating threads
      let lastTweet = mainTweet;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          // Increase delay to reduce spam detection (3-5 seconds with randomization)
          const delayMs = 3000 + Math.random() * 2000; // 3-5 seconds
          console.log(
            `Waiting ${Math.round(delayMs / 1000)} seconds before posting tweet ${i + 1}/${chunks.length}...`
          );
          await delay(delayMs);

          const reply = await client.v2.reply(chunk, lastTweet.data.id);

          lastTweet = reply; // Update lastTweet to the new reply
          lastSuccessfulTweetId = lastTweet.data.id;
          postedReplies.push(lastTweet.data.id);
          console.log(
            `Posted reply tweet ${i + 1}/${chunks.length}:`,
            lastTweet.data.id
          );
        } catch (replyError) {
          console.error(`Failed to post reply tweet ${i + 1}:`, replyError);

          // Check if it's a 403 Forbidden error (spam detection or permission issue)
          const errorCode = (replyError as any).code;
          if (errorCode === 403) {
            console.warn(
              "Twitter spam detection or permission issue detected - stopping thread creation"
            );
            // Return partial success - main tweet and some replies were posted
            const tweetUrl = `https://twitter.com/${credentials.username}/status/${mainTweet.data.id}`;
            return res.json({
              success: true,
              tweetUrl,
              warning: `Posted main tweet and ${postedReplies.length} of ${chunks.length} replies. Twitter's spam detection prevented further posts. Try posting the remaining content separately.`,
              postedReplies: postedReplies.length,
              totalReplies: chunks.length,
            });
          }

          // For other errors, rethrow to be caught by outer handler
          throw replyError;
        }
      }
    }

    // Return success with tweet URL
    const tweetUrl = `https://twitter.com/${credentials.username}/status/${mainTweet.data.id}`;

    return res.json({
      success: true,
      tweetUrl,
    });
  } catch (error) {
    console.error("Error sharing to X:", error);

    // Handle specific Twitter API errors
    if (error instanceof Error) {
      const errorCode = (error as any).code;
      const errorData = (error as any).data;
      const rateLimit = (error as any).rateLimit;

      console.error("Error type:", (error as any).type);
      console.error("Error code:", errorCode);
      console.error("Error data:", errorData);

      // Handle rate limit errors (429)
      if (errorCode === 429 && rateLimit) {
        const resetTime = rateLimit.day?.reset || rateLimit.reset;
        const remaining = rateLimit.day?.remaining ?? rateLimit.remaining;
        const limit = rateLimit.day?.limit ?? rateLimit.limit;

        console.error("Rate limit hit:", {
          limit,
          remaining,
          resetTime,
        });

        const timeUntilReset = formatResetTime(resetTime);
        const resetDate = new Date(resetTime * 1000);

        return res.status(429).json({
          error: "Twitter API rate limit reached",
          message: `You've reached your daily posting limit (${limit} posts per 24 hours). Your limit will reset in ${timeUntilReset}.`,
          resetTime: resetDate.toISOString(),
          resetIn: timeUntilReset,
          remaining,
          limit,
        });
      }

      // Handle other Twitter API errors
      const errorMessage = error.message;
      return res.status(500).json({
        error: errorMessage || "Failed to share to X",
        details: errorData,
      });
    }

    return res.status(500).json({
      error: "An unexpected error occurred while sharing to X",
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
