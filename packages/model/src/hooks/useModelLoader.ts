/**
 * useModelLoader — React adapter for ModelService.
 *
 * This hook contains ZERO loading logic. It only subscribes to the
 * ModelService singleton and reflects its state into React.
 *
 * This means:
 * - Component unmount/remount does NOT trigger a reload
 * - Navigation does NOT trigger a reload
 * - Multiple components calling this hook share the same state
 *   with no duplication
 */

"use client";

import { useEffect, useState } from "react";
import { modelService } from "../ModelService";
import type { EdgeImpulseClassifier } from "../types";

interface UseModelLoaderResult {
  classifier: EdgeImpulseClassifier | null;
  isModelLoaded: boolean;
  isModelLoading: boolean;
  error: string;
}

export function useModelLoader(): UseModelLoaderResult {
  const [state, setState] = useState(() => ({
    loadState: modelService.getState(),
    error: modelService.getError(),
  }));

  useEffect(() => {
    // Subscribe — this fires immediately with current state,
    // so if the model is already loaded, we get "ready" right away.
    const unsubscribe = modelService.subscribe((loadState, error) => {
      setState({ loadState, error: error ?? "" });
    });

    return unsubscribe;
    // No deps — modelService is a stable singleton reference
  }, []);

  return {
    classifier: modelService.getClassifier(),
    isModelLoaded: state.loadState === "ready",
    isModelLoading: state.loadState === "loading",
    error: state.error,
  };
}
