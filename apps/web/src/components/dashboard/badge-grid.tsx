"use client";

import * as Icons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeInfo } from "@/lib/stats-api";

function getIcon(name: string | null) {
  if (!name) return Award;
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const icon = (Icons as unknown as Record<string, unknown>)[key];
  return (typeof icon === "function" ? icon : Award) as typeof Award;
}

export function BadgeGrid({
  badges,
  max = 6,
  showEmpty = true,
}: {
  badges: BadgeInfo[];
  max?: number;
  showEmpty?: boolean;
}) {
  const visible = badges.slice(0, max);

  if (visible.length === 0 && !showEmpty) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Abzeichen
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {badges.length} gesammelt
        </span>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Noch keine Abzeichen. Sammle Sterne, um welche zu erhalten!
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {visible.map((badge) => {
              const Icon = getIcon(badge.icon);
              return (
                <div
                  key={badge.id}
                  title={badge.name_de}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl grid place-items-center text-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${badge.color ?? "#0aa4f0"}, ${badge.color ?? "#0ac3ad"})`,
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-medium leading-tight line-clamp-2">
                    {badge.name_de}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
