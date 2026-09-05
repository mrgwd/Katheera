"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  COOLDOWN_MS,
  SAME_ZIKR_COOLDOWN_MS,
} from "@workspace/audio-processing/constants";
import {
  processAudio,
  processClassifierResult,
  resampleAudio,
} from "@workspace/audio-processing/utils";
import { usePersistentMicrophone } from "./usePersistentMicrophone";
import { Detections } from "@workspace/model/types";
import {
  ensureDailyReset,
  getCounts,
  incrementCount,
  setCount,
} from "@workspace/lib/zikrStorage";
import { useModelLoader } from "./useModelLoader";
import { buildInitialDetections } from "@workspace/azkar/helpers";
import { getAzkarKeys } from "@workspace/azkar/constants";
import { useSettings } from "@workspace/ui/hooks/useSettings";

export function useKeywordSpotting() {
  const {
    classifier,
    isModelLoaded,
    isModelLoading,
    error: modelError,
  } = useModelLoader();

  const { settings } = useSettings();

  const initialDetections = useMemo(
    () => buildInitialDetections() as Detections,
    [],
  );

  const [detections, setDetections] = useState<Detections>(initialDetections);
  const [idleTickCount, setIdleTickCount] = useState(0);

  const activeZikrRef = useRef<{ label: string | null; time: number }>({
    label: null,
    time: 0,
  });
  const keys = useMemo(() => getAzkarKeys(), []);

  // ── Hydrate counts from storage on mount ──────────────────────────────
  useEffect(() => {
    ensureDailyReset(keys as unknown as string[]);
    const stored = getCounts(keys as unknown as string[]);
    setDetections((prev) => {
      const rehydrated = { ...prev };
      keys.forEach((k) => {
        rehydrated[k] = { ...prev[k]!, count: stored[k] ?? prev[k]!.count };
      });
      return rehydrated;
    });
  }, [keys]);

  // ── Audio processing callback ──────────────────────────────────────────
  const handleAudioData = useCallback(
    (audioData: Float32Array, sampleRate: number) => {
      const currentClassifier = classifier;
      if (!currentClassifier) return;

      // Read live settings values at execution time via ref-like closure —
      // settings is stable (object reference changes on update) so useCallback
      // correctly tracks it as a dependency.
      const { confidenceThreshold, targetRms, minRms } = settings;

      try {
        const resampledAudio = resampleAudio(audioData, sampleRate);

        // Normalise using live targetRms / minRms instead of compile-time constants
        const scaledAudioData = processAudio(resampledAudio, targetRms, minRms);
        if (!scaledAudioData) return;

        const result = currentClassifier.classify(scaledAudioData, true);
        if (!result?.results) return;

        // Dispatch debug info (dev only — the Array copies are expensive
        // and no debugger listens in production).
        if (
          process.env.NODE_ENV === "development" &&
          typeof window !== "undefined"
        ) {
          window.dispatchEvent(
            new CustomEvent("debugAudioChunk", {
              detail: {
                rawAudio: Array.from(resampledAudio),
                processedAudio: Array.from(scaledAudioData),
                results: result.results,
              },
            }),
          );
        }

        // Single shared detection policy with the extension
        // (see processClassifierResult in audio-processing/utils).
        const detection = processClassifierResult(result, confidenceThreshold);
        if (detection === null) return;
        const { label: detectedLabel, confidence: maxConfidence } = detection;

        const isNoise =
          detectedLabel === "noise" || detectedLabel === "unknown";

        if (isNoise) {
          setIdleTickCount((prev) => prev + 1);
          return;
        }

        // ── Valid zikr detected ──────────────────────────────────────
        setIdleTickCount(0);

        const now = Date.now();
        const active = activeZikrRef.current;

        if (active.label === detectedLabel) {
          if (now - active.time < SAME_ZIKR_COOLDOWN_MS) return;
        } else if (active.label !== null) {
          if (now - active.time < COOLDOWN_MS) return;
        }

        activeZikrRef.current = { label: detectedLabel, time: now };

        setDetections((prev) => {
          const current = prev[detectedLabel!];
          if (!current) return prev;
          return {
            ...prev,
            [detectedLabel!]: {
              ...current,
              count: current.count + 1,
              lastAccuracy: Math.round(maxConfidence * 100),
            },
          };
        });

        if (keys.includes(detectedLabel)) {
          incrementCount(detectedLabel);
        }
      } catch (err) {
        console.error("Audio processing error:", err);
      }
    },
    [classifier, keys, settings],
  );

  const {
    isListening,
    error: micError,
    startListening,
    stopListening,
  } = usePersistentMicrophone({
    onAudioData: handleAudioData,
    workletUrl: "/worklets/zikr-audio-processor.worklet.js",
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
