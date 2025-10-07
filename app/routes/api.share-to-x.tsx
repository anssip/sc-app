/**
 * Server-side API route for sharing to X (Twitter)
 * This handles the X API integration on the server to avoid exposing credentials
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
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

  // In development, connect to Firestore emulator
  if (process.env.NODE_ENV !== "production") {
    const firestoreHost =
      process.env.FIRESTORE_EMULATOR_HOST || "localhost:8090";
    process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
    console.log("Firebase Admin using Firestore emulator at:", firestoreHost);
  }
}

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

  // In development with emulator, token verification might fail
  // So we decode the token instead
  if (process.env.NODE_ENV !== "production") {
    try {
      const decodedToken = await auth.verifyIdToken(idToken, false);
      return decodedToken.uid;
    } catch (error) {
      // Fallback: decode JWT without verification (dev only)
      console.warn(
        "Token verification failed in dev, decoding without verification"
      );
      const base64Url = idToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload.user_id || payload.sub;
    }
  }

  // Production: verify token properly
  const decodedToken = await auth.verifyIdToken(idToken);
  return decodedToken.uid;
}

/**
 * Split messages into tweet-sized chunks
 */
function splitMessages(
  messages: Array<{ role: string; content: string }>,
  maxLength: number = 280
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const message of messages) {
    const messageText = `${message.role === "user" ? "👤" : "🤖"} ${
      message.content
    }`;
    const separator = currentChunk ? "\n\n---\n\n" : "";
    const combined = currentChunk + separator + messageText;

    if (combined.length <= maxLength) {
      currentChunk = combined;
    } else {
      // Current chunk is full, save it and start new chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single message is too long, split it
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

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Clone the request to avoid body consumption issues with Firebase Hosting proxy
    const clonedRequest = request.clone();

    // Get and verify authorization token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const userId = await verifyAuthToken(idToken);

    // Get user's Twitter credentials
    const credentials = await getUserTwitterCredentials(userId);
    if (!credentials) {
      return json(
        {
          error:
            "Twitter API credentials not configured. Please add your credentials in Settings.",
        },
        { status: 400 }
      );
    }

    // Validate credentials are complete
    if (!credentials.accessToken || !credentials.accessSecret) {
      return json(
        {
          error:
            "Incomplete Twitter API credentials. Please reconnect your X account in Settings.",
        },
        { status: 400 }
      );
    }

    // Debug log credentials (first 10 chars only)
    console.log("Twitter credentials loaded:");
    console.log(
      "- Access Token (first 10):",
      credentials.accessToken.substring(0, 10)
    );
    console.log(
      "- Access Secret (first 10):",
      credentials.accessSecret.substring(0, 10)
    );
    console.log("- Username:", credentials.username);
    console.log("- User ID:", credentials.userId);

    // Parse request body with error handling (use cloned request)
    let data: ShareRequest;
    try {
      const text = await clonedRequest.text();
      console.log("Request body length:", text.length);

      if (!text || text.trim() === "") {
        return json({ error: "Empty request body" }, { status: 400 });
      }

      data = JSON.parse(text);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return json(
        {
          error: "Invalid JSON in request body",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    const { screenshot, mainTweetText, selectedMessages } = data;

    // Validate inputs
    if (!mainTweetText || mainTweetText.trim().length === 0) {
      return json({ error: "Main tweet text is required" }, { status: 400 });
    }

    if (mainTweetText.length > 280) {
      return json(
        { error: `Tweet text too long (${mainTweetText.length} characters)` },
        { status: 400 }
      );
    }

    if (!screenshot) {
      return json({ error: "Screenshot is required" }, { status: 400 });
    }

    // Get Twitter client with user's credentials
    const client = getTwitterClient(credentials);

    // Convert base64 screenshot to buffer
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Upload media
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: "image/png",
    });

    // Post main tweet with image
    const mainTweet = await client.v2.tweet({
      text: mainTweetText,
      media: { media_ids: [mediaId] },
    });

    // Get username for URL
    const me = await client.v2.me();
    const tweetUrl = `https://twitter.com/${me.data.username}/status/${mainTweet.data.id}`;

    // Post selected messages as replies
    if (selectedMessages && selectedMessages.length > 0) {
      const messageChunks = splitMessages(selectedMessages, 280);
      let previousTweetId = mainTweet.data.id;

      for (let i = 0; i < messageChunks.length; i++) {
        const chunk = messageChunks[i];

        // Add thread indicator if multiple chunks
        const threadText =
          messageChunks.length > 1
            ? `(${i + 1}/${messageChunks.length})\n\n${chunk}`
            : chunk;

        // Retry logic for network errors
        let retries = 3;
        let reply;

        while (retries > 0) {
          try {
            reply = await client.v2.tweet({
              text: threadText,
              reply: { in_reply_to_tweet_id: previousTweetId },
            });
            break; // Success, exit retry loop
          } catch (error) {
            retries--;
            console.log(`Error posting reply ${i + 1}:`, error);
            console.log(
              `Retry posting reply ${i + 1}, attempts left: ${retries}`
            );

            if (retries === 0) {
              // All retries failed - return partial success
              console.error(
                `Failed to post all replies. Posted ${i} of ${messageChunks.length} replies.`
              );
              return json({
                success: true,
                tweetUrl,
                warning: `Main tweet posted successfully, but only ${i} of ${messageChunks.length} reply tweets could be posted due to network issues.`,
              });
            }

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
          }
        }

        previousTweetId = reply!.data.id;

        // Longer delay between posts to avoid rate limiting and network issues
        if (i < messageChunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    return json({
      success: true,
      tweetUrl,
    });
  } catch (error) {
    console.error("Error sharing to X:", error);

    // Log more details for debugging
    if (error && typeof error === "object") {
      console.error("Error type:", (error as any).type);
      console.error("Error code:", (error as any).code);
      console.error("Error data:", (error as any).data);
    }

    let errorMessage = "Failed to share to X";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if ((error as any).type === "request") {
        errorMessage = "Network error connecting to X API. Please try again.";
      }
    }

    return json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
