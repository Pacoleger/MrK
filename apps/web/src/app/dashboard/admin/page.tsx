"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ListChecks,
  Activity,
  Shield,
  Loader2,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi, type AdminStats } from "@/lib/admin-api";

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message ?? "Fehler beim Laden"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
        {error ?? "Fehler"}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-500" />
          Admin-Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Übersicht und Verwaltung der Plattform.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink
          href="/dashboard/admin/benutzer"
          icon={Users}
          title="Benutzer"
          description="Rollen und Konten verwalten"
          color="from-brand-500 to-brand-700"
        />
        <QuickLink
          href="/dashboard/admin/klassen"
          icon={GraduationCap}
          title="Klassen"
          description="Klassen anlegen und zuweisen"
          color="from-accent-500 to-accent-700"
        />
        <QuickLink
          href="/dashboard/admin/schuljahre"
          icon={Calendar}
          title="Schuljahre"
          description="Schuljahre verwalten"
          color="from-purple-500 to-pink-500"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBox
          label="Benutzer gesamt"
          value={stats.totalUsers}
          icon={Users}
          color="from-brand-500 to-brand-600"
        />
        <StatBox
          label="Schüler"
          value={stats.users.student}
          icon={GraduationCap}
          color="from-accent-500 to-accent-600"
        />
        <StatBox
          label="Lehrer"
          value={stats.users.teacher}
          icon={BookOpen}
          color="from-brand-600 to-accent-600"
        />
        <StatBox
          label="Klassen"
          value={stats.classes}
          icon={GraduationCap}
          color="from-purple-500 to-pink-500"
        />
        <StatBox
          label="Aufgaben"
          value={stats.assignments}
          icon={FileText}
          color="from-amber-400 to-orange-500"
        />
        <StatBox
          label="Quizze"
          value={stats.quizzes}
          icon={ListChecks}
          color="from-cyan-500 to-blue-500"
        />
        <StatBox
          label="Abgaben"
          value={stats.submissions}
          icon={FileText}
          color="from-emerald-500 to-teal-500"
        />
        <StatBox
          label="Aktivität (7 Tage)"
          value={stats.weeklyActivity}
          icon={Activity}
          color="from-red-400 to-pink-500"
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg hover:-translate-y-0.5 transition h-full cursor-pointer">
        <CardContent className="p-5">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} grid place-items-center text-white mb-3`}
          >
            <Icon size={22} />
          </div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <div className="flex items-center gap-1 text-xs text-brand-600 mt-3 font-medium">
            Öffnen
            <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} grid place-items-center text-white shrink-0`}
          >
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
