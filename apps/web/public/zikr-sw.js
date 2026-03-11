/**
 * zikr-sw.js — Service Worker for Zikr AI
 *
 * Strategy:
 *   Model files (JS, WASM, worklet) → Cache-First
 *     These never change unless you retrain. Served from cache instantly
 *     after first visit. Cache is keyed by MODEL_VERSION so retraining
 *     a model just means bumping the version string — old cache is
 *     deleted automatically on SW activation.
 *
 *   Everything else → Network-First (default browser behavior)
 *     We don't want to accidentally cache stale app code.
 *
 * ─── To update the model ───────────────────────────────────────────────
 *   1. Replace files in /public/model/ with new versions
 *   2. Bump MODEL_VERSION below (e.g. "v2")
 *   3. Deploy — the SW will delete the old model cache on next activation
 * ──────────────────────────────────────────────────────────────────────
 *
 * Place this file at: apps/web/public/zikr-sw.js
 */

const MODEL_VERSION = "v1";
const MODEL_CACHE_NAME = `zikr-model-${MODEL_VERSION}`;

/**
 * All files that make up the model + audio worklet.
 * These are pre-cached on SW install so the first inference
 * after install is instant (no network round-trip mid-session).
 */
const MODEL_FILES = [
  "/model/edge-impulse-standalone.js",
  "/model/edge-impulse-standalone.wasm",
  "/model/run-impulse.js",
  "/worklets/zikr-audio-processor.worklet.js",
];

// ── Install: pre-cache all model files ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(MODEL_CACHE_NAME)
      .then((cache) => {
        console.log(`[ZikrSW] Caching model files (${MODEL_VERSION})`);
        return cache.addAll(MODEL_FILES);
      })
      .then(() => {
        // Skip waiting so the new SW activates immediately
        // (important when you deploy a model update)
        return self.skipWaiting();
      })
  );
});

// ── Activate: clean up old model caches ─────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const deletions = cacheNames
          .filter(
            (name) =>
              // Delete any zikr-model-* cache that isn't the current version
              name.startsWith("zikr-model-") && name !== MODEL_CACHE_NAME
          )
          .map((name) => {
            console.log(`[ZikrSW] Deleting old model cache: ${name}`);
            return caches.delete(name);
          });
        return Promise.all(deletions);
      })
      .then(() => {
        // Take control of all open tabs immediately
        return self.clients.claim();
      })
  );
});

// ── Fetch: cache-first for model files, passthrough for everything else ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const isModelFile = MODEL_FILES.some((path) => url.pathname === path);

  if (isModelFile) {
    event.respondWith(cacheFirstStrategy(event.request));
  }
  // All other requests: fall through to normal browser fetch behavior
});

/**
 * Cache-First strategy:
 *   1. Check cache → return immediately if found
 *   2. On cache miss → fetch from network, store in cache, return response
 *
 * For model files this means:
 *   - First visit: network fetch (one time cost) → stored in cache
 *   - Every subsequent visit: cache hit → instant, zero network cost
 *   - Hard refresh (Ctrl+Shift+R): SW is bypassed by browser, so network
 *     is used, but the cache is NOT invalidated. Normal refresh uses cache.
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(MODEL_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log(`[ZikrSW] Cache hit: ${new URL(request.url).pathname}`);
    return cached;
  }

  console.log(`[ZikrSW] Cache miss, fetching: ${new URL(request.url).pathname}`);

  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok) {
      // Clone: response body can only be consumed once
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (err) {
    console.error(`[ZikrSW] Network fetch failed for ${request.url}:`, err);
    // If offline and not cached, there's nothing we can do —
    // the model genuinely needs the files. Show an appropriate error in UI.
    throw err;
  }
}