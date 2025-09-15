import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { MessageCircle, Clock, Trash2, X } from "lucide-react";

interface ChatSession {
  id: string;
  chartId: string;
  timestamp: Date;
  firstMessage?: string;
  messageCount: number;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  loading: boolean;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  sessions,
  currentSessionId,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const filtered = sessions.filter((session) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        session.firstMessage?.toLowerCase().includes(searchLower) ||
        session.id.toLowerCase().includes(searchLower)
      );
    });
    setFilteredSessions(filtered);
  }, [sessions, searchTerm]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const truncateMessage = (message?: string) => {
    if (!message) return "New conversation";
    if (message.length <= 50) return message;
    return message.substring(0, 50) + "...";
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-[500]"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-black border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                Chat History
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

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Session List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading chat history...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No chat history found</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                      session.id === currentSessionId
                        ? "bg-blue-900/20 border-blue-600 text-white"
                        : "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {truncateMessage(session.firstMessage)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {session.messageCount} {session.messageCount === 1 ? "message" : "messages"}
                          </span>
                        </div>
                      </div>
                      {session.id === currentSessionId && (
                        <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Info Text */}
            {filteredSessions.length > 0 && (
              <p className="mt-4 text-xs text-gray-500 text-center">
                Click on a conversation to restore it
              </p>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};