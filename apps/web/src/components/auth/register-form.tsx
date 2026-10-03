"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import { useT } from "@/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Role } from "@mrk/shared";

type Status = "idle" | "submitting" | "success" | "error";

const roleOptions: { value: Role; icon: typeof GraduationCap }[] = [
  { value: "student", icon: GraduationCap },
  { value: "teacher", icon: BookOpen },
];

export function RegisterForm() {
  const t = useT();
  const [showPassword, setShowPassword] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("student");

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

    setStatus("submitting");

    // TODO (Step 4): POST /api/auth/register
    await new Promise((r) => setTimeout(r, 900));

    setStatus("success");
    // TODO (Step 4): Redirect zum Dashboard + JWT speichern
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert variant="success">
          <AlertDescription>{t.auth.registerSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t.common.firstName}</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={status === "submitting"}
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
            disabled={status === "submitting"}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t.common.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@schule.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          required
        />
      </div>

      {/* Role */}
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
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition",
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                    : "border-border hover:bg-muted"
                )}
                disabled={status === "submitting"}
              >
                <Icon className="h-4 w-4" />
                {t.roles[value]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">{t.common.password}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "submitting"}
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
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t.register.passwordHint}
        </p>
      </div>

      {/* Confirm password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t.common.confirmPassword}</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={status === "submitting"}
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting" || status === "success"}
        className="w-full"
      >
        {status === "submitting" ? (
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
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:underline"
        >
          {t.register.loginLink}
        </Link>
      </p>
    </form>
  );
}
