"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ArrowRight } from "@workspace/ui/index";
import { Link } from "@/i18n/navigation";

interface ConsentStepProps {
  onConsent: () => void;
}

const CONSENT_IDS = ["upload", "anonymous", "policy"] as const;

export function ConsentStep({ onConsent }: ConsentStepProps) {
  const t = useTranslations("contribute.consent");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const labels: Record<(typeof CONSENT_IDS)[number], ReactNode> = {
    upload: t("itemUpload"),
    anonymous: t("itemAnon"),
    policy: t.rich("itemPolicy", {
      link: (chunks: ReactNode) => (
        <Link
          href="/privacy#contributors"
          target="_blank"
          className="text-foreground underline underline-offset-4"
        >
          {chunks}
        </Link>
      ),
    }),
  };
  const items = CONSENT_IDS.map((id) => ({ id, label: labels[id] }));

  const allChecked = items.every((item) => checked[item.id]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="animate-fade space-y-8 opacity-0">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 text-4xl">🔒</div>
        <h2 className="text-foreground text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("body")}</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            aria-pressed={!!checked[item.id]}
            className={cn(
              "border-border hover:border-primary/50 flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-start transition-all duration-150",
              checked[item.id]
                ? "border-primary/40 bg-primary/5"
                : "bg-muted/30",
            )}
          >
            {/* Visual checkbox only — the outer button owns the toggle, so
                this is hidden from assistive tech (see F2). */}
            <Checkbox
              checked={!!checked[item.id]}
              onCheckedChange={() => toggle(item.id)}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none mt-0.5 size-5"
            />
            <p className="text-foreground text-sm leading-relaxed">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onConsent}
        disabled={!allChecked}
        className="w-full font-semibold hover:scale-[1.01] active:scale-[0.99]"
      >
        {t("cta")} <ArrowRight className="rtl:scale-x-[-1]" />
      </Button>

      <p className="text-muted-foreground text-center text-xs">{t("foot")}</p>
    </div>
  );
}
