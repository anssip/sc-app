import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useMCPClient } from '../hooks/useMCPClient';
import { useChartCommands } from '../hooks/useChartCommands';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  commands?: Array<{ id: string; command: string; status?: string }>;
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

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Get chart context if available
    let chartContext;
    if (chartApi) {
      try {
        const symbol = chartApi.getSymbol?.();
        const granularity = chartApi.getGranularity?.();
        const timeRange = chartApi.getTimeRange?.();
        const priceRange = chartApi.getPriceRange?.();
        
        console.log('Chart API values:', {
          symbol,
          symbolType: typeof symbol,
          granularity,
          granularityType: typeof granularity,
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
          
          console.log('Chart context prepared:', chartContext);
        } else {
          console.warn('Missing chart context values:', {
            hasSymbol: !!symbol,
            hasGranularity: !!granularity,
            hasTimeRange: !!timeRange,
            hasPriceRange: !!priceRange
          });
        }
      } catch (error) {
        console.warn('Could not get chart context:', error);
      }
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

      await sendMessage(inputValue, {
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me about the chart!</p>
            <p className="text-sm mt-2">
              Try: "Show BTC hourly chart with RSI"
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
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
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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