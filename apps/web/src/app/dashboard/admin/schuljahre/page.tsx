"use client";

import * as React from "react";
import { Calendar, Plus, Loader2, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi, type SchoolYear } from "@/lib/admin-api";

export default function AdminSchoolYearsPage() {
  const [years, setYears] = React.useState<SchoolYear[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.schoolYears();
      setYears(data.schoolYears);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-500" />
            Schuljahre
          </h1>
          <p className="text-sm text-muted-foreground">
            {years.length} Schuljahre
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Neues Schuljahr
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {years.map((y) => (
            <Card key={y.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center text-white shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{y.name}</p>
                    {y.is_active === 1 && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Aktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(y.start_date).toLocaleDateString("de-DE")} –{" "}
                    {new Date(y.end_date).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {y.class_count} Klassen
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateYearDialog
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateYearDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = React.useState(
    `${currentYear}/${currentYear + 1}`
  );
  const [startDate, setStartDate] = React.useState(
    `${currentYear}-08-01`
  );
  const [endDate, setEndDate] = React.useState(
    `${currentYear + 1}-07-31`
  );
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Name ist erforderlich");
    setIsSubmitting(true);
    try {
      await adminApi.createSchoolYear({
        name: name.trim(),
        startDate,
        endDate,
        isActive,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Neues Schuljahr</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ende</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Als aktives Schuljahr setzen
            </Label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Erstellen...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
