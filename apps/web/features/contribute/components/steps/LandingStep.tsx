"use client";

import { ArrowRight } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Messages } from "@workspace/i18n/messages/en";

type LandingCard = Messages["contribute"]["landing"]["cards"][number];

const CARD_EMOJI = ["🌱", "🤲", "🕌"];

interface LandingStepProps {
  onProceed: () => void;
}

export function LandingStep({ onProceed }: LandingStepProps) {
  const t = useTranslations("contribute.landing");
  const cards = t.raw("cards") as LandingCard[];
  const todos = t.raw("todos") as string[];
  // Static Quranic source — correct in every locale. The translated gloss
  // is empty in ar, so the line hides there.
  const gloss = t("verseTranslation");
  return (
    <div className="animate-fade space-y-12 opacity-0">
      {/* Hero */}
      <div className="space-y-4 text-center">
        <div className="bg-brand/10 text-brand mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">
          🎙️
        </div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-base leading-relaxed">
          {t("heroBody")}
        </p>
      </div>

      {/* Privacy callout — critical distinction */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-5 dark:bg-amber-900/10">
        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 text-lg">⚠️</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">
              {t("warnTitle")}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("warnBody")}{" "}
              <Link
                href="/privacy#contributors"
                className="text-foreground underline underline-offset-4"
              >
                {t("warnLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Islamic motivation */}
      <div className="space-y-6">
        <div className="border-brand/20 bg-brand/5 rounded-xl border p-6 text-center">
          <p
            className="text-foreground mb-2 text-2xl leading-relaxed font-bold"
            dir="rtl"
            lang="ar"
          >
            يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا
          </p>
          {gloss && (
            <p className="text-muted-foreground text-sm">{gloss}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            {t("verseCite")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map(({ title, body }, i) => (
            <div key={title} className="bg-muted/50 rounded-xl p-5 text-center">
              <div className="mb-3 text-3xl">{CARD_EMOJI[i]}</div>
              <p className="text-foreground mb-2 text-sm font-semibold">
                {title}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What you'll do */}
      <div className="space-y-3">
        <p className="text-foreground text-sm font-semibold">
          {t("todoTitle")}
        </p>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {todos.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="bg-brand/70 mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button
        size="lg"
        onClick={onProceed}
        className="w-full hover:scale-[1.01] active:scale-[0.99]"
      >
        {t("cta")} <ArrowRight className="rtl:scale-x-[-1]" />
      </Button>
    </div>
  );
}
