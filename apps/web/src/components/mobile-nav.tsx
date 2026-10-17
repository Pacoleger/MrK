"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Library,
  MessageSquare,
  GraduationCap,
  Trophy,
  Settings,
  Shield,
  Menu,
  X,
  Atom,
  FlaskConical,
  Leaf,
  Sigma,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/i18n/use-translation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",               label: "Übersicht",     icon: LayoutDashboard },
  { href: "/dashboard/aufgaben",      label: "Aufgaben",      icon: BookOpen },
  { href: "/dashboard/quiz",          label: "Quizze",        icon: ListChecks },
  { href: "/dashboard/materialien",   label: "Materialien",   icon: Library },
  { href: "/dashboard/chat",          label: "Chat",          icon: MessageSquare },
  { href: "/dashboard/klassen",       label: "Klassen",       icon: GraduationCap },
  { href: "/dashboard/erfolge",       label: "Erfolge",       icon: Trophy },
  { href: "/dashboard/einstellungen", label: "Einstellungen", icon: Settings },
];

const SUBJECTS = [
  { key: "math",      icon: Sigma,        color: "from-brand-500 to-brand-700" },
  { key: "physics",   icon: Atom,         color: "from-accent-500 to-accent-700" },
  { key: "chemistry", icon: FlaskConical, color: "from-brand-600 to-accent-600" },
  { key: "biology",   icon: Leaf,         color: "from-accent-400 to-brand-500" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Drawer bei Routenwechsel schließen
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body-Scroll blocken wenn offen
  React.useEffect(() => {
    if (!mounted) return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const drawer = open ? (
    <div
      className="fixed inset-0 z-[9999] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Hauptmenü"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="absolute inset-y-0 left-0 w-[85vw] max-w-xs bg-card border-r border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/mrk-logo.png"
              alt="MrK Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <span>Lernplattform</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-muted transition touch-target"
            aria-label="Menü schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 ios-scroll">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition touch-target no-tap-highlight",
                  active
                    ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <div className="pt-2 mt-2 border-t border-border">
              <Link
                href="/dashboard/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition touch-target",
                  pathname.startsWith("/dashboard/admin")
                    ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </div>
          )}
        </nav>

        {/* Fächer */}
        <div className="p-3 border-t border-border shrink-0">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            FÄCHER
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {SUBJECTS.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                title={t.home.subjects[key as keyof typeof t.home.subjects]}
                className={`aspect-square rounded-lg bg-gradient-to-br ${color} grid place-items-center text-white cursor-pointer active:opacity-70 transition`}
              >
                <Icon size={16} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition touch-target no-tap-highlight"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer per Portal an body hängen */}
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
