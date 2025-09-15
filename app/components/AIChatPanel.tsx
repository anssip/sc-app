import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useMCPClient } from '../hooks/useMCPClient';
import { useChartCommands } from '../hooks/useChartCommands';
import { ChatExamplePrompts } from './ChatExamplePrompts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  commands?: Array<{ id: string; command: string; status?: string }>;
}

// Custom components for Markdown rendering
const MarkdownComponents = {
  // Custom styling for different Markdown elements
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl font-bold mb-3 mt-5 first:mt-0" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-2 leading-relaxed break-all overflow-hidden" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-2 mt-2 space-y-1.5 ml-2" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-3 mt-3 space-y-2 ml-2" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-2 leading-relaxed" {...props}>{children}</li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
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
    <blockquote className="border-l-4 border-gray-600 pl-4 italic my-2" {...props}>
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
    <thead className="border-b border-gray-600" {...props}>{children}</thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-gray-700" {...props}>{children}</tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-3 py-2 text-left font-semibold" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3 py-2" {...props}>{children}</td>
  ),
  a: ({ children, href, ...props }: any) => (
    <a className="text-blue-400 hover:text-blue-300 underline" href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>{children}</em>
  ),
  hr: ({ ...props }: any) => (
    <hr className="my-4 border-t border-gray-600 w-full" {...props} />
  ),
};

// Helper function to process text before Markdown rendering
function preprocessContent(text: string): string {
  // First handle timestamp spans
  const timestampRegex = /<span class="timestamp-utc" data-timestamp="(\d+)">\([^)]+\)<\/span>/g;
  let processedText = text;
  let match;

  while ((match = timestampRegex.exec(text)) !== null) {
    const timestamp = parseInt(match[1]);
    const date = new Date(timestamp);

    // Format date in user's local timezone
    const formattedDate = date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    processedText = processedText.replace(match[0], `(${formattedDate})`);
  }

  // Convert lines of dashes/equals/underscores to horizontal rules
  processedText = processedText.replace(/^[━─═_\-]{3,}$/gm, '---');

  // Convert bullet points that use • into proper Markdown lists
  // This handles lines like: "— Horizontal Support at $115893.52 • Type: Horizontal Level"
  processedText = processedText.replace(/^(—\s+[^\n]+)((?:\s*•\s*[^\n•]+)+)/gm, (match, title, bullets) => {
    // Split the bullets and format as a list
    const bulletPoints = bullets.split('•').filter((b: string) => b.trim());
    const formattedBullets = bulletPoints.map((point: string) => `  - ${point.trim()}`).join('\n');
    return `**${title.trim()}**\n${formattedBullets}`;
  });

  // Also handle standalone bullet points at the beginning of lines
  processedText = processedText.replace(/^•\s+/gm, '- ');

  // Handle inline bullet points (not at line start) by converting them to line breaks with bullets
  processedText = processedText.replace(/(\S)\s*•\s*/g, '$1\n- ');

  return processedText;
}

export function AIChatPanel({ 
  onClose,
  chartApi 
}: { 
  onClose: () => void;
  chartApi: any; // ChartApi instance
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { sendMessage, loadHistory } = useMCPClient(user?.uid);
  
  // Set up command listener
  useChartCommands(user?.uid, chartApi);

  // Load chat history on mount
  useEffect(() => {
    if (user?.uid) {
      loadHistory().then(history => {
        setMessages(history);
      });
    }
  }, [user?.uid, loadHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Get chart context if available
    let chartContext;
    if (chartApi) {
      try {
        console.log('[AIChatPanel] Getting chart context from state');
        
        // Get values from chart API (which now reads from state)
        const symbol = chartApi.getSymbol?.();
        const granularity = chartApi.getGranularity?.();
        const timeRange = chartApi.getTimeRange?.();
        const priceRange = chartApi.getPriceRange?.();
        
        console.log('[AIChatPanel] Chart values from state:', {
          symbol,
          granularity,
          timeRange,
          priceRange
        });
        
        if (symbol && granularity && timeRange && priceRange) {
          // Extract raw values from potential proxy objects
          // Use JSON parse/stringify to break proxy references
          chartContext = JSON.parse(JSON.stringify({
            symbol: String(symbol),
            granularity: String(granularity),
            timeRange: {
              start: Number(timeRange.start),
              end: Number(timeRange.end)
            },
            priceRange: {
              min: Number(priceRange.min),
              max: Number(priceRange.max),
              range: Number(priceRange.range || (priceRange.max - priceRange.min))
            }
          }));
          
          console.log('[AIChatPanel] Chart context prepared:', chartContext);
        } else {
          console.warn('[AIChatPanel] Missing chart context values:', {
            hasSymbol: !!symbol,
            hasGranularity: !!granularity,
            hasTimeRange: !!timeRange,
            hasPriceRange: !!priceRange
          });
          
          // Log the actual values for debugging
          if (!timeRange) console.warn('[AIChatPanel] timeRange is null/undefined');
          if (!priceRange) console.warn('[AIChatPanel] priceRange is null/undefined');
        }
      } catch (error) {
        console.warn('[AIChatPanel] Error getting chart context:', error);
      }
    } else {
      console.warn('[AIChatPanel] No chartApi provided');
    }

    try {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        commands: []
      };

      setMessages(prev => [...prev, assistantMessage]);

      await sendMessage(textToSend, {
        chartContext,
        onStream: (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              // Create a new message object instead of mutating
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + chunk
              };
            }
            return updated;
          });
        },
        onToolCall: (tool, commandId) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              // Create a new message object with updated commands
              updated[lastIndex] = {
                ...updated[lastIndex],
                commands: [
                  ...(updated[lastIndex].commands || []),
                  { id: commandId, command: tool, status: 'pending' }
                ]
              };
            }
            return updated;
          });
        },
        onError: (error) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              // Create a new message object with error content
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: `Error: ${error.message}`
              };
            }
            return updated;
          });
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full max-h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Close AI panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {messages.length === 0 ? (
          <ChatExamplePrompts onSelectPrompt={(prompt) => handleSend(prompt)} />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-gray-100'
                      : 'bg-gray-800 text-gray-200'
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
                          ✓ {cmd.command.replace(/_/g, ' ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the chart..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[80px] overflow-y-auto"
            rows={1}
            disabled={isLoading || !user}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || !user}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {!user && (
          <p className="text-xs text-gray-400 mt-2">
            Please sign in to use the AI assistant
          </p>
        )}
      </div>
    </div>
  );
}