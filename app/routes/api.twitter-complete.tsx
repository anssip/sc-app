/**
 * Server-side endpoint to complete Twitter OAuth
 * Exchanges oauth_token + oauth_verifier for access tokens
 */

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { TwitterApi } from "twitter-api-v2";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// In development, connect to Firestore emulator BEFORE initialization
if (process.env.NODE_ENV !== "production") {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8090";
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

  // Set project ID if not already set (required for Firebase Admin)
  if (!process.env.GOOGLE_CLOUD_PROJECT && !process.env.GCLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = "demo-project";
  }

  console.log("Firebase Admin using Firestore emulator at:", firestoreHost);
  console.log(
    "Firebase Admin using project ID:",
    process.env.GOOGLE_CLOUD_PROJECT
  );
}

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      "demo-project",
  });
}

interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  username: string;
  userId: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const auth = getAuth();

    // Verify token
    let verifiedUserId: string;
    if (process.env.NODE_ENV !== "production") {
      try {
        const decodedToken = await auth.verifyIdToken(idToken, false);
        verifiedUserId = decodedToken.uid;
      } catch (error) {
        // Fallback for dev
        const base64Url = idToken.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        verifiedUserId = payload.user_id || payload.sub;
      }
    } else {
      const decodedToken = await auth.verifyIdToken(idToken);
      verifiedUserId = decodedToken.uid;
    }

    // Get request body
    const body = await request.json();
    const { oauthToken, oauthVerifier, oauthTokenSecret, userId } = body;

    // Verify user ID matches
    if (verifiedUserId !== userId) {
      return json({ error: "User ID mismatch" }, { status: 403 });
    }

    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
      return json({ error: "Missing OAuth parameters" }, { status: 400 });
    }

    // Get Twitter app credentials from environment
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;

    if (!apiKey || !apiSecret) {
      return json(
        { error: "Twitter API credentials not configured on server" },
        { status: 503 }
      );
    }

    // Create temporary client with request token
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });

    // Exchange for access tokens
    const {
      client: loggedClient,
      accessToken,
      accessSecret,
    } = await client.login(oauthVerifier);

    // Get user info from Twitter
    const me = await loggedClient.v2.me();

    // Save credentials to Firestore
    const credentials: TwitterCredentials = {
      accessToken,
      accessSecret,
      username: me.data.username,
      userId: me.data.id,
    };

    const db = getFirestore();
    await db.collection("users").doc(userId).set(
      {
        twitterCredentials: credentials,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return json({ success: true });
  } catch (error) {
    console.error("Error completing Twitter OAuth:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete OAuth",
      },
      { status: 500 }
    );
  }
}
