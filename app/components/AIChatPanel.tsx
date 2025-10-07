import { useState, useEffect, useRef, KeyboardEvent, Fragment } from "react";
import {
  Bot,
  Send,
  X,
  Loader2,
  Plus,
  ChevronDown,
  MessageCircle,
  Clock,
  Lightbulb,
  Share2,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useMCPClient } from "../hooks/useMCPClient";
import { useChartCommands } from "../hooks/useChartCommands";
import { useActiveChart } from "../contexts/ActiveChartContext";
import { ChatExamplePrompts } from "./ChatExamplePrompts";
import { ChatHistoryModal } from "./ChatHistoryModal";
import { ShareModal } from "./ShareModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Menu, Transition } from "@headlessui/react";
import { ToolbarButton, ToolbarDropdownButton } from "./ToolbarButton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  commands?: Array<{ id: string; command: string; status?: string }>;
}

interface ChatSession {
  id: string;
  chartId: string;
  timestamp: Date;
  firstMessage?: string;
  messageCount: number;
}

// Custom components for Markdown rendering
const MarkdownComponents = {
  // Custom styling for different Markdown elements
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl font-bold mb-3 mt-5 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-2 leading-relaxed break-words overflow-hidden" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-2 mt-2 space-y-1.5 ml-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="list-decimal list-inside mb-3 mt-3 space-y-2 ml-2"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-2 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    return !inline ? (
      <pre className="bg-gray-950 rounded p-3 overflow-x-auto mb-2 mt-2">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="bg-gray-950 px-1.5 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    );
  },
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-600 pl-4 italic my-2"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="border-b border-gray-600" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-gray-700" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-3 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3 py-2" {...props}>
      {children}
    </td>
  ),
  a: ({ children, href, ...props }: any) => (
    <a
      className="text-blue-400 hover:text-blue-300 underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  hr: ({ ...props }: any) => (
    <hr className="my-4 border-t border-gray-600 w-full" {...props} />
  ),
};

// Helper function to process text before Markdown rendering
function preprocessContent(text: string): string {
  // First handle timestamp spans
  const timestampRegex =
    /<span class="timestamp-utc" data-timestamp="(\d+)">\([^)]+\)<\/span>/g;
  let processedText = text;
  let match;

  while ((match = timestampRegex.exec(text)) !== null) {
    const timestamp = parseInt(match[1]);
    const date = new Date(timestamp);

    // Format date in user's local timezone
    const formattedDate = date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    processedText = processedText.replace(match[0], `(${formattedDate})`);
  }

  // Convert lines of dashes/equals/underscores to horizontal rules
  processedText = processedText.replace(/^[━─═_\-]{3,}$/gm, "---");

  // Convert bullet points that use • into proper Markdown lists
  // This handles lines like: "— Horizontal Support at $115893.52 • Type: Horizontal Level"
  processedText = processedText.replace(
    /^(—\s+[^\n]+)((?:\s*•\s*[^\n•]+)+)/gm,
    (match, title, bullets) => {
      // Split the bullets and format as a list
      const bulletPoints = bullets.split("•").filter((b: string) => b.trim());
      const formattedBullets = bulletPoints
        .map((point: string) => `  - ${point.trim()}`)
        .join("\n");
      return `**${title.trim()}**\n${formattedBullets}`;
    }
  );

  // Also handle standalone bullet points at the beginning of lines
  processedText = processedText.replace(/^•\s+/gm, "- ");

  // Handle inline bullet points (not at line start) by converting them to line breaks with bullets
  processedText = processedText.replace(/(\S)\s*•\s*/g, "$1\n- ");

  // Preserve line breaks by adding two spaces at the end of lines (Markdown's way)
  // This ensures multiline user input displays correctly
  processedText = processedText.replace(/\n/g, "  \n");

  return processedText;
}

export function AIChatPanel({
  onClose,
  chartApi,
  isMobileView = false,
}: {
  onClose: () => void;
  chartApi: any; // ChartApi instance
  isMobileView?: boolean;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showExamplePrompts, setShowExamplePrompts] = useState(false);
  const [showPromptsSidebar, setShowPromptsSidebar] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { activeChartId, getActiveChartApi } = useActiveChart();

  const {
    sendMessage,
    loadHistory,
    loadSessions,
    startNewSession,
    loadSession,
    sessionId: currentSessionId,
  } = useMCPClient(user?.uid, activeChartId);

  // Get the active chart's API
  const activeChart = getActiveChartApi();
  const activeChartApi = activeChart?.api || chartApi; // Fall back to passed chartApi if no active chart

  // Set up command listener for the active chart
  useChartCommands(user?.uid, activeChartApi, activeChartId);

  // Load chat history and sessions when component mounts or active chart changes
  useEffect(() => {
    if (user?.uid && activeChartId) {
      // Load current session's messages
      loadHistory().then((history) => {
        setMessages(history);
      });

      // Load recent sessions for dropdown
      setLoadingSessions(true);
      loadSessions(5).then((sessions) => {
        setRecentSessions(sessions);
        setLoadingSessions(false);
      });
    }
  }, [user?.uid, activeChartId, loadHistory, loadSessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading || !user) return;

    // Hide example prompts overlay/sidebar when sending any message
    if (showExamplePrompts) {
      setShowExamplePrompts(false);
    }
    if (showPromptsSidebar) {
      setShowPromptsSidebar(false);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Get chart context from active chart if available
    let chartContext;
    if (activeChartApi) {
      try {
        // Get values from active chart API
        const symbol = activeChartApi.getSymbol?.();
        const granularity = activeChartApi.getGranularity?.();
        const timeRange = activeChartApi.getTimeRange?.();
        const priceRange = activeChartApi.getPriceRange?.();

        // Build chart context - only include simple primitive values to avoid proxy issues
        chartContext = {
          symbol: symbol ? String(symbol) : undefined,
          granularity: granularity ? String(granularity) : undefined,
          timeRange: timeRange
            ? {
                start: Number(timeRange.start),
                end: Number(timeRange.end),
              }
            : undefined,
          priceRange: priceRange
            ? {
                min: Number(priceRange.min),
                max: Number(priceRange.max),
                range: Number(
                  priceRange.range || priceRange.max - priceRange.min
                ),
              }
            : undefined,
          candles: [],
          indicators: [],
        };

        // TODO: Fix the rs-charts API to return candles data safely (not proxy objects)
        try {
          const candles = activeChartApi.getCandles?.();
          if (candles) {
            // Serialize using structuredClone which handles proxies better
            const serializedCandles = structuredClone(
              candles.slice(-50).map((item: any) => {
                const timestamp = Array.isArray(item)
                  ? item[0]
                  : item.timestamp;
                const candle = Array.isArray(item) ? item[1] : item;
                return {
                  timestamp: Number(timestamp),
                  open: Number(candle.open),
                  high: Number(candle.high),
                  low: Number(candle.low),
                  close: Number(candle.close),
                  volume: Number(candle.volume),
                };
              })
            );
            chartContext.candles = serializedCandles;
          }
        } catch (candleError) {
          console.warn("Could not extract candles:", candleError);
          chartContext.candles = [];
        }

        // TODO: Fix the rs-charts API to return indicators data safely (not proxy objects)
        try {
          const indicators = activeChartApi.getVisibleIndicators?.();
          if (indicators) {
            chartContext.indicators = structuredClone(indicators);
          }
        } catch (indicatorError) {
          console.warn("Could not extract indicators:", indicatorError);
          chartContext.indicators = [];
        }
      } catch (error) {
        console.error("Error building chart context:", error);
      }
    }

    try {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        commands: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      await sendMessage(textToSend, {
        chartContext,
        onStream: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              // Create a new message object instead of mutating
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + chunk,
              };
            }
            return updated;
          });
        },
        onToolCall: (tool, commandId) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              // Create a new message object with updated commands
              updated[lastIndex] = {
                ...updated[lastIndex],
                commands: [
                  ...(updated[lastIndex].commands || []),
                  { id: commandId, command: tool, status: "pending" },
                ],
              };
            }
            return updated;
          });
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              // Check if this is a subscription required error
              let errorContent = `Error: ${error.message}`;

              if ((error as any).requiresSubscription) {
                errorContent =
                  "⚠️ Your preview period has expired. Please subscribe to continue using the Spotlight AI assistant.\
                  ";
              }

              // Create a new message object with error content
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: errorContent,
              };
            }
            return updated;
          });
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputRef.current && !inputValue) {
      inputRef.current.style.height = "auto";
    }
  }, [inputValue]);

  return (
    <div
      className={`h-full max-h-full flex text-white overflow-hidden ${
        isMobileView ? "bg-gray-900/10 backdrop-blur-md" : "bg-gray-900"
      }`}
    >
      {/* Left Sidebar - Example Prompts */}
      {showPromptsSidebar && messages.length > 0 && (
        <div className="w-64 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
          <ChatExamplePrompts
            onSelectPrompt={(prompt) => {
              handleSend(prompt);
              setShowPromptsSidebar(false);
            }}
            isSidebar={true}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className={`flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700 ${
            isMobileView ? "bg-gray-900/10" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            {activeChart && (
              <p className="text-xs text-gray-400">
                Active: {activeChart.symbol || "Chart"} •{" "}
                {activeChart.granularity || ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <ToolbarButton
              onClick={() => setIsShareModalOpen(true)}
              title="Share to X (Twitter)"
              variant="default"
              active={false}
              disabled={messages.length === 0 || !activeChartApi}
            >
              <Share2 className="w-3 h-3" />
            </ToolbarButton>

            {/* New Chat Button */}
            <ToolbarButton
              onClick={() => {
                // If we have messages in the current session, add it to the recent sessions
                if (messages.length > 0 && currentSessionId) {
                  const currentSession: ChatSession = {
                    id: currentSessionId,
                    chartId: activeChartId || "default",
                    timestamp: new Date(),
                    firstMessage:
                      messages.find((m) => m.role === "user")?.content ||
                      "New conversation",
                    messageCount: messages.length,
                  };

                  // Add current session to the beginning of recent sessions if it's not already there
                  setRecentSessions((prev) => {
                    const filtered = prev.filter(
                      (s) => s.id !== currentSessionId
                    );
                    return [currentSession, ...filtered].slice(0, 5);
                  });
                }

                const newId = startNewSession();
                setMessages([]);

                // Reload sessions list with a small delay to ensure Firestore is updated
                setTimeout(() => {
                  loadSessions(5).then((sessions) => {
                    setRecentSessions(sessions);
                  });
                }, 500);
              }}
              title="Start new chat"
              variant="default"
              active={true}
            >
              <Plus className="w-3 h-3" />
            </ToolbarButton>

            {/* Chat History Dropdown */}
            <Menu as="div" className="static">
              <Menu.Button as={ToolbarDropdownButton}>
                <MessageCircle className="w-3 h-3" />
                <ChevronDown className="w-3 h-3" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-4 mt-2 w-64 bg-black border border-gray-700 rounded-md shadow-lg z-[9999]">
                  <div className="py-1">
                    {loadingSessions ? (
                      <div className="px-4 py-3 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400 mx-auto"></div>
                      </div>
                    ) : recentSessions.length === 0 ? (
                      <div className="px-4 py-3 text-center text-gray-400 text-sm">
                        No previous chats
                      </div>
                    ) : (
                      <>
                        {recentSessions.map((session) => (
                          <Menu.Item key={session.id}>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  loadSession(session.id).then((history) => {
                                    setMessages(history);
                                  });
                                }}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                  active ? "bg-gray-900" : ""
                                } ${
                                  session.id === currentSessionId
                                    ? "text-blue-400"
                                    : "text-gray-300 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate">
                                      {session.firstMessage ||
                                        "New conversation"}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {new Date(
                                        session.timestamp
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {session.id === currentSessionId && (
                                    <svg
                                      className="w-3 h-3 text-blue-400 flex-shrink-0 ml-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        ))}

                        {/* Separator */}
                        <div className="h-px bg-gray-800 my-1"></div>

                        {/* Show All option */}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setIsHistoryModalOpen(true);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors text-gray-300 hover:text-white flex items-center ${
                                active ? "bg-gray-900" : ""
                              }`}
                            >
                              <MessageCircle className="w-3 h-3 mr-2" />
                              Show all...
                            </button>
                          )}
                        </Menu.Item>
                      </>
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            <ToolbarButton onClick={onClose} title="Close AI panel">
              <X className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto relative">
          {messages.length === 0 ? (
            <ChatExamplePrompts
              onSelectPrompt={(prompt) => handleSend(prompt)}
            />
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-1 ${
                      message.role === "user"
                        ? isMobileView
                          ? "bg-blue-600/80 text-gray-100"
                          : "bg-blue-600 text-gray-100"
                        : isMobileView
                        ? "bg-gray-800/70 text-gray-200"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <div className="font-light markdown-content overflow-hidden">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {preprocessContent(message.content)}
                      </ReactMarkdown>
                    </div>
                    {message.commands && message.commands.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.commands.map((cmd, cmdIndex) => (
                          <div
                            key={`${cmd.id}-${cmdIndex}`}
                            className="text-xs bg-gray-700 rounded px-2 py-1 inline-block mr-1"
                          >
                            ✓ {cmd.command.replace(/_/g, " ")}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-3 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Example Prompts Overlay */}
          {showExamplePrompts && messages.length > 0 && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={(e) => {
                // Close if clicking backdrop (not content)
                if (e.target === e.currentTarget) {
                  setShowExamplePrompts(false);
                }
              }}
            >
              <div className="relative max-w-2xl w-full mx-4">
                <ChatExamplePrompts
                  onSelectPrompt={(prompt) => {
                    handleSend(prompt);
                    setShowExamplePrompts(false);
                  }}
                  isOverlay={true}
                  onClose={() => setShowExamplePrompts(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className={`flex-shrink-0 border-t border-gray-700 p-4 ${
            isMobileView ? "bg-gray-900/40" : ""
          }`}
        >
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Auto-resize textarea
                const target = e.target;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={
                user ? "Ask about the chart... (Shift+Enter for new line)" : ""
              }
              className={`w-full text-white rounded-lg pl-4 pr-20 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px] overflow-y-auto ${
                isMobileView ? "bg-gray-800/70" : "bg-gray-800"
              }`}
              rows={2}
              style={{ height: "auto" }}
              disabled={isLoading || !user}
            />

            {/* Login overlay for unauthenticated users */}
            {!user && !isInputFocused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 pointer-events-auto">
                  Please{" "}
                  <a
                    href="/signin?redirect=/chart"
                    className="text-blue-400 hover:text-blue-300 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    sign in
                  </a>{" "}
                  to use Spotligt
                </p>
              </div>
            )}

            {/* Lightbulb button inside input field */}
            <button
              onClick={() => {
                if (messages.length > 0) {
                  setShowPromptsSidebar(!showPromptsSidebar);
                } else {
                  setShowExamplePrompts(!showExamplePrompts);
                }
              }}
              disabled={!user}
              title="Show example prompts"
              className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                showExamplePrompts || showPromptsSidebar
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-gray-400 hover:text-white"
              } disabled:text-gray-600 disabled:cursor-not-allowed`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>

            {/* Send button inside input field */}
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading || !user}
              title="Send message (Enter)"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat History Modal */}
        <ChatHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onSelectSession={(sessionId) => {
            loadSession(sessionId).then((history) => {
              setMessages(history);
              // Reload recent sessions
              loadSessions(5).then((sessions) => {
                setRecentSessions(sessions);
              });
            });
          }}
          sessions={recentSessions}
          currentSessionId={currentSessionId}
          loading={loadingSessions}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          messages={messages}
          chartApi={activeChartApi}
        />
      </div>
    </div>
  );
}
