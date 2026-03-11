/**
 * registerServiceWorker.ts
 *
 * Call this once at app boot (in layout.tsx or a top-level component).
 * Handles:
 *   - Registration
 *   - Update detection (new SW waiting → notify user or auto-reload)
 *   - Dev mode guard (SW in dev causes confusing caching issues)
 *
 * Usage:
 *   import { registerServiceWorker } from "@/lib/registerServiceWorker";
 *   registerServiceWorker();
 */

export function registerServiceWorker(): void {
  // Don't register in SSR
  if (typeof window === "undefined") return;

  // Service Workers require HTTPS (or localhost)
  if (!("serviceWorker" in navigator)) {
    console.warn("[ZikrSW] Service Workers not supported in this browser");
    return;
  }

  // In development, SW can cause hard-to-debug caching issues.
  // Skip registration unless explicitly opted in via env var.
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_SW_DEV !== "true"
  ) {
    console.log("[ZikrSW] Skipping SW registration in development");
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/zikr-sw.js", {
        // Scope: controls which pages the SW intercepts.
        // "/" means the entire app.
        scope: "/",
      })
      .then((registration) => {
        console.log("[ZikrSW] Registered, scope:", registration.scope);

        // ── Detect model/SW updates ──────────────────────────────────
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new SW (with potentially a new model) is waiting.
              // Options:
              //   A) Auto-reload (simple, slightly disruptive)
              //   B) Show a toast "New model available — reload to update"
              //
              // For now we dispatch a custom event so the UI can handle it.
              window.dispatchEvent(new CustomEvent("zikr-sw-update-available"));
              console.log("[ZikrSW] Update available — new model ready");
            }
          });
        });
      })
      .catch((err) => {
        console.error("[ZikrSW] Registration failed:", err);
      });

    // When a new SW takes control, reload to use fresh cached files.
    // This fires after the new SW calls clients.claim().
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[ZikrSW] New SW took control — reloading for fresh model");
      window.location.reload();
    });
  });
}