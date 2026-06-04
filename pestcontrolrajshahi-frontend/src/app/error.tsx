"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container py-24 md:py-32 text-center">
      <div className="font-heading text-6xl md:text-7xl font-extrabold text-destructive mb-3">
        ⚠
      </div>
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-3">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-2">
        An unexpected error occurred. We've been notified.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-8 font-mono">
          Reference: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset} size="lg" className="rounded-full">
          Try again
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
