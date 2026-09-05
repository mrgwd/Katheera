"use client";

import { useEffect, useState } from "react";
import { modelService } from "@workspace/model/modelService";
import { EdgeImpulseClassifier } from "@workspace/model/types";

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
