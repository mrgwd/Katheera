"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ContributeAzkar } from "@workspace/azkar/constants";
import {
  noisePhrases,
  openPrompts,
} from "@workspace/azkar/data/noise-phrases";
import type { RecordingPrompt } from "../../types";
import { useRecorder } from "../../hooks/useRecorder";
import { useUpload } from "../../hooks/useUpload";
import { cn } from "@workspace/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Check, LoaderCircle, Mic, Square } from "@workspace/ui/index";

interface RecordingLoopStepProps {
  stream: MediaStream;
  sessionId: string;
  onComplete: (totalSubmitted: number) => void;
}

const MAX_RETAKES = 2;
// Max recording duration per kind (ms)
const MAX_DURATION: Record<string, number> = {
  zikr: 4000,
  "noise-phrase": 8000,
  "open-prompt": 12000,
};

/** Unbiased in-place shuffle (Fisher–Yates) */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Build the full ordered prompt queue (deterministic — no randomness here) */
function buildPromptQueue(): RecordingPrompt[] {
  const prompts: RecordingPrompt[] = [];

  // Zikr prompts: 3 azkar × 6 tone variations
  for (const zikr of ContributeAzkar) {
    for (const sample of zikr.samples) {
      prompts.push({
        id: `zikr-${zikr.id}-${sample.sampleIndex}`,
        kind: "zikr",
        label: zikr.id,
        displayText: zikr.label,
        toneVariation: sample.toneVariation,
      });
    }
  }

  // Noise prompts: first N of each bank here; the client shuffles them
  // on mount (see effect below) so SSR and first paint always agree.
  const shuffledPhrases = [...noisePhrases].slice(0, 7);
  const shuffledOpen = [...openPrompts].slice(0, 3);

  // Interleave: roughly 1 open per 3 phrases
  const noisePrompts: RecordingPrompt[] = [];
  let phraseIdx = 0;
  let openIdx = 0;
  let slot = 0;
  while (phraseIdx < shuffledPhrases.length || openIdx < shuffledOpen.length) {
    if (slot % 4 === 3 && openIdx < shuffledOpen.length) {
      // Every 4th slot is an open prompt
      noisePrompts.push({
        id: `open-${openIdx}`,
        kind: "open-prompt",
        label: "unknown",
        displayText: shuffledOpen[openIdx]!.instruction,
      });
      openIdx++;
    } else if (phraseIdx < shuffledPhrases.length) {
      noisePrompts.push({
        id: `noise-${phraseIdx}`,
        kind: "noise-phrase",
        label: "noise",
        displayText: shuffledPhrases[phraseIdx]!.text,
      });
      phraseIdx++;
    }
    slot++;
  }

  return [...prompts, ...noisePrompts];
}

export function RecordingLoopStep({
  stream,
  sessionId,
  onComplete,
}: RecordingLoopStepProps) {
  const t = useTranslations("contribute.recording");
  const [prompts, setPrompts] = useState<RecordingPrompt[]>(() => buildPromptQueue());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [retakes, setRetakes] = useState(0);
  const [totalSubmitted, setTotalSubmitted] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [milestoneMsg, setMilestoneMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shuffle only the noise tail on the client. useState initializers run on
  // the server too — shuffling there would hydrate-mismatch on first paint.
  useEffect(() => {
    setPrompts((prev) => {
      const zikr = prev.filter((p) => p.kind === "zikr");
      const noise = shuffleArray(prev.filter((p) => p.kind !== "zikr"));
      return [...zikr, ...noise];
    });
  }, []);

  // Clear the advance timer on unmount so it can't fire after navigation.
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const recorder = useRecorder(stream);
  const { upload, status: uploadStatus, reset: resetUpload } = useUpload(sessionId);

  const currentPrompt = prompts[currentIndex];
  const total = prompts.length;
  const progressPct = (currentIndex / total) * 100;

  // Auto-stop recording after max duration
  useEffect(() => {
    if (recorder.isRecording && currentPrompt) {
      const maxMs = MAX_DURATION[currentPrompt.kind] ?? 6000;
      timerRef.current = setTimeout(() => {
        recorder.stopRecording();
      }, maxMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recorder.isRecording, currentPrompt, recorder.stopRecording]);

  const handleSubmit = useCallback(async () => {
    if (!recorder.audioBlob || !currentPrompt) return;

    const result = await upload({
      audioBlob: recorder.audioBlob,
      mimeType: recorder.mimeType,
      label: currentPrompt.label,
      prompt: currentPrompt.displayText,
      variation: currentPrompt.toneVariation?.id ?? "none",
    });

    if (result.status === "success") {
      const newTotal = totalSubmitted + 1;
      setTotalSubmitted(newTotal);
      setShowSuccess(true);

      // Milestone messages
      if (newTotal === Math.floor(total / 2)) {
        setMilestoneMsg(t("milestoneHalf"));
      } else if (newTotal === total - 5) {
        setMilestoneMsg(t("milestoneLast5"));
      } else if (newTotal === total) {
        setMilestoneMsg(t("milestoneAll"));
      }

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        resetUpload();
        recorder.reset();
        setRetakes(0);
        // Milestone was shown during the success flash — clear it so it
        // doesn't linger on the next prompt.
        setMilestoneMsg(null);
        if (currentIndex + 1 >= total) {
          onComplete(newTotal);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 800);
    }
  }, [
    recorder,
    currentPrompt,
    upload,
    totalSubmitted,
    total,
    currentIndex,
    onComplete,
    resetUpload,
    t,
  ]);

  const handleRetake = useCallback(() => {
    recorder.reset();
    resetUpload();
  }, [recorder, resetUpload]);

  const handleSkip = useCallback(() => {
    recorder.reset();
    resetUpload();
    setRetakes(0);
    if (currentIndex + 1 >= total) {
      onComplete(totalSubmitted);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [recorder, resetUpload, currentIndex, total, totalSubmitted, onComplete]);

  if (!currentPrompt) return null;

  const isZikr = currentPrompt.kind === "zikr";
  const hasRecording = !!recorder.audioBlob;
  const canRetake = retakes < MAX_RETAKES;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t("progress", { current: currentIndex + 1, total })}
          </span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Milestone toast */}
      {milestoneMsg && (
        <div className="animate-fade bg-brand/10 text-brand rounded-xl p-3 text-center text-sm font-medium opacity-0">
          {milestoneMsg}
        </div>
      )}

      {/* Prompt card */}
      <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        {/* Kind badge */}
        <div className="mb-4 flex items-center gap-2">
          {isZikr ? (
            <>
              <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-xs font-medium">
                {t("badgeZikr")}
              </span>
              {currentPrompt.toneVariation && (
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
                  {currentPrompt.toneVariation.emoji}{" "}
                  {currentPrompt.toneVariation.label}
                </span>
              )}
            </>
          ) : currentPrompt.kind === "open-prompt" ? (
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
              {t("badgeOpen")}
            </span>
          ) : (
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
              {t("badgeNoise")}
            </span>
          )}
        </div>

        {/* Main text */}
        <div className="mb-4 text-center">
          {isZikr ? (
            <p
              className="text-foreground text-4xl font-bold leading-relaxed"
              dir="rtl"
              lang="ar"
            >
              {currentPrompt.displayText}
            </p>
          ) : currentPrompt.kind === "open-prompt" ? (
            <p className="text-foreground text-lg leading-relaxed">
              {currentPrompt.displayText}
            </p>
          ) : (
            <p
              className="text-foreground text-2xl font-semibold leading-relaxed"
              dir="rtl"
              lang="ar"
            >
              {currentPrompt.displayText}
            </p>
          )}
        </div>

        {/* Tone instruction */}
        {currentPrompt.toneVariation && (
          <p className="text-muted-foreground text-center text-sm">
            💡 {currentPrompt.toneVariation.instruction}
          </p>
        )}

        {isZikr || currentPrompt.kind === "noise-phrase" ? (
          <p className="text-muted-foreground mt-1 text-center text-xs">
            {currentPrompt.kind === "noise-phrase"
              ? t("noiseHint")
              : ""}
          </p>
        ) : null}
      </div>

      {/* Recording UI */}
      <div className="flex flex-col items-center gap-4">
        {!hasRecording ? (
          /* Bespoke record fab (morphing size/gradient) — native button by
             design, only the glyphs come from the system (see F3). */
          <button
            onClick={
              recorder.isRecording ? recorder.stopRecording : recorder.startRecording
            }
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200",
              recorder.isRecording
                ? "bg-red-500 scale-110 shadow-lg shadow-red-500/30"
                : "bg-primary hover:bg-primary/90 hover:scale-105 shadow-lg",
            )}
          >
            {/* Pulse ring while recording */}
            {recorder.isRecording && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
            )}
            {recorder.isRecording ? (
              <Square className="h-5 w-5 text-white" fill="currentColor" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </button>
        ) : (
          /* Playback + decision UI */
          <div className="w-full space-y-3">
            {/* Success flash */}
            {showSuccess && (
              <div className="animate-fade flex items-center justify-center gap-2 text-green-600 opacity-0 dark:text-green-400">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">{t("success")}</span>
              </div>
            )}

            {/* Audio player */}
            {recorder.audioUrl && (
              <audio
                src={recorder.audioUrl}
                controls
                className="w-full rounded-lg"
              />
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {canRetake && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setRetakes((r) => r + 1);
                    handleRetake();
                  }}
                  disabled={uploadStatus === "uploading"}
                  className="h-auto! flex-1 rounded-xl! py-3! text-sm font-medium"
                >
                  {t("tryAgain", { remaining: MAX_RETAKES - retakes })}
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={uploadStatus === "uploading" || showSuccess}
                className="h-auto! flex-1 rounded-xl! py-3! text-sm font-semibold"
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {t("uploading")}
                  </>
                ) : (
                  <>
                    {t("useThis")} <Check className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {uploadStatus === "error" && (
              <p className="text-center text-xs text-red-500">
                {t("uploadError")}
              </p>
            )}
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          {recorder.isRecording
            ? t("hintRecording")
            : hasRecording
              ? t("hintRecorded")
              : t("hintIdle")}
        </p>

        {/* Skip */}
        {!recorder.isRecording && !showSuccess && (
          <Button
            variant="link"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
          >
            {t("skip")}
          </Button>
        )}
      </div>
    </div>
  );
}
