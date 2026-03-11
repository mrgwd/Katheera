/**
 * packages/lib/src/hooks/usePersistentMic.types.ts
 *
 * The shared contract that both apps' mic hooks must satisfy.
 * The floating mini-bar and any other shared UI only depends on this type —
 * never on a specific implementation.
 */

import type { Detections } from "@workspace/model/types";

export interface PersistentMicState {
  isListening: boolean;
  isLoading: boolean; // Model/offscreen doc still initializing
  detections: Detections; // zikr key → detection object with count, lastAccuracy, etc.
  activeZikr: string | null; // Last detected zikr key, for mini-bar label
  error: string;
}

export interface PersistentMicActions {
  toggle: () => void;
  reset: () => void;
}

export type UsePersistentMicResult = PersistentMicState & PersistentMicActions;