"use client";

import * as React from "react";
import { GraduationCap, Trophy, Star, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { classesApi, type ClassInfo, type RankingEntry } from "@/lib/stats-api";
import { cn } from "@/lib/utils";

export default function KlassenPage() {
  const [classes, setClasses] = React.useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
  const [ranking, setRanking] = React.useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingRanking, setLoadingRanking] = React.useState(false);

  React.useEffect(() => {
    classesApi
      .list()
      .then((data) => {
        setClasses(data.classes);
        if (data.classes.length > 0) {
          setSelectedClass(data.classes[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    if (!selectedClass) return;
    setLoadingRanking(true);
    classesApi
      .ranking(selectedClass)
      .then((data) => setRanking(data.ranking))
      .catch(console.error)
      .finally(() => setLoadingRanking(false));
  }, [selectedClass]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Klassen</h1>
          <p className="text-sm text-muted-foreground">
            Deine Klassen und Ranglisten.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Keine Klassen</p>
            <p className="text-sm text-muted-foreground mt-1">
              Du bist noch keiner Klasse zugewiesen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Klassen</h1>
        <p className="text-sm text-muted-foreground">
          Ranglisten und Fortschritt deiner Klassen.
        </p>
      </div>

      {/* Klassen-Auswahl */}
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
              selectedClass === c.id
                ? "bg-brand-500 text-white"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            <GraduationCap className="h-4 w-4" />
            {c.name}
          </button>
        ))}
      </div>

      {/* Rangliste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Rangliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRanking ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ranking.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Noch keine Schüler in dieser Klasse.
            </p>
          ) : (
            <div className="space-y-2">
              {ranking.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-xl border border-border",
                    idx === 0 && "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20"
                  )}
                >
                  {/* Rang */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full grid place-items-center font-bold text-sm shrink-0",
                      idx === 0
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        : idx === 1
                        ? "bg-slate-300 dark:bg-slate-600 text-foreground"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.first_name} {entry.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.completed} Aufgaben erledigt
                    </p>
                  </div>

                  {/* Sterne */}
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {entry.total_stars}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
