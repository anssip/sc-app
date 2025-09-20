import { useState, useCallback, useRef } from "react";

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

interface ChatSession {
  id: string;
  chartId: string;
  timestamp: Date;
  firstMessage?: string;
  messageCount: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  commands?: Array<{ id: string; command: string; status?: string }>;
}

export function useMCPClient(userId?: string, chartId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `session_${chartId || "default"}_${Date.now()}`
  );
  const sessionsCache = useRef<Map<string, ChatSession[]>>(new Map());

  const sendMessage = useCallback(
    async (message: string, options: MCPClientOptions = {}) => {
      if (!userId) {
        options.onError?.(new Error("User not authenticated"));
        return;
      }

      try {
        // Get the function URL - use environment variable for dev/prod
        const functionUrl = import.meta.env.VITE_MCP_SERVER_URL
          ? `${import.meta.env.VITE_MCP_SERVER_URL}/chat`
          : "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer/chat";

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "omit", // Don't send credentials for CORS
          mode: "cors",
          body: JSON.stringify({
            message,
            userId,
            sessionId: currentSessionId,
            chartId: chartId || "default",
            chartContext: options.chartContext,
          }),
        });

        if (!response.ok) {
          // Try to parse error response for more details
          let errorMessage = `HTTP error! status: ${response.status}`;
          let requiresSubscription = false;

          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
              requiresSubscription = errorData.requiresSubscription || false;
            }
          } catch (parseError) {
            // If parsing fails, use the default error message
          }

          const error = new Error(errorMessage);
          (error as any).requiresSubscription = requiresSubscription;
          throw error;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const event = JSON.parse(data);

                  switch (event.type) {
                    case "content":
                      options.onStream?.(event.content);
                      break;
                    case "tool_call":
                      options.onToolCall?.(event.tool, event.commandId);
                      break;
                    case "error":
                      options.onError?.(new Error(event.error));
                      break;
                    case "done":
                      // Stream complete
                      break;
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (error) {
        options.onError?.(error as Error);
      }
    },
    [userId, currentSessionId, chartId]
  );

  const loadHistory = useCallback(
    async (sessionId?: string): Promise<Message[]> => {
      if (!userId) return [];

      try {
        const baseUrl =
          import.meta.env.VITE_MCP_SERVER_URL ||
          "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer";
        const sessionToLoad = sessionId || currentSessionId;
        const functionUrl = `${baseUrl}/chat/history/${userId}?sessionId=${sessionToLoad}&chartId=${
          chartId || "default"
        }`;

        const response = await fetch(functionUrl, {
          credentials: "omit",
          mode: "cors",
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
          commands: msg.commands,
        }));
      } catch (error) {
        return [];
      }
    },
    [userId, currentSessionId, chartId]
  );

  const loadSessions = useCallback(
    async (limit?: number): Promise<ChatSession[]> => {
      if (!userId || !chartId) return [];

      // Check cache first
      const cacheKey = `${userId}_${chartId}`;
      if (sessionsCache.current.has(cacheKey)) {
        const cached = sessionsCache.current.get(cacheKey)!;
        return limit ? cached.slice(0, limit) : cached;
      }

      try {
        const baseUrl =
          import.meta.env.VITE_MCP_SERVER_URL ||
          "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer";
        const functionUrl = `${baseUrl}/chat/sessions/${userId}?chartId=${chartId}${
          limit ? `&limit=${limit}` : ""
        }`;

        const response = await fetch(functionUrl, {
          credentials: "omit",
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sessions = data.sessions.map((session: any) => ({
          id: session.id,
          chartId: session.chartId,
          timestamp: new Date(session.timestamp),
          firstMessage: session.firstMessage,
          messageCount: session.messageCount,
        }));

        // Cache the result
        sessionsCache.current.set(cacheKey, sessions);

        return sessions;
      } catch (error) {
        return [];
      }
    },
    [userId, chartId]
  );

  const clearHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const baseUrl =
        import.meta.env.VITE_MCP_SERVER_URL ||
        "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer";
      const functionUrl = `${baseUrl}/chat/history/${userId}`;

      const response = await fetch(functionUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "omit",
        mode: "cors",
        body: JSON.stringify({
          sessionId: currentSessionId,
          chartId: chartId || "default",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clear cache for this chart
      if (chartId) {
        const cacheKey = `${userId}_${chartId}`;
        sessionsCache.current.delete(cacheKey);
      }
    } catch (error) {}
  }, [userId, currentSessionId, chartId]);

  const startNewSession = useCallback(() => {
    const newSessionId = `session_${chartId || "default"}_${Date.now()}`;
    setCurrentSessionId(newSessionId);

    // Clear cache to force reload
    if (userId && chartId) {
      const cacheKey = `${userId}_${chartId}`;
      sessionsCache.current.delete(cacheKey);
    }

    return newSessionId;
  }, [chartId, userId]);

  const loadSession = useCallback(
    async (sessionId: string): Promise<Message[]> => {
      setCurrentSessionId(sessionId);
      return loadHistory(sessionId);
    },
    [loadHistory]
  );

  return {
    isConnected,
    sendMessage,
    loadHistory,
    loadSessions,
    clearHistory,
    startNewSession,
    loadSession,
    sessionId: currentSessionId,
  };
}
