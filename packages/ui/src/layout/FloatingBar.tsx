/**
 * packages/ui/src/components/FloatingMiniBar.tsx
 *
 * Appears at the bottom of the screen when the mic is active
 * and the user has navigated away from the home route ("/").
 *
 * Fully shared between web (Next.js) and extension (Vite/React).
 * Each app wraps it with its own router — this component is router-agnostic.
 * It receives `onNavigateHome` as a prop so it never imports a router directly.
 *
 * Props:
 *   isListening     — show/hide the bar
 *   isOnHome        — if true, bar is hidden (user is already on home)
 *   activeZikr      — display name of last detected zikr (Arabic)
 *   count           — current session count for that zikr
 *   onNavigateHome  — called when user taps the bar body
 *   onStop          — called when user taps the stop button
 */

import { useEffect, useRef } from "react";

interface FloatingMiniBarProps {
  isListening: boolean;
  isOnHome: boolean;
  activeZikr: string | null; // Arabic display string e.g. "سبحان الله"
  count: number;
  onNavigateHome: () => void;
  onStop: () => void;
}

export function FloatingMiniBar({
  isListening,
  isOnHome,
  activeZikr,
  count,
  onNavigateHome,
  onStop,
}: FloatingMiniBarProps) {
  const shouldShow = isListening && !isOnHome;
  const barRef = useRef<HTMLDivElement>(null);

  // Animate in/out
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (shouldShow) {
      // Force reflow to restart animation when re-showing
      bar.style.animation = "none";
      bar.getBoundingClientRect();
      bar.style.animation = "";
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <>
      <style>{`
        @keyframes minibar-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .minibar-enter {
          animation: minibar-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div
        ref={barRef}
        className="minibar-enter fixed right-4 bottom-4 left-4 z-50 flex items-center justify-between rounded-2xl bg-neutral-900 px-4 py-3 shadow-2xl dark:bg-neutral-800"
        style={{ direction: "rtl" }}
      >
        {/* Pulsing mic indicator */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>

          {/* Tap to go home */}
          <button
            onClick={onNavigateHome}
            className="flex flex-col items-start text-right"
          >
            <span className="text-xs text-neutral-400">
              {activeZikr ?? "جارٍ الاستماع"}
            </span>
            {count > 0 && (
              <span className="text-sm font-bold text-white">{count}</span>
            )}
          </button>
        </div>

        {/* Stop button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStop();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-neutral-300 transition hover:bg-red-500 hover:text-white"
          aria-label="إيقاف الاستماع"
        >
          {/* Stop square icon */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="10" height="10" rx="2" />
          </svg>
        </button>
      </div>
    </>
  );
}
