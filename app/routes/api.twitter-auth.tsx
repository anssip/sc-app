/**
 * Twitter OAuth 1.0a Initiation Route
 * Starts the OAuth flow by getting a request token and redirecting user to Twitter
 */

import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { TwitterApi } from "twitter-api-v2";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

// In-memory storage for OAuth secrets (temporary, keyed by oauth_token)
// In production, you might want to use Redis or Firestore for distributed systems
const oauthSecrets = new Map<string, { secret: string; userId: string; timestamp: number }>();

// Clean up expired secrets (older than 10 minutes)
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [token, data] of oauthSecrets.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      oauthSecrets.delete(token);
    }
  }
}, 60 * 1000); // Run every minute

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get auth header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const auth = getAuth();

    // Verify token and get user ID
    let userId: string;
    if (process.env.NODE_ENV !== "production") {
      try {
        const decodedToken = await auth.verifyIdToken(idToken, false);
        userId = decodedToken.uid;
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
        userId = payload.user_id || payload.sub;
      }
    } else {
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    }

    // Get Twitter app credentials from environment
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const callbackUrl =
      process.env.TWITTER_CALLBACK_URL ||
      "http://localhost:5173/api/twitter-callback";

    if (!apiKey || !apiSecret) {
      return json(
        { error: "Twitter API credentials not configured on server" },
        { status: 503 }
      );
    }

    // Create Twitter client for OAuth
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
    });

    // Generate OAuth request token
    const authLink = await client.generateAuthLink(callbackUrl, {
      linkMode: "authorize",
    });

    // Store oauth_token_secret server-side, keyed by oauth_token
    oauthSecrets.set(authLink.oauth_token, {
      secret: authLink.oauth_token_secret,
      userId,
      timestamp: Date.now(),
    });

    console.log("Stored OAuth secret for token:", authLink.oauth_token);

    // Return auth URL and token (NOT the secret)
    return json({
      authUrl: authLink.url,
      oauthToken: authLink.oauth_token,
    });
  } catch (error) {
    console.error("Error initiating Twitter OAuth:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate Twitter authorization",
      },
      { status: 500 }
    );
  }
}

// Export the secrets map so callback route can access it
export { oauthSecrets };
