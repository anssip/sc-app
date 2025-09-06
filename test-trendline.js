// Test script for TrendLineWorkflow debugging
import fetch from "node-fetch";

async function testTrendLine() {
  const url =
    "http://127.0.0.1:5001/spotcanvas-prod/us-central1/mcpServer/chat";

  const payload = {
    message:
      "Add a resistance trend line based on price action in the past 24 hours using one hour candles",
    userId: "test-user",
    sessionId: "test-session",
    chartContext: {
      symbol: "BTC-USD",
      granularity: "ONE_HOUR",
      timeRange: {
        start: Date.now() - 7 * 24 * 60 * 60 * 1000,
        end: Date.now(),
      },
    },
  };

  console.log("Testing with message:", payload.message);
  console.log("Current date:", new Date().toISOString());

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // node-fetch doesn't support getReader(), so we'll just get the text
    const responseText = await response.text();
    console.log("Response:", responseText);

    console.log("\n\nTest completed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

testTrendLine();
