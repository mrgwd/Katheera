"use client";

import { ArrowRight } from "@workspace/ui/index";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

interface LandingStepProps {
  onProceed: () => void;
}

export function LandingStep({ onProceed }: LandingStepProps) {
  return (
    <div className="animate-fade space-y-12 opacity-0">
      {/* Hero */}
      <div className="space-y-4 text-center">
        <div className="bg-brand/10 text-brand mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">
          🎙️
        </div>
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          Help Katheera hear every voice
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-base leading-relaxed">
          Katheera's AI model was trained on a limited set of voices. To
          recognize azkar accurately — across accents, microphones, and
          environments — it needs to hear from people like you.
        </p>
      </div>

      {/* Privacy callout — critical distinction */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-5 dark:bg-amber-900/10">
        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 text-lg">⚠️</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-semibold">
              This page uploads your recordings
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Unlike the Katheera extension — which processes audio entirely
              on-device and never sends anything to a server — this contribution
              page intentionally uploads your voice recordings to train the AI
              model. This is strictly opt-in.{" "}
              <Link
                href="/privacy#contributors"
                className="text-foreground underline underline-offset-4"
              >
                Read the full Contributor Privacy Notice →
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
          <p className="text-muted-foreground text-sm">
            "O you who have believed, remember Allah with much remembrance."
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            — Surah Al-Ahzab 33:41
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              emoji: "🌱",
              title: "Sadaqah Jariyah",
              body: "Every person who uses Katheera to remember Allah — their extra dhikr flows back as ongoing reward to those who made it possible.",
            },
            {
              emoji: "🤲",
              title: "Sharing Good",
              body: '"Whoever points to something good gets a reward similar to the one who does it." — The Prophet ﷺ',
            },
            {
              emoji: "🕌",
              title: "Katheeran",
              body: "The name Katheera (كثيرًا) comes from Allah's command to make dhikr abundant. Your voice helps more people do exactly that.",
            },
          ].map(({ emoji, title, body }) => (
            <div key={title} className="bg-muted/50 rounded-xl p-5 text-center">
              <div className="mb-3 text-3xl">{emoji}</div>
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
          What this takes (~5 minutes)
        </p>
        <ul className="text-muted-foreground space-y-2 text-sm">
          {[
            "Say each of the three main azkar 6 times — each time in a slightly different way (quiet, fast, slow…)",
            "Read ~10 everyday Arabic phrases to help the model learn what non-zikr speech sounds like",
            "Each recording is short (~2 seconds), and you can replay and re-record before submitting",
          ].map((item) => (
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
        I want to contribute <ArrowRight />
      </Button>
    </div>
  );
}
