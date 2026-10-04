"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Trophy,
  Settings,
  Atom,
  FlaskConical,
  Leaf,
  Sigma,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { useT } from "@/i18n/use-translation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",                 label: "Übersicht",     icon: LayoutDashboard },
  { href: "/dashboard/aufgaben",        label: "Aufgaben",      icon: BookOpen },
  { href: "/dashboard/klassen",         label: "Klassen",       icon: GraduationCap },
  { href: "/dashboard/erfolge",         label: "Erfolge",       icon: Trophy },
  { href: "/dashboard/einstellungen",   label: "Einstellungen", icon: Settings },
];

const subjects = [
  { key: "math",      icon: Sigma,        color: "from-brand-500 to-brand-700" },
  { key: "physics",   icon: Atom,         color: "from-accent-500 to-accent-700" },
  { key: "chemistry", icon: FlaskConical, color: "from-brand-600 to-accent-600" },
  { key: "biology",   icon: Leaf,         color: "from-accent-400 to-brand-500" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useT();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white">
                MrK
              </span>
              <span>Lernplattform</span>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
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
          </nav>

          <div className="p-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              FÄCHER
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {subjects.map(({ key, icon: Icon, color }) => (
                <div
                  key={key}
                  title={t.home.subjects[key as keyof typeof t.home.subjects]}
                  className={`aspect-square rounded-lg bg-gradient-to-br ${color} grid place-items-center text-white cursor-pointer hover:opacity-90 transition`}
                >
                  <Icon size={16} />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-3">
            <div className="lg:hidden flex items-center gap-2 font-bold">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-sm">
                MrK
              </span>
            </div>

            <div className="flex-1" />

            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
