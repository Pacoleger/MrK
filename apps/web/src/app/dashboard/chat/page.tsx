"use client";

import * as React from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { chatApi, type Conversation } from "@/lib/chat-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

const POLL_INTERVAL_MS = 8000;

export default function ChatPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showNewChat, setShowNewChat] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<"list" | "chat">("list");

  const loadConversations = React.useCallback(async () => {
    try {
      const data = await chatApi.conversations();
      setConversations(data.conversations);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Konversationen konnten nicht geladen werden");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    setMobileView("chat");
  };

  const handleNewChat = async (userId: string) => {
    setShowNewChat(false);
    try {
      const result = await chatApi.createConversation(userId);
      await loadConversations();

      // Wähle die neue/aktuelle Konversation
      const fresh = await chatApi.conversations();
      const conv = fresh.conversations.find(
        (c) => c.id === result.conversationId
      );
      if (conv) {
        setSelected(conv);
        setMobileView("chat");
      }
    } catch (err) {
      console.error("Konversation erstellen fehlgeschlagen:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] max-w-6xl">
      <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex">
        {/* Sidebar / Liste */}
        <div
          className={`w-full lg:w-80 lg:flex shrink-0 ${
            mobileView === "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          {isLoading ? (
            <div className="flex-1 grid place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex-1 grid place-items-center p-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          ) : (
            <ChatList
              conversations={conversations}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              onNewChat={() => setShowNewChat(true)}
              currentUserId={user.id}
            />
          )}
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          } flex-col`}
        >
          {selected ? (
            <ChatWindow
              key={selected.id}
              conversation={selected}
              currentUserId={user.id}
              onBack={() => setMobileView("list")}
            />
          ) : (
            <div className="flex-1 grid place-items-center p-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Kein Chat ausgewählt</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wähle links einen Chat oder starte einen neuen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatDialog
          onClose={() => setShowNewChat(false)}
          onSelect={handleNewChat}
        />
      )}
    </div>
  );
}
