"use client";

import Link from "next/link";
import { Atom, FlaskConical, Leaf, Sigma } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/use-translation";

const subjects = [
  { key: "math",      icon: Sigma,        color: "from-brand-500 to-brand-700" },
  { key: "physics",   icon: Atom,         color: "from-accent-500 to-accent-700" },
  { key: "chemistry", icon: FlaskConical, color: "from-brand-600 to-accent-600" },
  { key: "biology",   icon: Leaf,         color: "from-accent-400 to-brand-500" },
] as const;

export default function HomePage() {
  const t = useT();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-40 bg-background/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white">
              MrK
            </span>
            <span>Lernplattform</span>
          </Link>
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              {t.common.login}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:opacity-90 transition"
            >
              {t.common.register}
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1 grid place-items-center px-6 py-20">
        <div className="max-w-3xl text-center space-y-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
            {t.home.tagline}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {t.home.heroTitleStart}{" "}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              {t.home.heroTitleHighlight}
            </span>{" "}
            {t.home.heroTitleEnd}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:opacity-90 transition"
            >
              {t.home.ctaStart}
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl font-medium border border-border hover:bg-muted transition"
            >
              {t.home.ctaDemo}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto w-full px-6 pb-20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {subjects.map(({ key, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} grid place-items-center text-white mb-4`}
            >
              <Icon size={22} />
            </div>
            <h3 className="font-semibold">{t.home.subjects[key]}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.home.subjectDescription}
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MrK · {t.home.footer}
      </footer>
    </main>
  );
}
