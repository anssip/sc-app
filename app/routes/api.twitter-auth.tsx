/**
 * Twitter OAuth 1.0a Initiation Route
 * Starts the OAuth flow by getting a request token and redirecting user to Twitter
 */

import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { TwitterApi } from "twitter-api-v2";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get auth header
    const url = new URL(request.url);
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Twitter app credentials from environment
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const callbackUrl =
      process.env.TWITTER_CALLBACK_URL ||
      "http://localhost:5173/api/twitter-callback";

    // Debug log (remove after testing)
    console.log("Twitter API Key exists:", !!apiKey);
    console.log("Twitter API Secret exists:", !!apiSecret);
    console.log("API Key (first 10 chars):", apiKey?.substring(0, 10));

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
      linkMode: "authorize", // or 'authenticate' for auto-login
    });

    // Store oauth_token_secret in session/cookie for later verification
    // For now, we'll return it to the client to store temporarily
    return json({
      authUrl: authLink.url,
      oauthToken: authLink.oauth_token,
      oauthTokenSecret: authLink.oauth_token_secret,
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
