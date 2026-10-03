"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { useT } from "@/i18n/use-translation";

export default function RegisterPage() {
  const t = useT();

  return (
    <AuthLayout title={t.register.title} subtitle={t.register.subtitle}>
      <RegisterForm />
    </AuthLayout>
  );
}
