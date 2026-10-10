"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n/use-translation";

export default function DemoPage() {
  const t = useT();

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Demo</h1>
        <p className="text-muted-foreground">
          Interaktive Demo folgt in Kürze.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.auth.backHome}
        </Link>
      </div>
    </div>
  );
}
