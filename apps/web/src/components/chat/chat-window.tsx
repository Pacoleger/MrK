"use client";

import * as React from "react";
import Image from "next/image";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatApi, type Conversation, type Message } from "@/lib/chat-api";

const POLL_INTERVAL_MS = 5000;

export function ChatWindow({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = React.useCallback(async () => {
    try {
      const data = await chatApi.messages(conversation.id);
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      console.error("Nachrichten laden fehlgeschlagen:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id]);

  React.useEffect(() => {
    setIsLoading(true);
    loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError(null);

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_first_name: "Du",
      sender_last_name: "",
      sender_avatar_url: null,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    try {
      await chatApi.sendMessage(conversation.id, content);
      await loadMessages();
    } catch (err) {
      setError("Nachricht konnte nicht gesendet werden");
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = (
    conversation.other_first_name.charAt(0) +
    conversation.other_last_name.charAt(0)
  ).toUpperCase();
  const hasAvatar = !!conversation.other_avatar_url;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-border bg-card shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition touch-target"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {hasAvatar ? (
          <Image
            src={conversation.other_avatar_url!}
            alt={`${conversation.other_first_name} ${conversation.other_last_name}`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {conversation.other_first_name} {conversation.other_last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {conversation.other_role === "teacher"
              ? "Lehrkraft"
              : conversation.other_role === "admin"
              ? "Administrator"
              : "Schüler:in"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 ios-scroll"
      >
        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              Noch keine Nachrichten. Schreib die erste!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const msgInitials = (
              msg.sender_first_name.charAt(0) +
              (msg.sender_last_name.charAt(0) || "")
            ).toUpperCase();
            const hasMsgAvatar = !!msg.sender_avatar_url;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                {/* Avatar für andere Nutzer */}
                {!isMe && (
                  hasMsgAvatar ? (
                    <Image
                      src={msg.sender_avatar_url!}
                      alt={`${msg.sender_first_name} ${msg.sender_last_name}`}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-[10px] font-bold shrink-0">
                      {msgInitials}
                    </div>
                  )
                )}

                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5",
                    isMe
                      ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                    msg.id.startsWith("temp-") && "opacity-70"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 text-right",
                      isMe ? "text-white/70" : "text-muted-foreground"
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card shrink-0 safe-bottom">
        {error && (
          <p className="text-xs text-red-600 mb-2 px-1">{error}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            disabled={isSending}
            rows={1}
            maxLength={2000}
            className="flex-1 min-h-[40px] max-h-32 rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 resize-none ios-scroll"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            size="icon"
            className="shrink-0 h-10 w-10"
            aria-label="Senden"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
