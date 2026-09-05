# Codebase Audit & Cleanup Plan (pre-i18n)

Scope: `apps/web` (Next.js), `apps/extension` (Chrome, Vite), `packages/*`.
Firefox is intentionally excluded — abandoned due to platform limitations on the core extension logic.

Goal: land in a stable, predictable state before starting i18n (`packages/i18n` + `app/[locale]` + `use-intl` in extension).
Rule: no behavior refactors for their own sake. Each item below earns its place via correctness, security, or becoming an i18n blocker.

Phases are ordered. Finish a phase before starting the next.

---

## Phase 0 — Security (do first, blocks everything)

### 0.1 Secrets in local `.env` + keys baked into client bundles
- **What:** `apps/web/.env:1-8` and `apps/extension/.env` exist locally with real `SUPABASE_SECRET`, `SUPABASE_ANON_KEY`, `EI_API_KEY`, and a guessable `ADMIN_SECRET`. They are currently **not tracked** in git (`.gitignore:9` covers `.env`, verified via `git ls-files` / `git log` — no history). The live risk is bundling: `NEXT_PUBLIC_*` (web) and `VITE_*` (extension, via `src/routes/__root.tsx:40` unguarded `DevAudioDebugger`) are inlined into shipped JS (`build/assets/main-*.js`).
- **Why:** Anyone receiving a built bundle can extract the Edge Impulse key. Supabase secret bypasses RLS if it ever reaches the client. Local-only secrets are still one `git add -f` away from exposure.
- **Fix:** Keep `.env` ignored, add `.env.example` placeholders, gate `DevAudioDebugger` behind `DEV` so `VITE_EDGE_IMPULSE_API_KEY` never ships to prod, rotate keys if ever shared, move prod values to hosting/CI secrets.
- **Severity:** critical.

---

## Phase 1 — Quick wins: dead code + build hygiene

### 1.1 Delete dead / commented code
- **What:**
  - `packages/ui/src/layout/SettingsPanel2.tsx` — full commented clone of `SettingsPanel.tsx`
  - `packages/ui/src/layout/ZikrCard.tsx` — fully commented
  - `apps/web/components/DevAudioDebugger.tsx` — 283 lines commented out (live version is `@workspace/ui/components/DevAudioDebugger`)
  - `apps/extension/src/router.tsx` — fully commented legacy file (TanStack Router itself stays: actively used via `src/main.tsx` + file-based `src/routes/*` + `routeTree.gen`)
  - `apps/web/components/Footer.tsx:128-253` — alternate commented footer
  - `apps/extension/src/utils/loadFont.ts` — commented out, remote-font approach abandoned
  - Stray `apps/extension/cross-env`, `apps/extension/extension@0.0.0` (0-byte install artifacts), empty `apps/extension/src/components/`
- **Why:** Confusing, ships via `layout/*` globs, slows audits.
- **Fix:** Delete files/blocks. Keep `@tanstack/react-router` deps (used by `src/main.tsx`); delete only the dead `router.tsx` file.
- **Severity:** medium.

### 1.2 Chrome build copies stale manifest, single outDir
- **What:** `apps/extension/vite.config.ts:22-33,49-56` always copies `public/manifest.json` (stale `0.1.1`) while `public/manifest.chrome.json` is `1.1.1-beta.2`. Single `outDir: build`.
- **Why:** Shipped artifact has wrong version/permissions. Easy to ship stale manifest.
- **Fix:** Copy `manifest.chrome.json` → `manifest.json` at build time (or rename to single source of truth). Verify version bump flow.
- **Severity:** high.

### 1.3 Absolute model paths + remote font in extension
- **What:** `apps/extension/sandbox.html` + built `build/sandbox.html` use `/model/...` despite `base: "./"` in `vite.config.ts:10`. `apps/extension/index.html:9-10` loads Google Fonts via `<link>` (blocked by `extension_pages` CSP `script-src 'self'` / offline).
- **Why:** Breaks under subpath, breaks offline (core promise of the app).
- **Fix:** Use `./model/...` relative paths. Self-host font or remove remote link.
- **Severity:** medium.

---

## Phase 2 — Core correctness (extension + detection + storage + web perf)

### 2.1 Extension reports "mic running" before mic starts
- **What:** `apps/extension/public/background.js:58-71` resolves `{success:true}` right after `offscreen.createDocument()`. `src/offscreen.ts:200-202` mic failure only `console.error`s. `checkMicStatus:72-86` checks `getContexts().length`, not stream liveness.
- **Why:** Denied/failed mic still shows listening UI.
- **Fix:** Offscreen posts `MIC_STARTED` / `MIC_ERROR` to background; background resolves `startMic` only then. Track real stream state for `checkMicStatus`.
- **Severity:** high.

### 2.2 `stopMic` contract + offscreen lifecycle gaps
- **What:** `background.js:99-119` returns `{success:false, error:"Offscreen document not found."}` when already stopped — popup shows it as error though stopped is the desired state (`src/routes/index.tsx:123-124`). `src/offscreen.ts:129` has no re-entry guard (double `MODEL_LOADED` leaks a second `getUserMedia` + worklet). `stopListening:205-218` is dead on Chrome (background just closes the document). `audioContext.close()` not awaited.
- **Why:** Noisy errors, mic leaks, fragile restarts.
- **Fix:** Treat already-stopped as success. Guard `startListening` against double-start. Await cleanup.
- **Severity:** high.

### 2.3 Detection pipeline diverged (web vs extension), double normalize
- **What:**
  - Shared util `packages/audio-processing/src/utils.ts:35-38` requires `value > maxConfidence(0.9) && value > threshold`.
  - Web `apps/web/features/zikr-app/hooks/useKeywordSpotting.ts:93-101` bypasses it with local `maxConfidence=0.4`.
  - Chrome `src/offscreen.ts:70-112` uses the util with live settings, but normalizes for debug then sends *resampled* audio (`offscreen.ts:190-193`) — sandbox re-normalizes. So offscreen normalize is wasted CPU and `targetRms/minRms` have zero effect on inference.
  - Cooldowns differ (web 500/1500ms switch vs offscreen single-label variant).
- **Why:** Same audio → different counts on web vs extension. Settings sliders mislead.
- **Fix:** One `decideDetection()` helper in `audio-processing` (single threshold + cooldown policy). Send `processedAudio` to sandbox (or drop offscreen normalize). Add DSP input guards (`resampleAudio` negative/NaN rate, `normalizeAudio` div-by-zero when `minRms=0`).
- **Severity:** high.

### 2.4 Debug channel floods even with popup closed
- **What:** `src/offscreen.ts:114-126` sends `debugAudioChunk` (16k floats ×2 + results) at ~4Hz via `runtime.sendMessage`, dropped silently when popup closed. Web `useKeywordSpotting.ts:81-91` does `Array.from` ×2 + `dispatchEvent` per inference even with debugger closed. `DevAudioDebugger` retains ~30 chunks (~MBs) in React state.
- **Why:** ~500KB/s serialization + GC pressure for zero benefit in prod. Always-mounted debugger (`src/routes/__root.tsx:40`, no `DEV` guard) ships this path to prod.
- **Fix:** Handshake — only send when debugger mounted (or 1Hz sample). Gate `DevAudioDebugger` behind `import.meta.env.DEV` / explicit flag.
- **Severity:** high.

### 2.5 Storage correctness (counts + settings)
- **What:** `packages/lib/src/zikrStorage.ts:20-32,52-62,155-171`:
  - `incrementCount` is read-modify-write (loses counts on overlap; background `background.js:92-97` does its own non-atomic `get→set` too).
  - `parseInt` accepts `"12abc"`; sync API writes `"0"` string vs async writes `0` number → perpetual rewrite on every read (`107-114`).
  - `subscribeCounts` drops non-number values; no `chrome.runtime.lastError` checks (hangs silently).
  - `ensureDailyReset` only runs on popup mount — midnight rollover missed while open; `else` branch rewrites date every load.
  - `lib/zikrStorage.ts:4-8` + `lib/settings.ts:26-31` probe `(globalThis).chrome` directly instead of the shared `apps/extension/src/utils/browser.ts` helper. Two copies of the same shim.
- **Why:** Lost counts, stale UI, silent storage failures.
- **Fix:** Single browser-storage helper, `lastError` handling, `Number()` + clamp instead of `parseInt`, fix string/number mix, add midnight timer. No storage redesign yet.
- **Severity:** high.

### 2.6 `ZikrList` breaks TanStack Router navigation
- **What:** `packages/ui/src/layout/ZikrList.tsx:22-23` renders `<LinkComponent href={...}>`. Extension passes TanStack `Link` (`apps/extension/src/routes/index.tsx:146`) which expects `to`, not `href`. Web works only because it passes Next `Link`.
- **Why:** Broken detail navigation in extension.
- **Fix:** Explicit `to`/`href` union props (or separate `LinkComponent` adapters). Narrow `React.ElementType` to the two supported links.
- **Severity:** high.

### 2.7 Web mic polling + metadata thrash
- **What:** `features/zikr-app/hooks/usePersistentMicrophone.ts:44` polls every 100ms → whole `/app` re-renders 10×/s. `MicProvider.tsx` logs every render. `DynamicMetadata.tsx:58` depends on full `detections` object → title/favicon writes per count, never restores favicon. `AppBootstrapper` sits outside `Providers` (`app/app/layout.tsx:31-32`) so it can't read settings.
- **Why:** Battery + jank on the core screen.
- **Fix:** Event-driven mic state (no poll), remove logs, narrow metadata deps, add unmount cleanup, move bootstrapper inside providers.
- **Severity:** high.

---

## Phase 3 — Robustness (API + SSR / leaks)

### 3.1 Contribute upload/review routes lack validation
- **What:**
  - `apps/web/app/api/contribute/upload/route.ts` — full-file `arrayBuffer()` in memory, no `Content-Length` pre-check / rate-limit / auth, `ext` derived from client `mime_type`, unbounded `label/prompt/variation`, orphan cleanup only on DB error. `MAX_BYTES` duplicates bucket limit in `scripts/setup-supabase.mjs:72`.
  - `app/api/contribute/review/route.ts:4,23-24,133,137-151` — `ADMIN_SECRET!` throws at import, `parseInt(page)` NaN, unvalidated `status/sort`, `split(".").pop()` breaks on extensionless keys, `copy` failure swallowed but `processed_path` still written.
  - `features/contribute/lib/supabase.ts:3-4` builds URL from env with no `server-only` guard despite "never import in client" comment. `pushToEI.ts` now goes through `/api/contribute/push-to-ei` (server key) — no client key.
- **Why:** DoS surface, corrupt data, 500s on missing env.
- **Fix:** Validate + clamp all inputs, allowlist labels, handle NaN, single constant for size limit, `server-only` for server Supabase client. No feature changes.
- **Severity:** high.

### 3.2 SSR crashes + media resource leaks
- **What:** `features/contribute/components/ContributePage.tsx:23` runs `crypto.randomUUID()` during SSR. `useRecorder.ts:43,64-65` touches `MediaRecorder` per render, leaks `createObjectURL` (revoked only on explicit reset). `MicCheckStep.tsx:45-51,87-96` never disconnects source, doesn't await `close()`, leaves stream open on unmount. `MicService.ts` same un-awaited `close()`, no `resume()` on `suspended` (autoplay policy).
- **Why:** SSR crash risk, mic stays open, URL/memory leak.
- **Fix:** Lazy UUID init with fallback, revoke URLs on unmount, always stop tracks + disconnect + await close, handle `suspended`.
- **Severity:** high.

### 3.3 Admin + contribute UX races (small)
- **What:** `useAdminReview.ts:67-69,100-182` refetches on every filter change with no `AbortController` (pagination races), 3 sequential round-trips for accept, `setTimeout(1500)` leaks on unmount. `useUpload.ts:12,29-62` fixed 1s retry, no abort/progress. `RecordingLoopStep:45-46` biased `sort(()=>Math.random()-0.5)` shuffle in `useState` initializer → SSR/client hydration mismatch; `setTimeout(800)` without cleanup.
- **Why:** Flicker, wasted requests, hydration warnings.
- **Fix:** Abort on filter change, clear timers on unmount, move shuffle to client effect or seeded shuffle.
- **Severity:** medium.

---

## Phase 4 — Routing / SEO / i18n prerequisites (do right before i18n)

### 4.1 `lang`/`dir` placement + fonts
- **What:** Root `apps/web/app/layout.tsx:16` hardcodes `<html lang="ar">` while marketing is English. `/app` puts `lang/dir` on `<main>` (`app/app/layout.tsx:27-28`) so portals/tooltips miss RTL. Duplicate `Vazirmatn({subsets:["latin"]})` in both layouts — Arabic glyphs fall back to system font.
- **Why:** Screen readers, typography, and RTL all wrong. Blocks `[locale]` routing.
- **Fix:** Single font definition with `["arabic","latin"]`, dynamic `lang`/`dir` on `<html>` per locale. Remove hardcoded `dir`/`lang` scattered in `RecordingLoopStep`, `LandingStep`, `CompleteStep`, `SampleReviewCard`, `SettingsPanel (dir="ltr")`, `FloatingBar (direction:rtl)`.
- **Severity:** high (i18n blocker).

### 4.2 Metadata + routing gaps
- **What:** No root `metadata` (`title.template`, `description`, `metadataBase`, `openGraph`, `viewport`). No `generateMetadata` for `app/app/zikr/[slug]/page.tsx` (all azkar share one title). `[slug]` mistypes `params` + double-await (`page.tsx:17-22`), no `notFound()`, `generateStaticParams` source (`SupportedAzkar`) can drift from upload allowlist (`AzkarList`). No `not-found.tsx` / `error.tsx` / `sitemap` / `robots`. Three competing max-widths (marketing `max-w-3xl`, `/app` `max-w-xs`, admin `max-w-5xl`), hardcoded `v0.1.0-beta.2` footer with `absolute` positioning.
- **Why:** Bad SEO/share, 404 handling, blocks localized metadata (`alternates.languages`, `ogLocale`).
- **Fix:** Add base metadata + per-slug titles, fix `params` typing, add `not-found`/`error`, derive version from package. Keep layout widths as-is unless they annoy users.
- **Severity:** high (SEO + i18n blocker).

### 4.3 Dead links + content anchors
- **What:** `Header.tsx:33-38` `href=""` (Contact reloads page). `FAQs.tsx:91-96` `href="github"` → `/github` 404. `Footer.tsx:109` `/terms` has no route. `#how-it-works` / `#faq` anchors have no matching `id`s.
- **Why:** 404s, bad first impression before worldwide launch.
- **Fix:** Point to real URLs, add missing `id`s or drop anchors.
- **Severity:** medium.

---

## Phase 5 — Deferred (after i18n starts, or opportunistic)

### 5.1 Package layering (don't big-bang)
- **What:** `packages/ui` depends on `lib+model+azkar+audio-processing` (`ui/package.json:9-16`) — a `Button` import drags the world. `lib` holds Zikr storage (domain, not generic). `model` depends on `react` with zero JSX. `azkar/constants.ts:49-77` owns `TONE_VARIATIONS` (contribute UI copy) + `PIPELINE_VERSION` (audio pipeline version lives away from the code it versions). `audio-processing/edge-impulse.ts` mixes pure DSP with `window/fetch`.
- **Fix (later):** New rule only — `ui` stays presentational; move `TONE_VARIATIONS` to `features/contribute` as part of string extraction; drop `react` from `model`; split pure DSP vs browser helpers when touching the hot path.
- **Severity:** medium.

### 5.2 Types + validation debt (opportunistic)
- **What:** `any` in storage/settings/slider handlers/sandbox/offscreen. `parseSettings` spreads unvalidated `JSON.parse`. `buildInitialDetections` untyped (forces `as Detections` casts). `getAzkarKeys(): string[]` loses literals. `processClassifierResult` second param shadows threshold confusingly.
- **Fix (later):** Type as you touch. No dedicated pass.
- **Severity:** medium.

### 5.3 Deeper perf (measure first)
- **What:** Main-thread `resample→normalize→classify` (candidate for worker), duplicated worklets, `SW cache.addAll` atomic (one 404 fails all), admin signed-URL N+1 per page, YouTube iframe with no facade, `/logo.png` without `priority`.
- **Fix (later):** Profile before optimizing. Only Phase 2.4 (debug gate) is in scope now.
- **Severity:** low-medium.

### 5.4 RTL conversion (do file-by-file *during* i18n, not before)
- **What:** 46× physical Tailwind (`ml-`, `left-`, `right-`, `text-left`), zero logical props. `toFixed(2)` Latin digits, `toLocaleTimeString()` without locale.
- **Fix (during i18n):** Convert to `ms-/me-/start-/end-` + `Intl.*` formatting as each file's strings are extracted. No pre-pass.
- **Severity:** medium (i18n-time).

---

## Suggested execution order

1. Phase 0 (security).
2. Phase 1 (deletions + manifest/paths).
3. Phase 2 (correctness — biggest value).
4. Phase 3 (robustness).
5. Phase 4 (routing/SEO) → then start i18n.
6. Phase 5 stays deferred.
