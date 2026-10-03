"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { useT } from "@/i18n/use-translation";

export default function LoginPage() {
  const t = useT();

  return (
    <AuthLayout title={t.login.title} subtitle={t.login.subtitle}>
      <LoginForm />
    </AuthLayout>
  );
}
