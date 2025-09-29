import { useState, useEffect } from "react";
import {
  Bot,
  X,
  LineChart,
  Activity,
  Clock,
  Coins,
  ChevronDown,
  HelpCircle,
  TrendingUp,
  Search,
  GitBranch,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { LoginModal } from "./LoginModal";

type PromptCategory =
  | "Indicators"
  | "Granularity"
  | "Symbols"
  | "TrendLines"
  | "PatternDetection"
  | "Divergence";

interface ExamplePrompt {
  category: PromptCategory;
  text: string;
  visualization?: "chart" | "indicator" | "granularity" | "symbol";
}

const examplePrompts: ExamplePrompt[] = [
  // Indicators
  {
    category: "Indicators",
    text: "Enable the RSI indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Disable the RSI indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Enable the MACD indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Disable the MACD indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Enable the Moving Average indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Enable the Volume indicator.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Enable Bollinger Bands.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "Show me all available indicators.",
    visualization: "indicator",
  },
  {
    category: "Indicators",
    text: "What do the current active indicators suggest?",
  },
  { category: "Indicators", text: "Explain the RSI indicator." },
  {
    category: "Indicators",
    text: "What does the MACD crossover indicate?",
    visualization: "chart",
  },
  {
    category: "Indicators",
    text: "Are there any MACD crossovers in this chart?",
    visualization: "chart",
  },

  // Granularity
  {
    category: "Granularity",
    text: "Switch to 5 minute granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to 15 minute granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to 1 hour granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to 4 hour granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to one day granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to 1 week granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "Switch to 1 month granularity.",
    visualization: "granularity",
  },
  {
    category: "Granularity",
    text: "What's the current time frame?",
    visualization: "granularity",
  },

  // Symbols
  {
    category: "Symbols",
    text: "Switch to BTC-USD symbol.",
    visualization: "symbol",
  },
  {
    category: "Symbols",
    text: "Switch to ETH-USD symbol.",
    visualization: "symbol",
  },
  {
    category: "Symbols",
    text: "Switch to SOL-USD symbol.",
    visualization: "symbol",
  },
  {
    category: "Symbols",
    text: "Switch to ADA-USD symbol.",
    visualization: "symbol",
  },
  {
    category: "Symbols",
    text: "Switch to DOGE-USD symbol.",
    visualization: "symbol",
  },

  // Trend Lines
  {
    category: "TrendLines",
    text: "Draw lines for support and resistance levels to this chart.",
    visualization: "chart",
  },
  {
    category: "TrendLines",
    text: "Draw a horizontal line at current price.",
    visualization: "chart",
  },
  {
    category: "TrendLines",
    text: "Draw a horizontal line at recent high.",
    visualization: "chart",
  },
  {
    category: "TrendLines",
    text: "Clear all drawings from the chart.",
    visualization: "chart",
  },

  // Pattern Detection
  {
    category: "PatternDetection",
    text: "What pattern do you see in the candles on this chart?",
    visualization: "chart",
  },
  {
    category: "PatternDetection",
    text: "Remove all pattern highlights.",
    visualization: "chart",
  },
  { category: "PatternDetection", text: "Can you help me analyze this chart?" },

  // Divergence
  {
    category: "Divergence",
    text: "Visualize the divergences in RSI that you see in the chart.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Visualize the divergences in indicators that you see in the chart.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Find bullish divergences in MACD.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Find bearish divergences in RSI.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Show volume divergences with price.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Highlight all indicator divergences.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Remove all divergence trend lines.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Is there a divergence between price and momentum?",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Check for hidden divergences.",
    visualization: "chart",
  },

  {
    category: "Divergence",
    text: "Analyze the price action and volume in the visible chart.",
    visualization: "chart",
  },
  {
    category: "Divergence",
    text: "Is there high volume supporting this trend?",
  },
  {
    category: "Divergence",
    text: "What's the average volume for the candles shown?",
  },
];

// Category configuration with colors
const categoryConfig: Record<
  PromptCategory,
  {
    label: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  Indicators: {
    label: "Indicators",
    bgColor: "rgba(143, 255, 0, 0.08)", // Primary green - very muted
    borderColor: "rgba(143, 255, 0, 0.25)",
  },
  Granularity: {
    label: "Granularity",
    bgColor: "rgba(99, 102, 241, 0.08)", // Indigo - very muted
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  Symbols: {
    label: "Symbols",
    bgColor: "rgba(168, 85, 247, 0.08)", // Purple - very muted
    borderColor: "rgba(168, 85, 247, 0.25)",
  },
  TrendLines: {
    label: "Trend Lines",
    bgColor: "rgba(251, 146, 60, 0.08)", // Orange - very muted
    borderColor: "rgba(251, 146, 60, 0.25)",
  },
  PatternDetection: {
    label: "Pattern Detection",
    bgColor: "rgba(236, 72, 153, 0.08)", // Pink - very muted
    borderColor: "rgba(236, 72, 153, 0.25)",
  },
  Divergence: {
    label: "Divergence",
    bgColor: "rgba(14, 165, 233, 0.08)", // Sky blue - very muted
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
};

interface ChatExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
  isOverlay?: boolean;
  isSidebar?: boolean;
  onClose?: () => void;
}

export function ChatExamplePrompts({
  onSelectPrompt,
  isOverlay = false,
  isSidebar = false,
  onClose,
}: ChatExamplePromptsProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Track expanded categories - default based on mode and saved preferences
  const [expandedCategories, setExpandedCategories] = useState<
    Set<PromptCategory>
  >(() => {
    // Check if we're on the server
    if (typeof window === "undefined") {
      // Default state for SSR - all collapsed
      return new Set<PromptCategory>();
    }

    // Try to load saved state from localStorage
    const savedState = localStorage.getItem("chatExamplePromptsExpanded");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return new Set<PromptCategory>(parsed);
      } catch {
        // If parsing fails, use defaults
      }
    }

    // Check if mobile (small screen) using matchMedia for more reliable detection
    const isMobile = window.matchMedia("(max-width: 639px)").matches; // Tailwind's 'sm' breakpoint is 640px

    // Default state:
    // - Mobile: all collapsed
    // - Desktop: TrendLines, PatternDetection, and Divergence expanded
    if (isMobile) {
      return new Set<PromptCategory>();
    } else {
      const defaultExpanded: PromptCategory[] = [
        "TrendLines",
        "PatternDetection",
        "Divergence",
      ];
      return new Set<PromptCategory>(defaultExpanded);
    }
  });

  const toggleCategory = (category: PromptCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "chatExamplePromptsExpanded",
      JSON.stringify(Array.from(expandedCategories))
    );
  }, [expandedCategories]);

  // Handle window resize to adjust accordion states for first-time visitors
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const savedState = localStorage.getItem("chatExamplePromptsExpanded");
      // Only adjust if there's no saved state (first time visitor)
      if (!savedState) {
        const isMobile = window.matchMedia("(max-width: 639px)").matches;

        if (isMobile) {
          setExpandedCategories(new Set<PromptCategory>());
        } else {
          const defaultExpanded: PromptCategory[] = [
            "TrendLines",
            "PatternDetection",
            "Divergence",
          ];
          setExpandedCategories(new Set<PromptCategory>(defaultExpanded));
        }
      }
    };

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Group prompts by category
  const promptsByCategory = Object.keys(categoryConfig).reduce(
    (acc, category) => {
      acc[category as PromptCategory] = examplePrompts.filter(
        (p) => p.category === category
      );
      return acc;
    },
    {} as Record<PromptCategory, ExamplePrompt[]>
  );

  const handlePromptClick = (prompt: string) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      onSelectPrompt(prompt);
    }
  };

  const containerClasses = isSidebar
    ? "h-full bg-gray-950 p-4 overflow-y-auto"
    : isOverlay
    ? "bg-gray-900 rounded-lg p-6 relative max-h-[80vh] overflow-y-auto"
    : "flex-1 flex flex-col items-center justify-center p-6";

  return (
    <>
      <div className={containerClasses}>
        {/* Close button for overlay mode */}
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header - compact for sidebar */}
        <div
          className={
            isSidebar ? "" : isOverlay ? "flex flex-col items-center" : ""
          }
        >
          {!isSidebar && (
            <Bot className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
          )}
          {isSidebar ? (
            <h3 className="text-sm font-semibold text-white mb-4">
              Example Prompts
            </h3>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">
                Use this agent to{" "}
                <strong style={{ color: "var(--color-accent-1)" }}>
                  learn
                </strong>{" "}
                and{" "}
                <strong style={{ color: "var(--color-accent-1)" }}>
                  command the chart
                </strong>
              </h3>
              <p className="text-sm mb-6 text-center">
                Click on any of the prompts below to get started.
              </p>
            </>
          )}
        </div>

        <div className={`w-full ${isSidebar ? "" : "max-w-2xl"}`}>
          {/* Render each category group */}
          {(Object.keys(categoryConfig) as PromptCategory[]).map((category) => {
            const prompts = promptsByCategory[category];
            const config = categoryConfig[category];

            if (prompts.length === 0) return null;

            const isExpanded = expandedCategories.has(category);

            return (
              <div
                key={category}
                className="border-b border-gray-800 last:border-b-0"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-3 hover:bg-gray-900/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {category === "Indicators" && (
                      <Activity
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    {category === "Granularity" && (
                      <Clock
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    {category === "Symbols" && (
                      <Coins
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    {category === "TrendLines" && (
                      <TrendingUp
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    {category === "PatternDetection" && (
                      <Search
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    {category === "Divergence" && (
                      <GitBranch
                        className="w-3 h-3"
                        style={{ color: "var(--color-accent-1)" }}
                      />
                    )}
                    <h4 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                      {config.label}
                    </h4>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-2 pb-3 pt-1">
                    <div className="grid grid-cols-1 gap-2">
                      {prompts.map((prompt, index) => (
                        <button
                          key={`${category}-${index}`}
                          onClick={() => handlePromptClick(prompt.text)}
                          className={`text-left ${
                            isSidebar ? "px-3 py-2" : "px-4 py-3"
                          } text-gray-200 rounded-lg transition-all ${
                            isSidebar ? "text-xs" : "text-sm"
                          } border hover:opacity-90`}
                          style={{
                            backgroundColor: config.bgColor,
                            borderColor: config.borderColor,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              config.bgColor.replace("0.08", "0.12");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              config.bgColor;
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {prompt.visualization === "chart" && (
                              <LineChart
                                className={`${
                                  isSidebar ? "w-3 h-3" : "w-4 h-4"
                                } text-gray-400 flex-shrink-0`}
                              />
                            )}
                            {prompt.visualization === "indicator" && (
                              <Activity
                                className={`${
                                  isSidebar ? "w-3 h-3" : "w-4 h-4"
                                } text-gray-400 flex-shrink-0`}
                              />
                            )}
                            {prompt.visualization === "granularity" && (
                              <Clock
                                className={`${
                                  isSidebar ? "w-3 h-3" : "w-4 h-4"
                                } text-gray-400 flex-shrink-0`}
                              />
                            )}
                            {prompt.visualization === "symbol" && (
                              <Coins
                                className={`${
                                  isSidebar ? "w-3 h-3" : "w-4 h-4"
                                } text-gray-400 flex-shrink-0`}
                              />
                            )}
                            {/* Show question icon for prompts that are questions */}
                            {prompt.text.endsWith("?") &&
                              !prompt.visualization && (
                                <HelpCircle
                                  className={`${
                                    isSidebar ? "w-3 h-3" : "w-4 h-4"
                                  } text-gray-400 flex-shrink-0`}
                                />
                              )}
                            <span className="flex-1">{prompt.text}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to use AI Assistant"
        description="Sign in to ask questions and interact with the AI assistant for chart analysis."
      />
    </>
  );
}
