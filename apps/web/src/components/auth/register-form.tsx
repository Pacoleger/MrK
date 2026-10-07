"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import { useT } from "@/i18n/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ClassOption {
  id: string;
  name: string;
  grade_level: number;
}

const roleOptions: { value: "student" | "teacher"; icon: typeof GraduationCap }[] = [
  { value: "student", icon: GraduationCap },
  { value: "teacher", icon: BookOpen },
];

export function RegisterForm() {
  const t = useT();
  const router = useRouter();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<"student" | "teacher">("student");
  const [classId, setClassId] = React.useState<string>("");
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);

  // Lade Klassen für Dropdown
  React.useEffect(() => {
    if (role !== "student") {
      setClassId("");
      return;
    }

    setLoadingClasses(true);
    apiGet<{ classes: ClassOption[] }>("/api/classes/public")
      .then((data) => {
        setClasses(data.classes);
        if (data.classes.length > 0) {
          setClassId(data.classes[0].id);
        }
      })
      .catch((err) => {
        console.error("Klassen laden fehlgeschlagen:", err);
      })
      .finally(() => setLoadingClasses(false));
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) return setError(t.validation.firstNameRequired);
    if (!lastName.trim()) return setError(t.validation.lastNameRequired);
    if (!email) return setError(t.validation.emailRequired);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t.validation.emailInvalid);
    if (!password) return setError(t.validation.passwordRequired);
    if (password.length < 8) return setError(t.validation.passwordTooShort);
    if (password !== confirmPassword) return setError(t.validation.passwordMismatch);

    setIsSubmitting(true);

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        role,
        classId: role === "student" && classId ? classId : undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "EMAIL_IN_USE":
            setError(t.auth.emailInUse);
            break;
          case "EMAIL_INVALID":
            setError(t.validation.emailInvalid);
            break;
          case "PASSWORD_TOO_SHORT":
            setError(t.validation.passwordTooShort);
            break;
          default:
            setError(err.message || t.auth.genericError);
        }
      } else {
        setError(t.auth.genericError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t.common.firstName}</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t.common.lastName}</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.common.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@schule.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Rolle */}
      <div className="space-y-2">
        <Label>{t.register.roleHint}</Label>
        <div className="grid grid-cols-2 gap-2">
          {roleOptions.map(({ value, icon: Icon }) => {
            const active = role === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.roles[value]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Klassen-Auswahl (nur für Schüler) */}
      {role === "student" && (
        <div className="space-y-2">
          <Label htmlFor="classId">Klasse</Label>
          {loadingClasses ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade Klassen...
            </div>
          ) : (
            <select
              id="classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <option value="">Keine Klasse (später zuweisen)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Klasse {c.grade_level})
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted-foreground">
            Wähle deine Klasse, damit du direkt Aufgaben erhältst.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t.common.password}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t.register.passwordHint}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t.common.confirmPassword}</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.common.loading}
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            {t.register.submit}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground leading-relaxed">
        {t.auth.termsNote}
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t.register.hasAccount}{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          {t.register.loginLink}
        </Link>
      </p>
    </form>
  );
}
