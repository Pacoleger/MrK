"use client";

import * as React from "react";
import {
  Users,
  Search,
  Loader2,
  Shield,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi, type AdminUser } from "@/lib/admin-api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================
// Ausstehende Lehrer (Freischalten)
// ============================================================

function PendingTeachersSection() {
  const toast = useToast();
  const [teachers, setTeachers] = React.useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.pendingTeachers();
      setTeachers(data.users);
    } catch (err) {
      toast.error(
        "Fehler",
        err instanceof Error ? err.message : "Konnte nicht laden"
      );
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await adminApi.approveTeacher(id);
      toast.success("Freigeschaltet", "Der Lehrer kann sich jetzt einloggen.");
      await load();
    } catch (err) {
      toast.error(
        "Fehler",
        err instanceof Error ? err.message : "Freischaltung fehlgeschlagen"
      );
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-base">Ausstehende Lehrer</h2>
          <Badge variant="secondary" className="ml-auto">
            {teachers.length}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Diese Lehrer warten auf Freischaltung. Nach der Freigabe können sie
          sich einloggen.
        </p>

        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white text-xs font-bold shrink-0">
                {t.first_name?.charAt(0)}
                {t.last_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {t.first_name} {t.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t.email}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleApprove(t.id)}
                disabled={approvingId === t.id}
              >
                {approvingId === t.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                Freischalten
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Hauptseite
// ============================================================

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.users({
        q: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  React.useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await adminApi.updateUser(userId, { role });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.updateUser(userId, { isActive });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PendingTeachersSection />

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-500" />
          Benutzerverwaltung
        </h1>
        <p className="text-sm text-muted-foreground">
          {users.length} Benutzer
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Name oder E-Mail..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "Alle" },
            { value: "admin", label: "Admins" },
            { value: "teacher", label: "Lehrer" },
            { value: "student", label: "Schüler" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition",
                roleFilter === f.value
                  ? "bg-brand-500 text-white"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-900 dark:text-red-200">
          {error}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Keine Benutzer gefunden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === currentUser?.id}
              onUpdateRole={handleUpdateRole}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onUpdateRole,
  onToggleActive,
}: {
  user: AdminUser;
  isSelf: boolean;
  onUpdateRole: (id: string, role: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const initials = (user.first_name[0] + user.last_name[0]).toUpperCase();
  const isActive = user.is_active === 1;

  const roleIcon =
    user.role === "admin"
      ? Shield
      : user.role === "teacher"
      ? BookOpen
      : GraduationCap;

  const RoleIcon = roleIcon;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 grid place-items-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">
                {user.first_name} {user.last_name}
              </p>
              {!isActive && (
                <Badge variant="destructive" className="text-xs">
                  Deaktiviert
                </Badge>
              )}
              {isSelf && (
                <Badge variant="outline" className="text-xs">
                  Du
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <select
              value={user.role}
              onChange={(e) => onUpdateRole(user.id, e.target.value)}
              disabled={isSelf}
              className="flex-1 sm:flex-none h-10 rounded-lg border border-border bg-card px-3 text-sm disabled:opacity-50"
            >
              <option value="admin">Admin</option>
              <option value="teacher">Lehrer</option>
              <option value="student">Schüler</option>
            </select>

            <Badge variant="secondary" className="gap-1 shrink-0 hidden sm:flex">
              <RoleIcon className="h-3 w-3" />
              {user.role === "admin"
                ? "Admin"
                : user.role === "teacher"
                ? "Lehrer"
                : "Schüler"}
            </Badge>

            <button
              onClick={() => onToggleActive(user.id, !isActive)}
              disabled={isSelf}
              className={cn(
                "p-2 rounded-lg transition disabled:opacity-30 touch-target shrink-0",
                isActive
                  ? "text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-950/20"
                  : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
              title={isActive ? "Deaktivieren" : "Aktivieren"}
            >
              {isActive ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
