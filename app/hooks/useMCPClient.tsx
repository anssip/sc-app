import { useState, useCallback } from 'react';

interface ChartContext {
  symbol: string;
  granularity: string;
  timeRange: {
    start: number;
    end: number;
  };
  priceRange: {
    min: number;
    max: number;
    range: number;
  };
}

interface MCPClientOptions {
  onStream?: (chunk: string) => void;
  onToolCall?: (tool: string, commandId: string) => void;
  onError?: (error: Error) => void;
  chartContext?: ChartContext;
}

export function useMCPClient(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const sendMessage = useCallback(async (
    message: string,
    options: MCPClientOptions = {}
  ) => {
    if (!userId) {
      options.onError?.(new Error('User not authenticated'));
      return;
    }

    try {
      // Get the function URL - use environment variable for dev/prod
      const functionUrl = import.meta.env.VITE_MCP_SERVER_URL 
        ? `${import.meta.env.VITE_MCP_SERVER_URL}/chat`
        : 'https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer/chat';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit', // Don't send credentials for CORS
        mode: 'cors',
        body: JSON.stringify({
          message,
          userId,
          sessionId,
          chartContext: options.chartContext
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const event = JSON.parse(data);
                
                switch (event.type) {
                  case 'content':
                    options.onStream?.(event.content);
                    break;
                  case 'tool_call':
                    options.onToolCall?.(event.tool, event.commandId);
                    break;
                  case 'error':
                    options.onError?.(new Error(event.error));
                    break;
                  case 'done':
                    // Stream complete
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      options.onError?.(error as Error);
    }
  }, [userId, sessionId]);

  const loadHistory = useCallback(async () => {
    if (!userId) return [];

    try {
      const baseUrl = import.meta.env.VITE_MCP_SERVER_URL 
        || 'https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer';
      const functionUrl = `${baseUrl}/chat/history/${userId}?sessionId=${sessionId}`;

      const response = await fetch(functionUrl, {
        credentials: 'omit',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        commands: msg.commands
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }, [userId, sessionId]);

  const clearHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const baseUrl = import.meta.env.VITE_MCP_SERVER_URL 
        || 'https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer';
      const functionUrl = `${baseUrl}/chat/history/${userId}`;

      const response = await fetch(functionUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        mode: 'cors',
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [userId, sessionId]);

  return {
    isConnected,
    sendMessage,
    loadHistory,
    clearHistory,
    sessionId
  };
}