/**
 * apps/web/hooks/usePersistentMic.ts
 *
 * Web app implementation of the PersistentMic contract.
 *
 * State source: useKeywordSpotting (MicService + localStorage)
 * This is a thin adapter that maps useKeywordSpotting's output
 * to the shared PersistentMicState shape.
 */

"use client";

import { useMemo } from "react";
import type { UsePersistentMicResult } from "@workspace/lib/usePersistentMic.types";
import { useKeywordSpotting } from "./useKeywordSpotting";

export function usePersistentMic(): UsePersistentMicResult {
  const {
    isListening,
    isModelLoaded,
    isModelLoading,
    detections,
    idleTickCount: _idle,
    toggleListening,
    resetCounters,
    error,
  } = useKeywordSpotting();

  // Derive activeZikr: the zikr with the most recent lastAccuracy update.
  // useKeywordSpotting already sets lastAccuracy on each detection.
  const activeZikr = useMemo(() => {
    if (!isListening) return null;
    const entries = Object.entries(detections);
    const withAccuracy = entries.filter(([, v]) => v.lastAccuracy > 0);
    if (withAccuracy.length === 0) return null;
    // Return the one with the highest lastAccuracy (most recently detected)
    return withAccuracy.reduce((best, curr) =>
      curr[1].lastAccuracy > best[1].lastAccuracy ? curr : best
    )[0];
  }, [detections, isListening]);

  // const counts = useMemo(
  //   () => detections,
  //   [detections]
  // );

  return {
    isListening,
    isLoading: !isModelLoaded || !!isModelLoading,
    detections,
    activeZikr,
    error: error ?? "",
    toggle: toggleListening,
    reset: resetCounters,
  };
}