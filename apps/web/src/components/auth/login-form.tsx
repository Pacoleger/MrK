"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useT } from "@/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Status = "idle" | "submitting" | "success" | "error";

export function LoginForm() {
  const t = useT();
  const [showPassword, setShowPassword] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t.validation.emailRequired);
      return;
    }
    if (!password) {
      setError(t.validation.passwordRequired);
      return;
    }

    setStatus("submitting");

    // TODO (Step 4): POST /api/auth/login
    // Vorerst simulieren wir einen kurzen Delay
    await new Promise((r) => setTimeout(r, 800));

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
          <AlertDescription>{t.auth.loginSuccess}</AlertDescription>
        </Alert>
      )}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t.common.password}</Label>
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline"
            tabIndex={-1}
          >
            {t.login.forgotPassword}
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            {t.login.submit}
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.login.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-brand-600 hover:underline"
        >
          {t.login.registerLink}
        </Link>
      </p>
    </form>
  );
}
