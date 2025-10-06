import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { X, Share2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  shareToX,
  isTwitterConfigured,
  getCharacterCount,
} from "../services/socialSharing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  chartApi: any; // ChartApi instance
}

type ShareState = "idle" | "loading" | "success" | "error";

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  messages,
  chartApi,
}) => {
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [mainTweetText, setMainTweetText] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  const isConfigured = isTwitterConfigured();
  const charCount = getCharacterCount(mainTweetText);
  const isOverLimit = charCount > 280;
  const selectedMessages = messages.filter((m) => selectedMessageIds.has(m.id));

  // Capture screenshot when modal opens
  useEffect(() => {
    if (isOpen && chartApi && !screenshot) {
      captureScreenshot();
    }
  }, [isOpen, chartApi]);

  // Clean up screenshot when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closing (no need to revoke data URL)
      setScreenshot(null);
      setScreenshotUrl(null);
      setMainTweetText("");
      setSelectedMessageIds(new Set());
      setShareState("idle");
      setError(null);
      setTweetUrl(null);
    }
  }, [isOpen]);

  const captureScreenshot = async () => {
    setLoadingScreenshot(true);
    try {
      // Check if chartApi exists
      if (!chartApi) {
        throw new Error("Chart API is not available");
      }

      // The chartApi might be a SCChartRef, which has an .api property for the actual ChartApi
      const actualApi = (chartApi as any).api || chartApi;

      if (!actualApi || typeof actualApi.takeScreenshot !== "function") {
        console.error("chartApi structure:", chartApi);
        console.error("actualApi structure:", actualApi);
        console.error("Available methods on chartApi:", Object.keys(chartApi));
        console.error(
          "Available methods on actualApi:",
          actualApi ? Object.keys(actualApi) : "null"
        );
        throw new Error("takeScreenshot method is not available");
      }

      // Get screenshot as data URL (using JPEG for black background instead of transparent)
      const dataUrl = await actualApi.takeScreenshot({
        format: "jpeg",
        quality: 0.95,
      });

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      setScreenshot(blob);

      // Use the data URL directly for preview (more efficient)
      setScreenshotUrl(dataUrl);
    } catch (err) {
      console.error("Error capturing screenshot:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to capture chart screenshot"
      );
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessageIds);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessageIds(newSelected);
  };

  const selectAllMessages = () => {
    setSelectedMessageIds(new Set(messages.map((m) => m.id)));
  };

  const clearSelection = () => {
    setSelectedMessageIds(new Set());
  };

  const handleShare = async () => {
    if (!screenshot) {
      setError("No screenshot available");
      return;
    }

    if (!mainTweetText.trim()) {
      setError("Please enter tweet text");
      return;
    }

    if (isOverLimit) {
      setError("Tweet text exceeds 280 character limit");
      return;
    }

    if (!isConfigured) {
      setError("X (Twitter) API credentials not configured");
      return;
    }

    setShareState("loading");
    setError(null);

    try {
      const result = await shareToX({
        screenshot,
        mainTweetText: mainTweetText.trim(),
        selectedMessages,
      });

      if (result.success) {
        setShareState("success");
        setTweetUrl(result.tweetUrl || null);
      } else {
        setShareState("error");
        setError(result.error || "Failed to share");
      }
    } catch (err) {
      setShareState("error");
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[500]">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-black border border-gray-700 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                Share to X (Twitter)
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isConfigured && (
              <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">X API Not Configured</p>
                    <p>
                      Please configure your X (Twitter) API credentials in the
                      environment variables to enable sharing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {shareState === "success" && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-200">
                    <p className="font-semibold mb-1">Successfully Shared!</p>
                    {tweetUrl && (
                      <a
                        href={tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View your tweet →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {shareState === "error" && error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Screenshot & Tweet Text */}
              <div className="space-y-4">
                {/* Screenshot Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chart Screenshot
                  </label>
                  <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                    {loadingScreenshot ? (
                      <div className="aspect-video flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      </div>
                    ) : screenshotUrl ? (
                      <img
                        src={screenshotUrl}
                        alt="Chart screenshot"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="aspect-video flex items-center justify-center text-gray-500">
                        <p>No screenshot available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Tweet Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Tweet Text
                  </label>
                  <textarea
                    value={mainTweetText}
                    onChange={(e) => setMainTweetText(e.target.value)}
                    placeholder="Share your chart analysis..."
                    className={`w-full bg-gray-900 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 ${
                      isOverLimit
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-700 focus:ring-blue-500"
                    } border`}
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-1 text-xs">
                    <span className="text-gray-500">
                      This will be the main tweet with the chart image
                    </span>
                    <span
                      className={`font-mono ${
                        isOverLimit ? "text-red-400" : "text-gray-400"
                      }`}
                    >
                      {charCount}/280
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Message Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Messages to Share
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllMessages}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={clearSelection}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  Selected messages will be posted as replies to the main tweet
                </div>

                {/* Message List */}
                <div className="border border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {messages.map((message) => (
                        <label
                          key={message.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-900/50 transition-colors ${
                            selectedMessageIds.has(message.id)
                              ? "bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMessageIds.has(message.id)}
                            onChange={() => toggleMessageSelection(message.id)}
                            className="mt-1 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-medium ${
                                  message.role === "user"
                                    ? "text-blue-400"
                                    : "text-green-400"
                                }`}
                              >
                                {message.role === "user" ? "👤 You" : "🤖 AI"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  message.timestamp
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 break-words">
                              {truncateText(message.content, 150)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMessages.length > 0 && (
                  <div className="text-xs text-gray-400">
                    {selectedMessages.length} message
                    {selectedMessages.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-900 px-6 py-4 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {shareState === "loading" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </span>
                ) : (
                  <span>
                    {selectedMessages.length > 0
                      ? `Main tweet + ${selectedMessages.length} message${
                          selectedMessages.length !== 1 ? "s" : ""
                        } as replies`
                      : "Main tweet only"}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={shareState === "loading"}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shareState === "success" ? "Close" : "Cancel"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={
                    shareState === "loading" ||
                    shareState === "success" ||
                    !screenshot ||
                    !mainTweetText.trim() ||
                    isOverLimit ||
                    !isConfigured
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {shareState === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share to X
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
