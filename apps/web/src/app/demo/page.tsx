"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useT } from "@/i18n/use-translation";

function DemoContent() {
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

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
