# PROJECT_CONTEXT.md — handoff for continuing this project

> Read this first in a new session. It is a snapshot of the repo state as of
> 2026-09-05, after a 4-phase pre-i18n cleanup. Verify anything load-bearing
> with a quick read/grep before acting — the tree moves fast.

## 1. What this project is

**Katheera (AI Sebha)** — repo `mrgwd/Zikr`. A browser extension + web app that
automatically detects and counts spoken azkar (e.g. سبحان الله، الحمد لله،
الله أكبر) using a custom on-device Edge Impulse model (~5 MB WASM).
Hands-free, offline after first load, private (mic audio never leaves device).

**Current goal sequence:** finish codebase cleanup (done, Phases 0–4) →
**UI consistency refactor** (planned, awaiting user approval — see
`UI_CONSISTENCY.md`) → **i18n** (decided, not started).

## 2. Architecture

Monorepo (Turborepo + pnpm workspaces):

```
apps/web         Next.js 16.1.6 App Router, React 19. Marketing (/) + /app (mic
                 counter) + /privacy + /contribute + /admin + /api/contribute/*.
                 Deployed at katheera.mohamedramadan.dev.
apps/extension   Chrome MV3 extension. Vite + React + TanStack Router (hash
                 history — extension URLs break browser history).
                 popup (index.html) → background.js (SW) → offscreen.html
                 (mic + AudioWorklet + resample) → sandbox.html iframe
                 (WASM classify, relaxed CSP) → storage + badge → popup UI.
packages/ui          Shared components: shadcn-style (Base-UI primitives) in
                     components/* + domain layout in layout/* + useSettings.
packages/azkar       AzkarList/SupportedAzkar, TONE_VARIATIONS, data/*.json.
packages/lib         cn, zikrStorage (counts), settings, registerServiceWorker.
packages/audio-processing  resampleAudio / normalizeAudio /
                     processClassifierResult / WAV + Edge Impulse upload utils.
packages/model       Edge Impulse types + web ModelService.
packages/styles      Tailwind globals. packages/{eslint,typescript}-config.
```

**Key technical decisions (do not relitigate without reason):**

* **i18n: `next-intl` (web) + `use-intl` (extension)** — one family, one ICU
  message format. Shared `packages/i18n` (not created yet). `localePrefix:
  'as-needed'` (default locale unprefixed, others prefixed). Target locales
  v1: `en` + `ar` (`de` explicitly later). `react-i18next`-everywhere was
  considered and rejected (worse RSC/metadata story); mixing next-intl +
  i18next was rejected (incompatible message formats).
* **Edge Impulse uploads: browser WAV conversion + Next.js proxy.**
  MediaRecorder outputs webm/opus (EI ingestion only accepts WAV), so decode →
  pipeline → `createWavBlob` stays client-side; the final POST goes through
  `/api/contribute/push-to-ei` which holds the server-only
  `EDGE_IMPULSE_API_KEY`. Server-side ffmpeg transcoding was rejected
  (resource-heavy for this scale). There is intentionally **no**
  `NEXT_PUBLIC_*` EI key anymore.
* **DevAudioDebugger is dev-only** in both apps (gated by `NODE_ENV` /
  `import.meta.env.DEV`). Verified: prod extension bundle contains no EI key
  string and no `debugAudioChunk` code (minifier drops the branch).
* **Firefox extension abandoned** (platform limits on core logic). Its files
  (`background.firefox.ts`, `listening.html`, `manifest.firefox.json`,
  `firefox_support_plan.md`) remain in-tree but inert — kept compiling only,
  do not extend.
* **Extension mic lifecycle is a state machine** (`background.js`:
  `idle/starting/active/error`). `startMic` always starts fresh (closes stale
  doc), resolves only on offscreen `micStarted`/`micError`/20 s timeout.
  `stopMic` always succeeds. `checkMicStatus` reports tracked stream state
  (sync response now).
* **Single detection policy** in `processClassifierResult` (returns
  `{label, confidence}`, floor `MIN_CONFIDENCE_SEED = 0.4`). Web and extension
  share it. Offscreen sends already-normalised audio; sandbox classifies
  directly. Lowering the threshold slider now actually works on the extension
  (previously a no-op below 0.9) — expect slightly different counts there.

## 3. Git / worktree state (important)

* Branch `main`, HEAD `0b524ee` ("chore: add .env.example files") — the only
  agent-authored commit. **~79 changed paths are UNCOMMITTED** (27 untracked):
  a large user WIP restructure (components/hooks moved into `features/`,
  README rewrite) **plus** all agent Phase 0–4 work.
* **Explicit user rule: implement, do NOT commit — the user reviews and
  commits.** Group related changes so they can commit per-area. This file,
  `AUDIT.md`, and (after approval) the UI refactor are also uncommitted.
* `.env` files are git-ignored and were never tracked (`apps/web/.env`,
  `apps/extension/.env` exist locally with real keys). `.env.example` files
  are committed. `pnpm-lock.yaml` is untracked. `build/`, `.next/` ignored.

## 4. What was implemented (Phases 0–4, all in worktree)

* **Phase 0 (security):** `.env.example` (web+extension); debugger dev-gated;
  new `POST /api/contribute/push-to-ei` proxy (admin-secret auth, label
  allowlist, 1 MB cap); `pushToEI` uses proxy (takes admin `secret`);
  removed client EI key exports/usages.
* **Phase 1 (hygiene):** deleted fully-commented `router.tsx`, `loadFont.ts`,
  `SettingsPanel2.tsx`, `ZikrCard.tsx`, web `DevAudioDebugger.tsx`,
  Footer alt-block, `cross-env`/`extension@0.0.0`, empty `src/components/`;
  `vite.config.ts` copies `manifest.chrome.json`→`manifest.json` (single
  source, verified `1.1.1` in build); `sandbox.html` model paths relative;
  Vazirmatn self-hosted (`public/fonts/*.woff2`, offline, WAR-covered).
* **Phase 2 (correctness):** mic handshake + stop contract + offscreen guards
  (re-entry, `resume()`, awaited cleanup, shared `releaseAudioResources`);
  typed popup↔background responses; detection unification + silence skip;
  DSP guards (bad rates, NaN/zero-RMS); debug sending dev-only;
  storage `toCount` coercion/clamping/`lastError`/numeric-string subscribe;
  settings parse+clamp; `ZikrList` `to` (TanStack) vs `href` (Next) split;
  web poll removed, metadata effects split, `AppBootstrapper` inside Providers.
* **Phase 3 (robustness):** upload validation (lengths, empty file, strict
  recorder-type allowlist → 400); review validation (503 without secret,
  page clamp, status/sort allowlists, safe ext parse, null processed_path on
  copy failure, id length caps); `server-only` guard on Supabase client (dep
  added); session-id SSR-safe init; recorder mime memo + URL revoke +
  paused-state; MicCheckStep resource/error handling + handed-off stream
  ownership; web MicService resume/close; admin fetch abort + timer cleanup;
  upload offline fast-fail; deterministic prompt queue + client-only
  Fisher–Yates shuffle; tracked advance timer; milestone cleared on advance.
* **Phase 4 (i18n prereqs):** `lib/fonts.ts` (Vazirmatn arabic+latin, shared),
  `lib/site.ts` (URLs/email single source); root `<html lang="en" dir="ltr">`
  + base metadata (template/default/metadataBase); per-slug metadata,
  `dynamicParams=false`, `notFound()`, `HadithPage`→`ZikrDetailPage`;
  `not-found.tsx`, `error.tsx`, `robots.ts`, `sitemap.ts`; footer version
  from `package.json` (bumped web `0.0.1`→`0.1.0-beta.2`); dead links fixed
  (mailto contact, repo URLs, `/#features`+`/#faq`, `/terms` removed —
  no such route); `production `next build`` green (15 pages, 3 SSG slugs).

## 5. Audit findings: fixed vs intentionally deferred

Fixed: everything in Phases 0–4 above (see `AUDIT.md` for the original
per-issue what/why/severity notes — §§0–4; note §0.1 was corrected: secrets
were never committed, risk was bundle inlining).

Deferred (Phase 5, do opportunistically — not before i18n unless blocking):
package layering (`ui` depends on everything; `lib` domain-coupled; `model`
depends on React), broad `any` cleanup, main-thread inference → worker,
SW `cache.addAll` atomicity, admin signed-URL N+1, marketing LCP (YouTube
facade), midnight-rollover timer, storage atomicity, physical→logical
Tailwind RTL conversion (**do file-by-file during i18n string extraction,
not as a pre-pass**), remaining prod `console.log`s.

## 6. Conventions the next agent must follow

* **Workflow: audit → agree → implement.** Never start refactors unprompted;
  user approves plans first. Verify via `tsc --noEmit`, `eslint`, and
  `build:chrome` / `next build` where routing/bundling is touched.
* **No commits** (user commits). Keep changes grouped by area.
* **UI system: shadcn-style `Button` + `buttonVariants`** (`default/outline/
  secondary/ghost/destructive/success/link`; sizes incl. `icon-*`); links
  that look like buttons use `buttonVariants` + `Link`. **Icons only via the
  `@workspace/ui/index` barrel** (Lucide re-exports) — no ad-hoc
  `lucide-react` imports in app/feature code, no hand-drawn standard glyphs.
  Bespoke illustration (`MicIcon`, `Decoration`, waveforms, record fab) is
  exempt. Full rules + findings: `UI_CONSISTENCY.md`.
* **No new files unless needed; prefer edits.** No speculative components,
  deps, or docs. Keep diffs minimal and behavior-preserving unless the plan
  says otherwise (detection/threshold and mic-lifecycle changes are the
  known behavior deltas — see §2).
* **Extension specifics:** `background.js` is plain JS — check with
  `node --check`. Offscreen/sandbox/popup are Vite-bundled TS
  (`import.meta.env.DEV` works there). `routeTree.gen.ts` is generated.
  `public/manifest.chrome.json` is the manifest source of truth.

## 7. Stack / deps of note

Next 16.1.6 / React 19 / Tailwind 4 / Turborepo / pnpm; Vite + TanStack
Router (hash history) + `webextension-polyfill`; Base-UI primitives under
shadcn-style wrappers; `next-themes`; Supabase (service-role, server-only);
`server-only` (web); zod in ui; Edge Impulse WASM via `packages/model`.

## 8. Gotchas learned

* `import.meta.env.DEV` branches are fully dropped from prod extension
  bundles (verified by grepping build output) — the sanctioned prod-gate.
* `turbo/no-undeclared-env-vars` warnings fire for every env var
  (`turbo.json` declares none) — noise, ignore unless adding cacheable tasks.
* `getExtension()`-style client-derived values must never be trusted
  server-side (upload route now uses the blob's own type).
* `Number()` coercion (not `parseInt`) for stored counts; legacy string
  counts are auto-migrated on read.
* `processClassifierResult` floor semantics: prediction must beat BOTH seed
  and user threshold.
* Console noise during `next build` prerender (`MicProvider: Mounting`) is
  known, harmless, Phase-5 cleanup.
* The mount-shuffle `setState-in-effect` warning in `RecordingLoopStep` is
  intentional (client-only randomisation); `exhaustive-deps` wanting the
  whole `recorder` object in the auto-stop effect is a false positive (would
  loop) — do not "fix".
* `apps/extension/src/assets/Vazirmatn-VariableFont_wght.ttf` (untracked) is
  redundant with `public/fonts/*.woff2` — delete or keep as source.

## 9. Immediate next steps

1. Get user approval on `UI_CONSISTENCY.md`, implement the UI refactor.
2. Then i18n: create `packages/i18n` (en+ar messages, routing config),
   web `app/[locale]` + middleware (next-intl, `as-needed` prefix),
   extension `use-intl` provider + persisted locale, per-locale
   `generateMetadata`/fonts/`lang`/`dir`, RTL logical-props pass
   during string extraction.
3. User-side reminders: rotate EI/Supabase keys if ever shared; commit the
   79-path worktree; decide Firefox-file deletion; `/terms` page content.

## 10. Known risks / be careful

* Stricter API validation is live but uncommitted: unknown recorder mime →
  400, long fields → 400, missing `ADMIN_SECRET` → 503. Confirm clients only
  send allowlisted types.
* `stopMic`/`checkMicStatus` contracts changed (always-success /
  sync-tracked-state) — popup code already updated; do not re-add doc-count
  checks.
* `subscribeSettings` is a no-op on web (cross-tab settings sync still
  missing — acceptable).
* No upload rate limiting (no infra); admin secret default is guessable
  (`change-this…`) — deployment checklist item.
* `update_ei` trusts any authed caller (fine for single-admin beta).
