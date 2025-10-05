/**
 * Twitter OAuth 1.0a Callback Route
 * Redirects to settings page with OAuth params for client-side handling
 */

import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

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

    // Redirect to settings with OAuth params for client-side completion
    return redirect(
      `/settings?oauth_callback=true&oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`
    );
  } catch (error) {
    console.error("Error in Twitter OAuth callback:", error);
    return redirect(
      `/settings?error=${encodeURIComponent(
        error instanceof Error ? error.message : "OAuth failed"
      )}`
    );
  }
}
