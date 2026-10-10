"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { useT } from "@/i18n/use-translation";

function LoginContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <AuthLayout title={t.login.title} subtitle={t.login.subtitle}>
      {reason === "idle_timeout" && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <strong>Automatisch abgemeldet.</strong> Du warst zu lange inaktiv.
            Bitte melde dich erneut an.
          </AlertDescription>
        </Alert>
      )}

      {reason === "session_expired" && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <strong>Deine Sitzung ist abgelaufen.</strong> Bitte melde dich
            erneut an.
          </AlertDescription>
        </Alert>
      )}

      <LoginForm />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
