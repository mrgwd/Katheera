/**
 * useKeywordSpotting — orchestrates mic + model into zikr detection.
 *
 * Key fix: `handleAudioData` no longer lists `detections` as a dependency.
 * Instead, it uses `setDetections` with a functional updater (prev => next),
 * which always has access to the latest state without needing to close over it.
 * This prevents the callback — and the entire audio pipeline wired to it —
 * from being recreated on every count increment.
 */

"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  INPUT_GAIN,
  COOLDOWN_MS,
  CONFIDENCE_THRESHOLD,
} from "@workspace/audio-processing/constants";
import { processAudio, resampleAudio } from "@workspace/audio-processing/utils";
import { useMicrophone } from "./useMicrophone";
import { type Detections } from "@workspace/model/types";
import {
  ensureDailyReset,
  getCounts,
  incrementCount,
  setCount,
} from "./zikrStorage";

import { useModelLoader } from "@workspace/model/hooks/useModelLoader";
import { buildInitialDetections } from "@workspace/azkar/helpers";
import { getAzkarKeys } from "@workspace/azkar/constants";

export function useKeywordSpotting({ workletUrl }: { workletUrl: string }) {
  const {
    classifier,
    isModelLoaded,
    isModelLoading,
    error: modelError,
  } = useModelLoader();

  const initialDetections = useMemo(
    () => buildInitialDetections() as Detections,
    [],
  );

  const [detections, setDetections] = useState<Detections>(initialDetections);

  /**
   * Counts consecutive "non-zikr" audio windows.
   * Renamed from lastZikrTime → idleTickCount to reflect what it actually is.
   * Reset to 0 on any valid zikr detection.
   * Incremented on every "noise" or "unknown" classification.
   */
  const [idleTickCount, setIdleTickCount] = useState(0);

  const lastDetectionRef = useRef<Record<string, number>>({});
  const keys = useMemo(() => getAzkarKeys(), []);

  // ── Hydrate counts from storage on mount ──────────────────────────────
  useEffect(() => {
    ensureDailyReset(keys as unknown as string[]);
    const stored = getCounts(keys as unknown as string[]);
    setDetections((prev) => ({
      ...prev,
      hamd: { ...prev.hamd!, count: stored.hamd ?? prev.hamd!.count },
      subhan: { ...prev.subhan!, count: stored.subhan ?? prev.subhan!.count },
      akbr: { ...prev.akbr!, count: stored.akbr ?? prev.akbr!.count },
    }));
  }, [keys]);

  // ── Audio processing callback ──────────────────────────────────────────
  const handleAudioData = useCallback(
    (audioData: Float32Array, sampleRate: number) => {
      // Read classifier from the singleton directly — avoids it being
      // a dep while still always using the latest instance
      const currentClassifier = classifier;
      if (!currentClassifier) return;

      try {
        const resampledAudio = resampleAudio(audioData, sampleRate);
        const scaledAudioData = processAudio(resampledAudio, INPUT_GAIN);
        if (!scaledAudioData) return;

        const result = currentClassifier.classify(scaledAudioData, true);
        if (!result?.results) return;

        let maxConfidence = 0.4;
        let detectedLabel: string | null = null;

        result.results.forEach((r) => {
          if (r.value > maxConfidence && r.value > CONFIDENCE_THRESHOLD) {
            maxConfidence = r.value;
            detectedLabel = r.label;
          }
        });

        if (detectedLabel === null) return;

        const isNoise =
          detectedLabel === "noise" || detectedLabel === "unknown";

        if (isNoise) {
          setIdleTickCount((prev) => prev + 1);
          return;
        }

        // ── Valid zikr detected ──────────────────────────────────────
        setIdleTickCount(0);

        const now = Date.now();
        const last = lastDetectionRef.current[detectedLabel] ?? 0;
        const shouldCount = now - last > COOLDOWN_MS;

        // Functional updater — no need for detections in dep array
        setDetections((prev) => {
          const current = prev[detectedLabel!];
          if (!current) return prev;
          return {
            ...prev,
            [detectedLabel!]: {
              ...current,
              count: current.count + (shouldCount ? 1 : 0),
              lastAccuracy: Math.round(maxConfidence * 100),
            },
          };
        });

        if (shouldCount) {
          lastDetectionRef.current[detectedLabel] = now;
          if (keys.includes(detectedLabel)) {
            incrementCount(detectedLabel);
          }
        }
      } catch (err) {
        console.error("Audio processing error:", err);
      }
    },
    // classifier is the only real dep here — keys is stable (memoized)
    [classifier, keys],
  );

  const {
    isListening,
    error: micError,
    startListening,
    stopListening,
  } = useMicrophone({
    onAudioData: handleAudioData,
    workletUrl: workletUrl,
  });

  // ── Actions ────────────────────────────────────────────────────────────
  const resetCounters = useCallback(() => {
    setDetections((prev) => {
      const next: Detections = {} as Detections;
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = { ...v, count: 0, lastAccuracy: 0 };
      });
      return next;
    });
    setIdleTickCount(0);
    keys.forEach((k) => setCount(k, 0));
  }, [keys]);

  const handleStartListening = useCallback(() => {
    if (!isModelLoaded) return;
    startListening();
  }, [isModelLoaded, startListening]);

  const handleToggleListening = useCallback(() => {
    if (isListening) stopListening();
    else handleStartListening();
  }, [isListening, stopListening, handleStartListening]);

  return {
    isListening,
    isModelLoaded,
    isModelLoading,
    error: modelError || micError,
    detections,
    idleTickCount,
    startListening: handleStartListening,
    stopListening,
    toggleListening: handleToggleListening,
    resetCounters,
  } as const;
}
