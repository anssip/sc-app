#!/usr/bin/env node

// Test script for MCP server with workflow system
const testMCPWorkflow = async () => {
  const MCP_URL = "http://127.0.0.1:5001/spotcanvas-prod/us-central1/mcpServer";

  console.log("Testing MCP Server with Workflow System...\n");

  // Test 1: Health check
  console.log("1. Testing health endpoint...");
  try {
    const healthResponse = await fetch(`${MCP_URL}/health`);
    const health = await healthResponse.json();
    console.log("✓ Health check:", health);
  } catch (error) {
    console.error("✗ Health check failed:", error.message);
    return;
  }

  // Test 2: Simple chart command (should use LLM)
  console.log("\n2. Testing simple chart command (LLM route)...");
  const simpleRequest = {
    message: "Change the chart to ETH-USD",
    userId: "test-user-workflow",
    sessionId: "test-session-1",
    chartContext: {
      symbol: "BTC-USD",
      granularity: "ONE_HOUR",
      timeRange: { start: Date.now() - 86400000, end: Date.now() },
      priceRange: { min: 40000, max: 50000 },
    },
  };

  try {
    const response = await fetch(`${MCP_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(simpleRequest),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    console.log("Response (streaming):");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "content") {
              process.stdout.write(data.content);
            } else if (data.type === "tool_call") {
              console.log(`\n[Tool Call: ${data.tool}]`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    console.log("\n✓ Simple command test completed");
  } catch (error) {
    console.error("✗ Simple command failed:", error.message);
  }

  // Test 3: Trend line command (should use Workflow)
  console.log("\n3. Testing trend line command (Workflow route)...");
  const workflowRequest = {
    message: "Draw a resistance trend line through the highest points",
    userId: "test-user-workflow",
    sessionId: "test-session-2",
    chartContext: {
      symbol: "BTC-USD",
      granularity: "ONE_HOUR",
      timeRange: {
        start: Date.now() - 7 * 86400000, // 7 days ago
        end: Date.now(),
      },
      priceRange: { min: 40000, max: 50000 },
    },
  };

  try {
    const response = await fetch(`${MCP_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowRequest),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    console.log("Response (streaming):");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "content") {
              process.stdout.write(data.content);
            } else if (data.type === "tool_call") {
              console.log(
                `\n[Tool Call: ${data.tool} - Command ID: ${data.commandId}]`
              );
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    console.log("\n✓ Workflow command test completed");
  } catch (error) {
    console.error("✗ Workflow command failed:", error.message);
  }

  // Test 4: Check Firestore for commands
  console.log("\n4. Checking Firestore for written commands...");
  console.log("Commands should be written to:");
  console.log("  - users/test-user-workflow/chart_commands");
  console.log(
    "Check the Firebase Emulator UI at http://127.0.0.1:4000/firestore"
  );

  console.log("\n✅ All tests completed!");
};

// Run the test
testMCPWorkflow().catch(console.error);
