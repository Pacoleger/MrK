"use client";

import {
  BookOpen,
  Star,
  Trophy,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { LevelProgress } from "@/components/dashboard/level-progress";
import { BadgeGrid } from "@/components/dashboard/badge-grid";
import { useAuth } from "@/hooks/use-auth";
import { useStats } from "@/hooks/use-stats";

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, isLoading } = useStats();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  const openCount = stats
    ? stats.submissions.not_started + stats.submissions.in_progress
    : 0;
  const completedCount = stats
    ? stats.submissions.submitted + stats.submissions.graded
    : 0;
  const pointsPercent =
    stats && stats.points.max > 0
      ? Math.round((stats.points.earned / stats.points.max) * 100)
      : 0;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {greeting}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier ist deine Übersicht für heute.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Offene Aufgaben"
          value={isLoading ? "—" : openCount}
          icon={BookOpen}
          colorClass="from-brand-500 to-brand-600"
          hint={
            stats
              ? `${stats.submissions.in_progress} in Bearbeitung`
              : undefined
          }
        />
        <StatCard
          label="Erledigt"
          value={isLoading ? "—" : completedCount}
          icon={CheckCircle2}
          colorClass="from-accent-500 to-accent-600"
          hint={stats ? `${stats.weekly.completed} diese Woche` : undefined}
        />
        <StatCard
          label="Sterne"
          value={isLoading ? "—" : stats?.stars ?? 0}
          icon={Star}
          colorClass="from-amber-400 to-orange-500"
          hint={stats ? `Level ${stats.level.level}` : undefined}
        />
        <StatCard
          label="Punkte"
          value={
            isLoading
              ? "—"
              : `${stats?.points.earned ?? 0}`
          }
          icon={Trophy}
          colorClass="from-purple-500 to-pink-500"
          hint={
            stats && stats.points.max > 0
              ? `${pointsPercent}% von ${stats.points.max}`
              : "Keine Bewertungen"
          }
        />
      </div>

      {/* Grid: Level + Aufgaben */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          {stats && <LevelProgress stats={stats} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-500" />
                Wochenübersicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat
                  label="Nicht begonnen"
                  value={stats?.submissions.not_started ?? 0}
                  color="bg-slate-200 dark:bg-slate-700"
                />
                <MiniStat
                  label="In Arbeit"
                  value={stats?.submissions.in_progress ?? 0}
                  color="bg-amber-400"
                />
                <MiniStat
                  label="Abgegeben"
                  value={stats?.submissions.submitted ?? 0}
                  color="bg-brand-500"
                />
                <MiniStat
                  label="Bewertet"
                  value={stats?.submissions.graded ?? 0}
                  color="bg-accent-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Tagesziel */}
          <Card className="bg-gradient-to-br from-brand-500 to-accent-500 text-white border-0">
            <CardContent className="p-6">
              <Target className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Diese Woche</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.weekly.completed ?? 0}
              </p>
              <p className="text-xs opacity-75 mt-1">Aufgaben erledigt</p>
            </CardContent>
          </Card>

          {/* Badges */}
          <BadgeGrid badges={stats?.badges ?? []} max={6} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className={`h-1.5 rounded-full ${color}`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
