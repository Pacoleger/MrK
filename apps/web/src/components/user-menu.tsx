"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/i18n/use-translation";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const t = useT();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
  const hasAvatar = !!user.avatarUrl;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full p-0.5 pr-3 transition hover:bg-muted",
          open && "bg-muted"
        )}
        aria-label="Benutzermenü"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {hasAvatar ? (
          <Image
            src={user.avatarUrl!}
            alt={`${user.firstName} ${user.lastName}`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold">
            {initials}
          </span>
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {user.firstName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              {hasAvatar ? (
                <Image
                  src={user.avatarUrl!}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <p className="text-xs mt-2 text-brand-600 font-medium">
              {t.roles[user.role]}
            </p>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted transition disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {t.common.logout}
          </button>
        </div>
      )}
    </div>
  );
}
