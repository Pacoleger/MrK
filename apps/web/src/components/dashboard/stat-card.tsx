"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  trend?: string;
  hint?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  trend,
  hint,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-3xl font-bold mt-1 truncate">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {trend}
              </p>
            )}
            {hint && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {hint}
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br grid place-items-center text-white shrink-0",
              colorClass
            )}
          >
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
