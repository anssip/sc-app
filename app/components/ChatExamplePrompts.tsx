import { useState } from "react";
import { Bot, X } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { LoginModal } from "./LoginModal";

interface ExamplePrompt {
  category: "Basic" | "Advanced";
  text: string;
}

const examplePrompts: ExamplePrompt[] = [
  // Basic prompts
  { category: "Basic", text: "Enable the RSI indicator." },
  { category: "Basic", text: "Disable the RSI indicator." },
  { category: "Basic", text: "Enable the Moving Average indicator." },
  { category: "Basic", text: "Enable the Volume indicator." },
  { category: "Basic", text: "Switch to one day granularity." },
  { category: "Basic", text: "Switch to ETH-USD symbol." },
  { category: "Basic", text: "Remove all trend lines from this chart." },
  { category: "Basic", text: "Explain the RSI indicator." },

  // Analysis prompts
  {
    category: "Advanced",
    text: "Draw lines for support and resistance levels to this chart.",
  },
  {
    category: "Advanced",
    text: "Can you help me analyze this chart?",
  },

  {
    category: "Advanced",
    text: "What pattern do you see in the candles on this chart?",
  },

  {
    category: "Advanced",
    text: "Analyze the price action and volume in the visible chart.",
  },
  {
    category: "Advanced",
    text: "Is there high volume supporting this trend?",
  },
  {
    category: "Advanced",
    text: "What's the average volume for the candles shown?",
  },

  // Indicator-based prompts
  {
    category: "Advanced",
    text: "What do the current active indicators suggest?",
  },
  {
    category: "Advanced",
    text: "Visualize the divergences in RSI that you see in the chart.",
  },
  {
    category: "Advanced",
    text: "Visualize the divergences in indicators that you see in the chart.",
  },
];

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
  const basicPrompts = examplePrompts.filter((p) => p.category === "Basic");
  const advancedPrompts = examplePrompts.filter(
    (p) => p.category === "Advanced"
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
                Ask me about the chart, or ask me to change the chart!
              </h3>
              <p className="text-sm text-gray-400 mb-6 text-center">
                Click on a suggestion to get started
              </p>
            </>
          )}
        </div>

        <div className={`w-full ${isSidebar ? "" : "max-w-2xl"} space-y-6`}>
          {/* Basic prompts */}
          <div>
            <h4 className="text-xs uppercase text-gray-500 font-semibold mb-3 tracking-wider">
              Basic
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {basicPrompts.map((prompt, index) => (
                <button
                  key={`basic-${index}`}
                  onClick={() => handlePromptClick(prompt.text)}
                  className={`text-left ${
                    isSidebar ? "px-3 py-2" : "px-4 py-3"
                  } bg-gray-800 hover:bg-gray-750 text-gray-200 rounded-lg transition-colors ${
                    isSidebar ? "text-xs" : "text-sm"
                  } border border-gray-700 hover:border-gray-600`}
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis prompts */}
          <div>
            <h4 className="text-xs uppercase text-gray-500 font-semibold mb-3 tracking-wider">
              Analysis
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {advancedPrompts.map((prompt, index) => (
                <button
                  key={`advanced-${index}`}
                  onClick={() => handlePromptClick(prompt.text)}
                  className={`text-left ${
                    isSidebar ? "px-3 py-2" : "px-4 py-3"
                  } text-gray-200 rounded-lg transition-all ${
                    isSidebar ? "text-xs" : "text-sm"
                  } border hover:opacity-90`}
                  style={{
                    backgroundColor: "rgba(143, 255, 0, 0.15)",
                    borderColor: "rgba(143, 255, 0, 0.3)",
                  }}
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
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
