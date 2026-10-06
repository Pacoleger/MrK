"use client";

import * as React from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/chat-api";

export function ChatList({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  currentUserId,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  currentUserId: string;
}) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search) return conversations;
    const s = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.other_first_name.toLowerCase().includes(s) ||
        c.other_last_name.toLowerCase().includes(s)
    );
  }, [conversations, search]);

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            Nachrichten
          </h2>
          <Button size="sm" onClick={onNewChat} aria-label="Neuer Chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "Keine Treffer" : "Noch keine Chats"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={onNewChat}
                className="mt-3"
              >
                <Plus className="h-4 w-4" />
                Neuen Chat starten
              </Button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedId;
            const isMyLastMessage = conv.last_sender_id === currentUserId;
            const hasUnread = conv.unread_count > 0;
            const initials = (
              conv.other_first_name.charAt(0) + conv.other_last_name.charAt(0)
            ).toUpperCase();

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  "w-full text-left p-3 border-b border-border transition touch-target no-tap-highlight",
                  isSelected
                    ? "bg-brand-50 dark:bg-brand-900/20"
                    : "hover:bg-muted/50 active:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          hasUnread ? "font-semibold" : "font-medium"
                        )}
                      >
                        {conv.other_first_name} {conv.other_last_name}
                      </p>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatRelative(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          hasUnread
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {isMyLastMessage && "Du: "}
                        {conv.last_message ?? "Neue Konversation"}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold grid place-items-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// Relative Zeit
// ============================================================

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "jetzt";
  if (diffMin < 60) return `${diffMin}m`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}
