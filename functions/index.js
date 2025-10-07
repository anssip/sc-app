import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { createRequestHandler } from "@remix-run/express";
import * as build from "./build/server/index.js";

const app = express();

// Trust proxy since we're behind Firebase's proxy
app.set("trust proxy", true);

// Serve static assets from build/client
app.use(express.static("build/client", { maxAge: "1h" }));

// Handle all other routes with Remix
app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV || "production",
    getLoadContext: () => ({
      // Add any context you need in your loaders/actions
    }),
  })
);

// Export as Firebase Function
export const remix = onRequest(
  {
    // Increase memory and timeout for SSR
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 100,
    region: "us-central1", // Change this to your preferred region
    // Allow unauthenticated access
    invoker: "public",
    // Declare secrets needed by Remix backend routes
    secrets: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_CALLBACK_URL"],
  },
  app
);

// Export MCP server from TypeScript build
export { mcpServer } from "./dist/mcp-server.js";

// Export share-to-X function from TypeScript build
export { shareToX } from "./dist/share-to-x.js";

// Export scheduled functions for usage billing
export { processUsageBilling, triggerUsageBilling } from "./dist/scheduled-usage-billing.js";

// Export Customer.io sync functions
export { syncUserToCustomerIO, syncSubscriptionToCustomerIO } from "./dist/customerio-sync.js";
