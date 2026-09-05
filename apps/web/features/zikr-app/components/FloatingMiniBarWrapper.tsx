"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { FloatingMiniBar } from "@workspace/ui/layout/FloatingBar";
import { useMic } from "../providers/MicProvider";

export function FloatingMiniBarWrapper() {
  const { isListening, activeZikr, detections, toggle } = useMic();
  const pathname = usePathname();
  const router = useRouter();

  // Locale-aware pathname may carry a prefix (/ar/app) — match the tail.
  const isOnHome = pathname.endsWith("/app");
  const activeCount = activeZikr ? (detections[activeZikr]?.count ?? 0) : 0;
  // Get the Arabic display name for the active zikr key
  // const displayName = activeZikr ? getAzkarDisplayName(activeZikr) : null;

  return (
    <FloatingMiniBar
      isListening={isListening}
      isOnHome={isOnHome}
      activeZikr={activeZikr}
      count={activeCount}
      onNavigateHome={() => router.push("/app")}
      onStop={toggle}
    />
  );
}
