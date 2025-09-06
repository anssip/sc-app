#!/bin/bash

echo "Testing MCP Server Workflow with curl..."
echo

# Test workflow-based trend line command
echo "Testing trend line command (should use Workflow and generate add_trend_line)..."
echo

curl -X POST http://127.0.0.1:5001/spotcanvas-prod/us-central1/mcpServer/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Draw a resistance trend line through the highest points",
    "userId": "test-user-workflow",
    "sessionId": "test-session-curl",
    "chartContext": {
      "symbol": "BTC-USD",
      "granularity": "ONE_HOUR",
      "timeRange": {
        "start": 1700000000000,
        "end": 1700604800000
      },
      "priceRange": {
        "min": 40000,
        "max": 50000
      }
    }
  }' \
  --no-buffer 2>/dev/null | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # Extract JSON from SSE data
      json="${line#data: }"
      if [[ -n "$json" && "$json" != " " ]]; then
        # Parse and display the JSON
        echo "$json" | jq -r 'if .type == "content" then .content elif .type == "tool_call" then "📌 Tool Call: \(.tool) (ID: \(.commandId))" elif .type == "done" then "✅ Complete" else . end' 2>/dev/null || echo "$json"
      fi
    fi
  done

echo
echo "Check Firestore at http://127.0.0.1:4000/firestore"
echo "Look for: users/test-user-workflow/chart_commands"
echo
echo "The command should be 'add_trend_line' with proper start/end structure"
