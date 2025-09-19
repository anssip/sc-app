import { useState } from "react";
import { Bot } from "lucide-react";
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

  // Advanced prompts
  {
    category: "Advanced",
    text: "Draw lines for support and resistance levels to this chart.",
  },
  {
    category: "Advanced",
    text: "How would you trade with this chart?",
  },
];

interface ChatExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function ChatExamplePrompts({
  onSelectPrompt,
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

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Bot className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Ask me about the chart, or ask me to change the chart!
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Click on a suggestion to get started
        </p>

        <div className="w-full max-w-2xl space-y-6">
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
                  className="text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 text-gray-200 rounded-lg transition-colors text-sm border border-gray-700 hover:border-gray-600"
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Analysis prompts */}
        <div className="mt-10">
          <h4 className="text-xs uppercase text-gray-500 font-semibold mb-3 tracking-wider">
            Analysis
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {advancedPrompts.map((prompt, index) => (
              <button
                key={`advanced-${index}`}
                onClick={() => handlePromptClick(prompt.text)}
                className="text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 text-gray-200 rounded-lg transition-colors text-sm border border-gray-700 hover:border-gray-600"
              >
                {prompt.text}
              </button>
            ))}
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
