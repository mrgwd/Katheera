"use client";

import { useCallback, useState } from "react";
import { cn } from "@workspace/lib/utils";
import { Check } from "@workspace/ui/index";
import type { ContributeStep } from "../types";
import { LandingStep } from "./steps/LandingStep";
import { ConsentStep } from "./steps/ConsentStep";
import { MicCheckStep } from "./steps/MicCheckStep";
import { RecordingLoopStep } from "./steps/RecordingLoopStep";
import { CompleteStep } from "./steps/CompleteStep";

const STEP_LABELS: { id: ContributeStep; label: string }[] = [
  { id: "landing", label: "About" },
  { id: "consent", label: "Consent" },
  { id: "mic-check", label: "Mic check" },
  { id: "recording", label: "Recording" },
  { id: "complete", label: "Done" },
];

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
            {STEP_LABELS.filter(
              (s) => s.id !== "landing" && s.id !== "complete",
            ).map((s, i) => {
              const isActive = s.id === step;
              const isDone =
                STEP_LABELS.findIndex((x) => x.id === step) >
                STEP_LABELS.findIndex((x) => x.id === s.id);
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
                      {s.label}
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
