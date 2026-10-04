"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";
import { notificationsApi, type Notification } from "@/lib/notifications-api";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("notifications load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling alle 30s
  React.useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-lg hover:bg-muted transition",
          open && "bg-muted"
        )}
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:underline"
              >
                Alle gelesen
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="grid place-items-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Keine Benachrichtigungen
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition",
                      !n.is_read && "bg-brand-50/50 dark:bg-brand-900/10",
                      n.link_url && "hover:bg-muted cursor-pointer"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        n.is_read ? "bg-transparent" : "bg-brand-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );

                return n.link_url ? (
                  <Link
                    key={n.id}
                    href={n.link_url}
                    onClick={() => {
                      if (!n.is_read) {
                        notificationsApi.markRead(n.id).catch(console.error);
                        setUnreadCount((c) => Math.max(0, c - 1));
                      }
                      setOpen(false);
                    }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
