"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@workspace/ui/components/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="layout space-y-4 py-32 text-center">
      <h1 className="text-foreground text-3xl font-bold">
        Something went wrong
      </h1>
      <p className="text-muted-foreground text-sm">
        Please try again — if the problem persists, let us know.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Button variant="link" onClick={reset} className="underline">
          Try again
        </Button>
        <Link href="/" className="text-primary font-medium underline">
          Back home
        </Link>
      </div>
    </main>
  );
}
