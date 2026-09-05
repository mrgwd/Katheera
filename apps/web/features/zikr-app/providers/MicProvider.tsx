"use client";

import { createContext, useContext, useEffect } from "react";
import type { UsePersistentMicResult } from "@workspace/lib/usePersistentMic.types";
import { usePersistentMic } from "../hooks/usePersistentMic";
import { MicService } from "../services/MicService";

const MicContext = createContext<UsePersistentMicResult | null>(null);

export function MicProvider({ children }: { children: React.ReactNode }) {
  console.log("MicProvider: Mounting");
  const mic = usePersistentMic();

  // Cleanup MicService when provider unmounts (app shutdown)
  useEffect(() => {
    return () => {
      MicService.getInstance().cleanup();
    };
  }, []);

  return <MicContext.Provider value={mic}>{children}</MicContext.Provider>;
}

export function useMic(): UsePersistentMicResult {
  const ctx = useContext(MicContext);
  if (!ctx) throw new Error("useMic must be used inside <MicProvider>");
  return ctx;
}
