/**
 * apps/web/components/MicProvider.tsx
 *
 * Provides mic state to all routes via context.
 * Lives in layout.tsx so it mounts once and survives route changes.
 *
 * Why context here and not just calling usePersistentMic in each component:
 *   usePersistentMic calls useKeywordSpotting which calls useMicrophone.
 *   If multiple components called it, you'd have multiple AudioContexts.
 *   Context ensures there's exactly one instance of the audio pipeline.
 */

"use client";

import { createContext, useContext, useEffect } from "react";
import type { UsePersistentMicResult } from "@workspace/lib/usePersistentMic.types";
import { usePersistentMic } from "@/hooks/usePersistentMic";
import { MicService } from "../lib/MicService";

const MicContext = createContext<UsePersistentMicResult | null>(null);

export function MicProvider({ children }: { children: React.ReactNode }) {
  console.log("MicProvider: Mounting");
  const mic = usePersistentMic();

  // Cleanup MicService when provider unmounts (app shutdown)
  useEffect(() => {
    console.log("MicProvider: Effect mounted");
    return () => {
      console.log("MicProvider: Unmounting, cleaning up MicService");
      MicService.getInstance().cleanup();
    };
  }, []);

  console.log("MicProvider: Rendering with mic state:", mic.isListening);
  return <MicContext.Provider value={mic}>{children}</MicContext.Provider>;
}

export function useMic(): UsePersistentMicResult {
  const ctx = useContext(MicContext);
  if (!ctx) throw new Error("useMic must be used inside <MicProvider>");
  return ctx;
}


