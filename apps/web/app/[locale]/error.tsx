"use client";

import { Link } from "@/i18n/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.error");
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="layout space-y-4 py-32 text-center">
      <h1 className="text-foreground text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("body")}</p>
      <div className="flex items-center justify-center gap-4">
        <Button variant="link" onClick={reset} className="underline">
          {t("retry")}
        </Button>
        <Link href="/" className="text-primary font-medium underline">
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
