"use client";

import { Trophy, Star, Award, Target, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelProgress } from "@/components/dashboard/level-progress";
import { BadgeGrid } from "@/components/dashboard/badge-grid";
import { useStats } from "@/hooks/use-stats";

export default function ErfolgePage() {
  const { stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-20">
        Keine Statistiken verfügbar.
      </div>
    );
  }

  const totalBadges = stats.badges.length;
  const earnedPoints = stats.points.earned;
  const maxPoints = stats.points.max;
  const percent = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Erfolge</h1>
        <p className="text-sm text-muted-foreground">
          Dein Fortschritt und deine Auszeichnungen im Überblick.
        </p>
      </div>

      <LevelProgress stats={stats} />

      {/* Big Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat
          icon={Star}
          label="Sterne"
          value={stats.stars}
          color="from-amber-400 to-orange-500"
        />
        <BigStat
          icon={Trophy}
          label="Punkte"
          value={earnedPoints}
          color="from-purple-500 to-pink-500"
          hint={`${percent}%`}
        />
        <BigStat
          icon={Award}
          label="Abzeichen"
          value={totalBadges}
          color="from-brand-500 to-brand-700"
        />
        <BigStat
          icon={Target}
          label="Erledigt"
          value={stats.submissions.submitted + stats.submissions.graded}
          color="from-accent-500 to-accent-700"
        />
      </div>

      {/* Badges */}
      <BadgeGrid badges={stats.badges} max={24} />

      {/* Fortschritt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-500" />
            Aufgaben-Fortschritt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProgressRow
            label="Nicht begonnen"
            value={stats.submissions.not_started}
            total={stats.submissions.total}
            color="bg-slate-400"
          />
          <ProgressRow
            label="In Bearbeitung"
            value={stats.submissions.in_progress}
            total={stats.submissions.total}
            color="bg-amber-400"
          />
          <ProgressRow
            label="Abgegeben"
            value={stats.submissions.submitted}
            total={stats.submissions.total}
            color="bg-brand-500"
          />
          <ProgressRow
            label="Bewertet"
            value={stats.submissions.graded}
            total={stats.submissions.total}
            color="bg-accent-500"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  color,
  hint,
}: {
  icon: typeof Star;
  label: string;
  value: number;
  color: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} grid place-items-center text-white`}
        >
          <Icon size={20} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">
          {label}
          {hint && <span className="ml-1">· {hint}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value} / {total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
