/**
 * Twitter OAuth 1.0a Callback Route
 * Completes the OAuth flow server-side and stores credentials in Firestore
 */

import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { TwitterApi } from "twitter-api-v2";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { oauthSecrets } from "./api.twitter-auth";

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  username: string;
  userId: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);

    // Get OAuth parameters from Twitter callback
    const oauthToken = url.searchParams.get("oauth_token");
    const oauthVerifier = url.searchParams.get("oauth_verifier");

    if (!oauthToken || !oauthVerifier) {
      console.error("Missing oauth_token or oauth_verifier from Twitter");
      return redirect("/settings?error=missing_oauth_params");
    }

    // Retrieve the stored secret and user ID
    const stored = oauthSecrets.get(oauthToken);
    if (!stored) {
      console.error("OAuth secret not found for token:", oauthToken);
      return redirect("/settings?error=oauth_session_expired");
    }

    const { secret: oauthTokenSecret, userId } = stored;

    // Clean up the stored secret
    oauthSecrets.delete(oauthToken);

    console.log("Retrieved OAuth secret for token:", oauthToken);

    // Get Twitter app credentials from environment
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Twitter API credentials not configured");
      return redirect("/settings?error=server_config_error");
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

    console.log("Successfully exchanged OAuth tokens");

    // Get user info from Twitter
    const me = await loggedClient.v2.me();

    console.log("Retrieved Twitter user info:", me.data.username);

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

    console.log("Saved Twitter credentials to Firestore for user:", userId);

    // Redirect to settings with success message
    return redirect("/settings?twitter_connected=true");
  } catch (error) {
    console.error("Error in Twitter OAuth callback:", error);
    const errorMessage = error instanceof Error ? error.message : "OAuth failed";
    return redirect(
      `/settings?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
