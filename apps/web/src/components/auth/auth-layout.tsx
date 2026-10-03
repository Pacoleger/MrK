"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Atom, FlaskConical, Leaf, Sigma } from "lucide-react";
import { useT } from "@/i18n/use-translation";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  { key: "math",      icon: Sigma,        color: "from-brand-500 to-brand-700" },
  { key: "physics",   icon: Atom,         color: "from-accent-500 to-accent-700" },
  { key: "chemistry", icon: FlaskConical, color: "from-brand-600 to-accent-600" },
  { key: "biology",   icon: Leaf,         color: "from-accent-400 to-brand-500" },
] as const;

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const t = useT();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding Panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 text-white p-10 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent-300/20 blur-3xl" />

        <Link
          href="/"
          className="relative flex items-center gap-2 font-bold text-xl"
        >
          <span className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            MrK
          </span>
          <span>Lernplattform</span>
        </Link>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-3">
              {t.home.heroTitleStart}{" "}
              <span className="text-accent-200">
                {t.home.heroTitleHighlight}
              </span>{" "}
              {t.home.heroTitleEnd}
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              {t.home.heroSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {features.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                className="rounded-2xl bg-white/10 backdrop-blur p-3 flex flex-col items-center gap-2 border border-white/20"
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} grid place-items-center`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-white/90 text-center leading-tight">
                  {t.home.subjects[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-white/70">
          © {new Date().getFullYear()} MrK · {t.home.footer}
        </div>
      </aside>

      {/* Right: Form Panel */}
      <main className="flex flex-col p-6 sm:p-10">
        <div className="lg:hidden mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.auth.backHome}
          </Link>
        </div>

        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        <div className="hidden lg:block text-center text-xs text-muted-foreground mt-8">
          <Link href="/" className="hover:text-foreground transition">
            {t.auth.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
