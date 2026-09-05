"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Check, Share2 } from "@workspace/ui/index";

interface CompleteStepProps {
  totalSubmitted: number;
  onContributeAgain: () => void;
}

export function CompleteStep({ totalSubmitted, onContributeAgain }: CompleteStepProps) {
  const t = useTranslations("contribute.complete");
  const [copied, setCopied] = useState(false);
  // Static Arabic hadith above needs no gloss in ar — hidden when empty.
  const translation = t("hadithTranslation");

  // Reset the "Copied!" confirmation after a beat.
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleShare = async () => {
    const text = t("shareText");
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        /* clipboard unavailable — leave the button as-is */
      }
    }
  };

  return (
    <div className="animate-fade space-y-10 py-4 text-center opacity-0">
      {/* Hero */}
      <div className="space-y-4">
        <div className="mx-auto text-6xl">🤍</div>
        <h2 className="text-foreground text-2xl font-bold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-base">
          {t("submittedPrefix")}{" "}
          <span className="text-foreground font-semibold">{t("count", { count: totalSubmitted })}</span>.{" "}
          {t("submittedNote")}
        </p>
      </div>

      {/* Impact */}
      <div className="border-brand/20 bg-brand/5 rounded-xl border p-6 text-start">
        <p className="text-foreground mb-3 text-sm font-semibold">
          {t("impactTitle")}
        </p>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {(t.raw("impacts") as string[]).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="bg-brand/70 mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Sadaqah jariyah reminder */}
      <div className="border-border rounded-xl border p-5">
        <p
          className="text-foreground mb-2 text-lg font-bold"
          dir="rtl"
          lang="ar"
        >
          مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ
        </p>
        <p className="text-muted-foreground text-sm">
          {translation && <>{translation} </>}
          {t("hadithCite")}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          size="lg"
          onClick={handleShare}
          className="h-auto! w-full rounded-xl! px-6! py-3! font-semibold hover:scale-[1.01] active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check /> {t("copied")}
            </>
          ) : (
            <>
              <Share2 /> {t("share")}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onContributeAgain}
          className="h-auto! w-full rounded-xl! px-6! py-3! text-sm font-medium"
        >
          {t("again")}
        </Button>
      </div>
    </div>
  );
}
