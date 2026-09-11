# UI Consistency Audit & Refactor Plan

Status: **implemented 2026-09-05 (uncommitted worktree) — P1+P2+P3 done, web
`tsc` + `eslint` (0 errors) + `next build` (15 pages) + extension
`build:chrome` all green.** Plan adjustments during implementation:
(a) F3 also covered a fourth hand-drawn check glyph the audit missed
(`ContributePage.tsx` step indicator → `Check`); (b) debugger close `✕`
→ `X` (same F5 class); (c) `CompleteStep` share button `🔗` emoji →
`Share2` icon (same F5 spirit, words unchanged); (d) `ButtonContainer`
gained `aria-label` (was an unlabeled icon-only button) alongside the F8
redundant-role removal.

## 1. System inventory (what already exists)

`packages/ui/src/components/` (shadcn-style, Base-UI primitives):
`button` (variants default/outline/secondary/ghost/destructive/success/link;
sizes default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg), `badge`, `card`,
`label`, `accordion`, `tabs`, `select`, `slider`, `switch`, `tooltip`,
`scroll-area`, `theme-provider`. **Missing: `input`, `checkbox`** (no dialog,
progress, alert, textarea — nothing in the codebase needs them today).

`packages/ui/src/index.tsx` — the **icon barrel** (Lucide re-exports; app and
feature code must import icons only from here): Copy, Check, Hand, WifiOff,
Lock, Zap, LayoutGrid, Heart, ArrowRight, ChevronRight, Chrome, Info,
Settings, X, RotateCw.

Established conventions: CTAs use `<Button>`; links-that-look-like-buttons
use `buttonVariants()` + Next `Link` (Header, FAQs, HeroSectionCTA); admin
area already uses Button/Card/Select/Label correctly.

## 2. Findings

**F1 — Raw CTA buttons in contribute flow (fix → `<Button>`).**
`RecordingLoopStep.tsx:369,380` (Try again/Use this), `:414` (Skip →
`variant="link"`), `LandingStep.tsx:120`, `ConsentStep.tsx:98`,
`MicCheckStep.tsx:193,217`, `CompleteStep.tsx:74,80`, `app/error.tsx:26`
(→ `variant="link"`). All duplicate shadcn visuals by hand (rounded-xl,
bg-primary, focus/disabled states) and diverge (three different disabled
opacities: 50/60/missing). Severity: medium-high. Value: one disabled/focus
story, free a11y.

**F2 — Consent checkboxes are a fake control (fix → new `checkbox.tsx`).**
`ConsentStep.tsx:60-94`: a `<button>` without `aria-pressed` wrapping a
`<div>` checkmark — invisible to assistive tech on a *legal consent gate*.
The system has no checkbox, so add the canonical shadcn `checkbox.tsx`
(Base-UI Checkbox + Check indicator, mirroring `button.tsx`) and compose:
whole-card toggle `<button aria-pressed>` + visual `<Checkbox aria-hidden>`
+ text. Severity: high (a11y + legal weight).

**F3 — Hand-drawn standard glyphs (fix → barrel Lucide).**
Check-mark path `M5 13l4 4L19 7` copy-pasted in `RecordingLoopStep:351`,
`MicCheckStep:163`, `ConsentStep:85` → `Check` (already in barrel). Mic path
in `RecordingLoopStep:329` → `Mic`. Stop squares (`RecordingLoopStep:326`
span, `FloatingBar:104` svg) → `Square`. Severity: medium (drift ×3 already).

**F4 — CSS spinner spans (fix → `LoaderCircle`).**
`RecordingLoopStep:387`, `SampleReviewCard.tsx:201`. Severity: low.

**F5 — Text/emoji glyphs as functional icons (fix → barrel Lucide).**
`"Use this ✓"` → `Check`; `"↓ Newest"/"↑ Oldest"` (`AdminFilters:72`) →
`ArrowDown`/`ArrowUp`; debugger `▶️/💾/☁️/⏳/🐞`
(`DevAudioDebugger.tsx`) → `Play`/`Download`/`Upload`/`LoaderCircle`/`Bug`.
Severity: low-medium (consistency; emoji render varies by platform).

**F6 — Hand-styled password input (fix → new `input.tsx`).**
`AdminAuthGate.tsx:36-48` reimplements shadcn input classes by hand. Add
canonical `input.tsx` (styled native input, `data-slot="input"`, same token
vocabulary) and use it. Severity: medium.

**F7 — Dead commented props (delete).**
`SampleReviewCard.tsx:183,195` (`// className="rounded-md"`). Severity: low.

**F8 — Redundant ARIA (remove).**
`ButtonContainer.tsx:27` `role="button"` on a native `<button>` (implicit
role; `aria-roledescription` without need is noise). Severity: low.

**F9 — `ModeToggle.tsx` unused (delete).**
Only definition exists; theme switching lives in `SettingsPanel`. Severity:
low.

**F10 — `CompleteStep` share fallback (small behavior fix, same file as F1).**
`handleShare` has an un-awaited `clipboard.writeText` and a blocking
`alert()` (also i18n-hostile). Replace with inline "Copied" state.
Severity: low. Flagged because it changes behavior slightly.

## 3. Deliberately NOT changing (judgment calls)

* **Record fab** (`RecordingLoopStep:310`) and **mic zone**
  (`ButtonContainer:26`) stay native `<button>` — bespoke morphing
  size/gradient/animation that shadcn fixed sizes would fight. One-offs, not
  patterns.
* **`MicIcon`, `Decoration`, debugger waveforms/canvases** — brand
  illustration and data-viz; no shadcn equivalent exists and none should be
  invented.
* **Native `<audio controls>`** — no system player; correct as-is.
* **Content/illustrative emoji** (tone-variation labels, hero, milestones,
  empty states, hint text) — character, not chrome. Only functional
  icon-*buttons* migrate (F5).
* **Info panels** (`CompleteStep` impact card, noise hints) stay plain
  divs — do not add an Alert component speculatively.
* **`FloatingBar` nav text button** stays native (bespoke always-dark bar;
  token variants don't apply). Its stop glyph migrates per F3.
* **Marketing `buttonVariants` + `Link`** pattern is correct — untouched.

## 4. Implementation plan (after approval)

* **P1 — System additions** (`packages/ui`): new `components/input.tsx`,
  `components/checkbox.tsx`; extend `index.tsx` barrel with Mic, Square,
  Play, Download, Upload, LoaderCircle, ArrowDown, ArrowUp, Share2, Bug
  (verify names against installed lucide-react at implement time). Verify:
  `tsc` + `eslint src/` in `packages/ui`.
* **P2 — Contribute flow** (`apps/web/features/contribute`): F1 CTAs,
  F2 consent composition, F3/F4 glyphs, F10 share fallback. Keep all
  copy, layout classes, and scale/hover flair (additive `className` only).
* **P3 — Admin + shared + misc**: F6 input, F5 arrows, F4 spinner, F7 dead
  comments, F8 ARIA, F9 deletion, F5 debugger icons, `error.tsx` link
  button, F3 FloatingBar glyph.
* **Verify each phase:** web `tsc --noEmit`, `eslint` on touched files,
  extension `build:chrome` after P3 (shared `ui` changes ship there too).
  No commits (user commits). No behavior changes except F10.

## 5. Standing conventions (for agents, effective after this refactor)

1. Clickable actions use shadcn `<Button>` with a variant/size; raw
   `<button>` only for bespoke one-offs (record fab, mic zone) with a
   comment saying why.
2. Links that look like buttons: `buttonVariants()` + `Link`.
3. Icons come only from `@workspace/ui/index`; never import `lucide-react`
   in app/feature code, never hand-draw standard glyphs.
4. Forms use system `Input`/`Checkbox`/`Label`/`Select`; native inputs only
   where no component exists (e.g. `<audio>`, MediaRecorder flows).
5. Do not invent system components (dialog/alert/progress/…) until a second
   real use case exists.
6. Conditional/composed class strings go through `cn()` (tailwind-merge
   conflict resolution); static classNames stay plain strings. Never
   template-literal ternaries — they ship both conflicting classes (e.g.
   `border-border` + `border-primary/40`) and leave the winner to source
   order.
7. `buttonVariants()` is server-safe **only** via
   `@workspace/ui/components/button-variants`. Never call it through the
   `button` module (a client module — the client-reference proxy throws
   at prerender and silently degrades the route to dynamic rendering).
   The interactive `<Button>` stays imported from `button` as before.
8. i18n static rendering: every server layout/page under `app/[locale]`
   that (transitively) renders translated Server Components must call
   `setRequestLocale(locale)` from its **own** `params` — the root locale
   layout's call does not reliably propagate through route groups during
   prerender (React `cache()` scope boundary; Turbopack-only, no warning).
   Without it, inherited-locale `getTranslations()` reads `headers()` and
   the route silently degrades to dynamic. Diagnose with
   `export const dynamic = "error"` (names the API) — never ship
   `force-static` (it masks real errors). Explicit-locale
   `getTranslations({locale})` (metadata) is unaffected. Client components
   need nothing (provider context).
9. Motion/position driven by physical transforms must carry an `rtl:`
   mirror (e.g. switch-thumb `translate-x` on checked). The flex row
   mirrors automatically but the transform does not — without the mirror
   the thumb exits the track in RTL. Base-UI direction-aware parts
   (slider, accordion root `dir`, popup placement) additionally need an
   explicit `DirectionProvider`, which does not read `document.dir` on its
   own and defaults to LTR. Provide it once per host (web
   `[locale]/layout.tsx`, extension `LocaleProvider`) via the shared
   `@workspace/ui/components/direction-provider` — never per-instance
   `dir=` overrides.
