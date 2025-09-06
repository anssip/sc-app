#!/usr/bin/env node

/**
 * Test script to verify mcpServer with Firestore emulator integration
 */

const testMcpServerEmulator = async () => {
  console.log('Testing mcpServer with Firestore emulator...\n');

  // Test 1: Check if mcpServer is running
  console.log('1. Testing mcpServer health endpoint...');
  try {
    const healthResponse = await fetch('http://127.0.0.1:5001/spotcanvas-prod/us-central1/mcpServer/health');
    const health = await healthResponse.json();
    console.log('✅ mcpServer is running:', health);
    console.log('   - Emulator mode:', health.emulator);
    console.log('   - Firestore emulator:', health.firestoreEmulator);
  } catch (error) {
    console.error('❌ Failed to connect to mcpServer:', error.message);
    return;
  }

  // Test 2: Send a chat message that should trigger a chart command
  console.log('\n2. Sending test chat message to change chart symbol...');
  try {
    const response = await fetch('http://127.0.0.1:5001/spotcanvas-prod/us-central1/mcpServer/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Change the chart to show ETH/USD',
        userId: 'test-user-123',
        sessionId: 'test-session'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('📝 Response from mcpServer:');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const event = JSON.parse(data);
              
              switch (event.type) {
                case 'content':
                  console.log('   Content:', event.content);
                  break;
                case 'tool_call':
                  console.log('   🛠️  Tool called:', event.tool, 'Command ID:', event.commandId);
                  break;
                case 'error':
                  console.error('   ❌ Error:', event.error);
                  break;
                case 'done':
                  console.log('   ✅ Stream complete');
                  break;
              }
            } catch (e) {
              console.error('   Failed to parse event:', e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to send chat message:', error.message);
    return;
  }

  console.log('\n3. Instructions to verify in browser:');
  console.log('   1. Open http://localhost:5173 in your browser');
  console.log('   2. Open browser DevTools Console (F12)');
  console.log('   3. You should see: "Connected to Firestore emulator on localhost:8090"');
  console.log('   4. Navigate to a chart page');
  console.log('   5. The chart should receive and execute commands from the AI chat');
  console.log('\n4. Check Firestore emulator UI:');
  console.log('   - Open http://127.0.0.1:4000/firestore');
  console.log('   - Look for users/test-user-123/chart_commands collection');
  console.log('   - You should see command documents with status: pending -> executed');
};

testMcpServerEmulator().catch(console.error);