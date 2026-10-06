"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",                label: "Übersicht",     icon: LayoutDashboard },
  { href: "/dashboard/aufgaben",       label: "Aufgaben",      icon: BookOpen },
  { href: "/dashboard/quiz",           label: "Quizze",        icon: ListChecks },
  { href: "/dashboard/klassen",        label: "Klassen",       icon: GraduationCap },
  { href: "/dashboard/erfolge",        label: "Erfolge",       icon: Trophy },
  { href: "/dashboard/einstellungen",  label: "Einstellungen", icon: Settings },
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

  // Close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body-Scroll blocken wenn offen
  React.useEffect(() => {
    if (open) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition touch-target no-tap-highlight"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />

          {/* Drawer */}
          <aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between safe-top">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white">
                  MrK
                </span>
                <span>Lernplattform</span>
              </Link>
              <button
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
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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

              {/* Admin */}
              {user?.role === "admin" && (
                <div className="pt-2 mt-2 border-t border-border">
                  <Link
                    href="/dashboard/admin"
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
            <div className="p-3 border-t border-border safe-bottom">
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
      )}
    </>
  );
}
