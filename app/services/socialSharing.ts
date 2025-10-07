/**
 * Social sharing service for posting to X (Twitter)
 * Communicates with server-side API route for X integration
 */

import { splitMessages, isValidTweetLength } from "../utils/textSplitter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ShareToXOptions {
  screenshot: Blob;
  mainTweetText: string;
  selectedMessages: Message[];
}

interface ShareResult {
  success: boolean;
  tweetUrl?: string;
  error?: string;
}

/**
 * Convert Blob to base64 string for sending to server
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Main function to share chart analysis to X
 * Sends request to server-side API route
 */
export async function shareToX(options: ShareToXOptions): Promise<ShareResult> {
  const { screenshot, mainTweetText, selectedMessages } = options;

  try {
    // Step 1: Validate inputs
    if (!mainTweetText || mainTweetText.trim().length === 0) {
      return {
        success: false,
        error: "Main tweet text is required",
      };
    }

    if (!isValidTweetLength(mainTweetText)) {
      return {
        success: false,
        error: `Main tweet text is too long (${mainTweetText.length} characters). Maximum is 280 characters.`,
      };
    }

    // Step 2: Convert screenshot to base64
    const screenshotBase64 = await blobToBase64(screenshot);

    // Step 3: Prepare request payload
    const payload = {
      screenshot: screenshotBase64,
      mainTweetText: mainTweetText.trim(),
      selectedMessages: selectedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Step 4: Get user's auth token
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to share to X",
      };
    }

    const idToken = await user.getIdToken();

    // Step 5: Send request to Cloud Function directly (bypasses Firebase Hosting)
    const shareToXUrl =
      import.meta.env.VITE_SHARE_TO_X_URL ||
      "http://localhost:5001/spotcanvas-prod/us-central1/shareToX";

    const response = await fetch(shareToXUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 500));
      return {
        success: false,
        error: `Server returned non-JSON response (${response.status}). Check server logs for details.`,
      };
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`,
      };
    }

    return {
      success: result.success,
      tweetUrl: result.tweetUrl,
    };
  } catch (error) {
    console.error("Error sharing to X:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Validate Twitter API credentials are configured
 * Note: This checks client-side env vars, but the actual API calls happen server-side
 */
export function isTwitterConfigured(): boolean {
  // Since the API is now server-side, we can't directly check credentials from client
  // Instead, we'll always return true and let the server return an error if not configured
  // Alternatively, you could add a health check endpoint
  return true;
}

/**
 * Get character count for preview (accounting for URLs)
 */
export function getCharacterCount(text: string): number {
  // Twitter counts URLs as 23 characters
  const urlRegex = /https?:\/\/[^\s]+/g;
  let count = text.length;

  const urls = text.match(urlRegex);
  if (urls) {
    for (const url of urls) {
      count = count - url.length + 23;
    }
  }

  return count;
}

// Re-export utilities from textSplitter
export { splitMessages, isValidTweetLength };
