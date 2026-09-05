"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/lib/utils";
import { Check } from "@workspace/ui/index";
import type { ContributeStep } from "../types";
import { LandingStep } from "./steps/LandingStep";
import { ConsentStep } from "./steps/ConsentStep";
import { MicCheckStep } from "./steps/MicCheckStep";
import { RecordingLoopStep } from "./steps/RecordingLoopStep";
import { CompleteStep } from "./steps/CompleteStep";

const STEP_IDS: ContributeStep[] = [
  "landing",
  "consent",
  "mic-check",
  "recording",
  "complete",
];

// Progress indicator shows the middle three steps. Catalog keys differ from
// step ids in places (mic-check → micCheck), so the mapping is explicit —
// this also keeps t() fully typed.
const VISIBLE_STEPS = [
  { id: "consent", labelKey: "consent" },
  { id: "mic-check", labelKey: "micCheck" },
  { id: "recording", labelKey: "recording" },
] as const;

function newSessionId(): string {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    // Fall through to non-crypto fallback below.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function ContributePage() {
  const t = useTranslations("contribute.steps");
  const [step, setStep] = useState<ContributeStep>("landing");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [totalSubmitted, setTotalSubmitted] = useState(0);
  // Initializer runs on the server too, so it must not assume Web Crypto —
  // newSessionId falls back to Math.random. The id is data-only (never
  // rendered), so server/client divergence can't cause hydration mismatch.
  const [sessionId, setSessionId] = useState<string>(() => newSessionId());

  const handleMicReady = useCallback((s: MediaStream) => {
    setStream(s);
    setStep("recording");
  }, []);

  const handleComplete = useCallback(
    (count: number) => {
      setTotalSubmitted(count);
      // Stop the mic stream when done
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setStep("complete");
    },
    [stream],
  );

  const handleContributeAgain = useCallback(() => {
    // Generate a fresh session ID but skip consent
    setSessionId(newSessionId());
    setStep("mic-check");
  }, []);

  return (
    <div className="layout pt-32 pb-24">
      <div>
        {/* Step progress indicator */}
        {step !== "landing" && step !== "complete" && (
          <div className="mb-8 flex items-center justify-center gap-1 sm:gap-2">
            {VISIBLE_STEPS.map((s, i) => {
              const isActive = s.id === step;
              const isDone =
                STEP_IDS.findIndex((x) => x === step) >
                STEP_IDS.findIndex((x) => x === s.id);
              return (
                <div key={s.id} className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                        isDone || isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                        isActive && !isDone && "ring-primary/30 ring-4",
                      )}
                    >
                      {isDone ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden text-xs sm:inline",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {t(s.labelKey)}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={cn(
                        "h-px w-6 transition-all duration-300 sm:w-10",
                        isDone ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step content */}
        <div>
          {step === "landing" && (
            <LandingStep onProceed={() => setStep("consent")} />
          )}
          {step === "consent" && (
            <ConsentStep onConsent={() => setStep("mic-check")} />
          )}
          {step === "mic-check" && <MicCheckStep onReady={handleMicReady} />}
          {step === "recording" && stream && (
            <RecordingLoopStep
              stream={stream}
              sessionId={sessionId}
              onComplete={handleComplete}
            />
          )}
          {step === "complete" && (
            <CompleteStep
              totalSubmitted={totalSubmitted}
              onContributeAgain={handleContributeAgain}
            />
          )}
        </div>
      </div>
    </div>
  );
}
