"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function QuizDetailInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Quiz-Detail für ID: <code>{id}</code>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Wird in Welle 7a-3 implementiert.
        </p>
      </div>
    </div>
  );
}

export default function QuizDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <QuizDetailInner />
    </Suspense>
  );
}
