"use client";

import {
  BookOpen,
  Star,
  Trophy,
  Clock,
  TrendingUp,
  CheckCircle2,
  CircleDot,
  Award,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// ============================================================
// Mock-Daten (später aus API)
// ============================================================

const stats = [
  {
    label: "Offene Aufgaben",
    value: "8",
    icon: BookOpen,
    color: "from-brand-500 to-brand-600",
    trend: "+3 diese Woche",
  },
  {
    label: "Erledigt",
    value: "24",
    icon: CheckCircle2,
    color: "from-accent-500 to-accent-600",
    trend: "12 diese Woche",
  },
  {
    label: "Sterne",
    value: "147",
    icon: Star,
    color: "from-amber-400 to-orange-500",
    trend: "+18 diese Woche",
  },
  {
    label: "Level",
    value: "3",
    icon: Trophy,
    color: "from-purple-500 to-pink-500",
    trend: "Forscher",
  },
];

const upcomingAssignments = [
  {
    id: "1",
    subject: "Mathematik",
    title: "Quadratische Funktionen",
    dueDate: "Morgen, 23:59",
    status: "in_progress",
    color: "bg-brand-500",
  },
  {
    id: "2",
    subject: "Physik",
    title: "Newtonsche Gesetze – Aufgabenblatt 4",
    dueDate: "Übermorgen, 18:00",
    status: "not_started",
    color: "bg-accent-500",
  },
  {
    id: "3",
    subject: "Chemie",
    title: "Periodensystem Quiz",
    dueDate: "Freitag, 12:00",
    status: "not_started",
    color: "bg-brand-700",
  },
];

const recentBadges = [
  { code: "first_assignment", label: "Erste Aufgabe", icon: Award,  color: "from-blue-500 to-blue-600" },
  { code: "ten_stars",        label: "10 Sterne",     icon: Star,   color: "from-amber-500 to-orange-500" },
  { code: "always_on_time",   label: "Pünktlich",     icon: Clock,  color: "from-green-500 to-emerald-600" },
];

const statusLabel: Record<string, string> = {
  not_started: "Nicht begonnen",
  in_progress: "In Bearbeitung",
  submitted: "Abgegeben",
  graded: "Bewertet",
};

export default function DashboardPage() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier ist deine Übersicht für heute.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, trend }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} grid place-items-center text-white shrink-0`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid: Aufgaben + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aufgaben */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Anstehende Aufgaben</CardTitle>
            <Badge variant="outline">3 offen</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/40 transition cursor-pointer"
              >
                <div className={`w-1.5 self-stretch rounded-full ${a.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{a.subject}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.dueDate}
                    </span>
                  </div>
                  <p className="font-medium mt-1 truncate">{a.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {a.status === "in_progress" ? (
                    <Badge variant="secondary" className="gap-1">
                      <CircleDot className="h-3 w-3" />
                      {statusLabel[a.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{statusLabel[a.status]}</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar-Widgets */}
        <div className="space-y-6">
          {/* Wochenfortschritt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-500" />
                Wochenfortschritt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aufgaben</span>
                  <span className="font-medium">4 / 6</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 w-2/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sterne-Ziel</span>
                  <span className="font-medium">18 / 30</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-[60%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Erfolge */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Letzte Erfolge
              </CardTitle>
              <button className="text-xs text-brand-600 hover:underline">
                Alle →
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentBadges.map(({ code, label, icon: Icon, color }) => (
                <div key={code} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} grid place-items-center text-white shrink-0`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      Gerade erhalten
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tagesziel */}
          <Card className="bg-gradient-to-br from-brand-500 to-accent-500 text-white border-0">
            <CardContent className="p-6">
              <Target className="h-6 w-6 mb-2" />
              <p className="text-sm opacity-90">Tagesziel</p>
              <p className="text-2xl font-bold mt-1">2 Aufgaben</p>
              <p className="text-xs opacity-75 mt-2">
                Noch 1 Aufgabe bis zum Ziel
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
