"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentStats } from "@/lib/stats-api";

const LEVEL_COLORS: Record<number, string> = {
  1: "from-slate-400 to-slate-600",
  2: "from-brand-400 to-brand-600",
  3: "from-accent-400 to-accent-600",
  4: "from-purple-400 to-purple-600",
  5: "from-amber-400 to-orange-500",
};

export function LevelProgress({ stats }: { stats: StudentStats }) {
  const { level, stars } = stats;

  const progressPct = React.useMemo(() => {
    if (!level.nextLevelStars) return 100;
    const range = level.nextLevelStars - level.minStars;
    const current = stars - level.minStars;
    return Math.max(0, Math.min(100, (current / range) * 100));
  }, [stars, level]);

  const remaining = level.nextLevelStars ? level.nextLevelStars - stars : 0;
  const colorClass = LEVEL_COLORS[level.level] ?? LEVEL_COLORS[1];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl bg-gradient-to-br grid place-items-center text-white font-bold text-lg shadow-lg",
                colorClass
              )}
            >
              {level.level}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Level {level.level}
              </p>
              <p className="font-semibold text-lg">{level.name}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold flex items-center gap-1 justify-end">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {stars}
            </p>
            <p className="text-xs text-muted-foreground">Sterne</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full bg-gradient-to-r transition-all", colorClass)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {level.nextLevelStars ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Noch {remaining} Sterne bis Level {level.level + 1}
              </span>
              <span>
                {stars} / {level.nextLevelStars}
              </span>
            </div>
          ) : (
            <p className="text-xs text-center text-amber-600 font-medium">
              🏆 Höchstes Level erreicht!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
