/**
 * apps/web/components/FloatingMiniBarWrapper.tsx
 *
 * Connects Next.js router + MicContext to the shared FloatingMiniBar UI.
 * Lives in layout.tsx alongside MicProvider.
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { FloatingMiniBar } from "@workspace/ui/layout/FloatingBar";
import { useMic } from "../providers/MicProvider";

export function FloatingMiniBarWrapper() {
  const { isListening, activeZikr, detections, toggle } = useMic();
  const pathname = usePathname();
  const router = useRouter();

  const isOnHome = pathname === "/app";
  const activeCount = activeZikr ? (detections[activeZikr]?.count ?? 0) : 0;
  // Get the Arabic display name for the active zikr key
  // const displayName = activeZikr ? getAzkarDisplayName(activeZikr) : null;

  return (
    <FloatingMiniBar
      isListening={isListening}
      isOnHome={isOnHome}
      activeZikr={activeZikr}
      count={activeCount}
      onNavigateHome={() => router.push("/")}
      onStop={toggle}
    />
  );
}
