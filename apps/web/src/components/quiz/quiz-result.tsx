"use client";

import Link from "next/link";
import {
  Trophy,
  Star,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuizResult({
  score,
  maxScore,
  percentage,
  starsEarned,
  timeSpentSec,
}: {
  score: number;
  maxScore: number;
  percentage: number;
  starsEarned: number;
  timeSpentSec: number;
}) {
  const grade =
    percentage >= 90
      ? { label: "Sehr gut", color: "from-accent-500 to-accent-700", icon: Trophy }
      : percentage >= 75
      ? { label: "Gut", color: "from-brand-500 to-brand-700", icon: CheckCircle2 }
      : percentage >= 50
      ? { label: "Bestanden", color: "from-amber-400 to-amber-600", icon: Target }
      : { label: "Nicht bestanden", color: "from-red-400 to-red-600", icon: XCircle };

  const Icon = grade.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/quiz"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Quizzen
      </Link>

      <Card className={cn("bg-gradient-to-br text-white border-0", grade.color)}>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur grid place-items-center mx-auto">
            <Icon size={36} />
          </div>
          <h1 className="text-3xl font-bold">{percentage}%</h1>
          <p className="text-lg opacity-90">{grade.label}</p>
          <p className="text-sm opacity-75">
            {score} von {maxScore} Punkten
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-amber-500">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Sterne verdient</span>
            </div>
            <p className="text-2xl font-bold">+{starsEarned}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-brand-500">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Zeit</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.floor(timeSpentSec / 60)}m {timeSpentSec % 60}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/dashboard/quiz">
            <ArrowLeft className="h-4 w-4" />
            Alle Quizze
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href="/dashboard">
            <Trophy className="h-4 w-4" />
            Zum Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
