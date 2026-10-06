"use client";

import * as React from "react";
import { X, Search, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { chatApi, type ChatUser } from "@/lib/chat-api";

export function NewChatDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (userId: string) => void;
}) {
  const [users, setUsers] = React.useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chatApi.users(search || undefined);
      setUsers(data.users);
    } catch (err) {
      console.error("Users laden fehlgeschlagen:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-500" />
            Neuer Chat
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail suchen..."
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Users */}
        <div className="flex-1 overflow-y-auto ios-scroll">
          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Keine Nutzer gefunden.
              </p>
            </div>
          ) : (
            users.map((u) => {
              const initials = (
                u.first_name.charAt(0) + u.last_name.charAt(0)
              ).toUpperCase();
              return (
                <button
                  key={u.id}
                  onClick={() => onSelect(u.id)}
                  className="w-full flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 transition text-left touch-target"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {u.role === "teacher"
                      ? "Lehrer"
                      : u.role === "admin"
                      ? "Admin"
                      : "Schüler"}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
