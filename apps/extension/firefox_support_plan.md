# Firefox Support Plan — Katheera Extension

## Architecture Overview (Current Chrome-only Flow)

Before diving into the plan, here's the full data-flow as it stands today so every change is well-motivated.

```
Popup (index.html)
  │  chrome.runtime.sendMessage({action:"startMic"})
  ▼
background.js  (Service Worker — no DOM, no AudioContext)
  │  chrome.offscreen.createDocument("offscreen.html")
  ▼
offscreen.html  (hidden real page — has DOM, AudioContext, getUserMedia)
  │  embeds <iframe id="ei-sandbox" src="sandbox.html">
  │  captures mic → resamples audio → postMessage to iframe
  ▼
sandbox.html  (sandboxed iframe — CSP relaxed with 'unsafe-eval')
  │  loads Edge Impulse WASM model (needs eval/WASM)
  │  runs classifier.classify() → postMessage results back
  ▼
offscreen.ts  (receives results)
  │  chrome.runtime.sendMessage({action:"wordDetected", word})
  ▼
background.js  (updates storage + badge)
  ▼
Popup  (subscribes to storage changes, updates UI)
```

**Why this three-layer design existed:**
- Service Worker (Chrome MV3) → no DOM, no `AudioContext`
- Chrome CSP → `eval()` / WASM blocked everywhere except sandboxed pages

---

## Problem Analysis

### Problem 1 — `background.service_worker` not supported in Firefox

Firefox MV3 does **not** support `background.service_worker`. Firefox uses non-persistent **event pages** (background scripts with a real DOM context) instead. The fix is to use `background.scripts` in the Firefox manifest.

**Key difference**: Firefox background scripts run in a real page context, meaning they _do_ have access to `window`, `document`, `AudioContext`, `navigator.mediaDevices`, etc.

### Problem 2 — `offscreen` API does not exist in Firefox (and you don't need it)

`chrome.offscreen` is a Chrome-specific API introduced to paper over the Service Worker limitation. Firefox has no equivalent — and **you don't need one**.

Because Firefox's background script already runs in a full DOM context, the audio pipeline (`AudioContext` + `getUserMedia`) can run **directly in the background script**. The entire `offscreen.html/offscreen.ts` layer becomes unnecessary on Firefox.

> **You are correct.** Firefox doesn't need offscreen.

### Problem 3 — WASM / `eval()` in the sandbox

The sandbox iframe ([sandbox.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/sandbox.html)) with `'unsafe-eval'` was the only way to load the Edge Impulse WASM model in Chrome because:
- Chrome Service Worker → no DOM, no eval
- Chrome extension pages → CSP blocks eval
- Sandboxed iframe → CSP is separate, can allow `unsafe-eval`

In Firefox:
- Background scripts run in a page context with a more relaxed default CSP
- Firefox explicitly supports `'wasm-unsafe-eval'` in the `content_security_policy` directive (since Firefox 102)
- This means **WASM can run directly in the Firefox background page** — no sandbox iframe needed

> The sandboxed-iframe trick can be dropped entirely for Firefox.

### Problem 4 — `chrome.*` vs `browser.*` API namespace

All current code uses `chrome.*` directly:
- `chrome.runtime.sendMessage` / `onMessage`
- `chrome.storage.local`
- `chrome.action.setIcon` / `setBadgeText` / `setBadgeBackgroundColor`
- `chrome.offscreen.createDocument` / `closeDocument`
- `chrome.runtime.getContexts`
- `chrome.tabs.create`

Firefox supports the `browser.*` namespace natively (Promise-based). It does **not** guarantee `chrome.*` compatibility in all paths.

### Problem 5 — `chrome.runtime.getContexts` doesn't exist in Firefox

`chrome.runtime.getContexts()` is used in [background.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/background.js) to check if the offscreen document is active (i.e., to check mic status). This API does not exist in Firefox. Since we're removing offscreen on Firefox, we need a different state-tracking mechanism.

### Problem 6 — Manifest divergence

The two browsers need different [manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json) entries. Maintaining two separate manifests in the build is the clean approach.

### Problem 7 — Mic permission page ([permission.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/permission.html))

The current flow opens a new tab (`chrome.tabs.create`) to request mic permission. This is needed in Chrome because the Service Worker has no page context to show a browser prompt. In Firefox, `navigator.permissions.query` and `getUserMedia` may behave slightly differently from a background page. The permission page flow may still be needed (arguably for UX), but the mechanics need review.

### Problem 8 — `ScriptProcessorNode` is deprecated

`ScriptProcessorNode` (used in [offscreen.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/offscreen.ts)) is deprecated. This isn't Firefox-specific — it works on both — but since you're rewriting the audio layer anyway, this is a good moment to note it. No blocking issue, but worth flagging.

---

## The Plan

### Phase 1 — Browser Detection & API Abstraction Layer

**Goal:** Create a thin compatibility shim so the rest of the code uses one unified API without conditionals scattered everywhere.

**Files to create:**
- `src/utils/browser.ts` — a re-export that gives you the right namespace:

```ts
// src/utils/browser.ts
export const browserAPI = (
  typeof browser !== "undefined" ? browser : chrome
) as typeof browser;
```

Or use the official Mozilla polyfill:
- Install `webextension-polyfill` (`npm install webextension-polyfill`)
- This gives a unified `browser.*` Promise-based API on both Chrome and Firefox
- In Chrome MV3, `chrome.*` already returns Promises, so the polyfill mostly acts as a namespace wrapper

**Every file that currently uses `chrome.*` should be migrated to use `browserAPI.*` or `browser.*` from the polyfill.**

Affected files: [background.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/background.js), [src/offscreen.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/offscreen.ts), [src/routes/index.tsx](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/routes/index.tsx)

---

### Phase 2 — Dual Manifest Strategy

**Goal:** Generate a browser-specific [manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json) at build time.

Create two manifest files:
- `public/manifest.chrome.json` (current manifest, unchanged)
- `public/manifest.firefox.json` (Firefox-specific)

**`manifest.firefox.json` key differences:**

```json
{
  "manifest_version": 3,
  "name": "Katheera - Hands-Free Zikr Counter",
  "version": "1.0",
  "permissions": ["storage"],
  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "katheera@mohamedramadan.dev",
      "strict_min_version": "109.0"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

> [!IMPORTANT]
> Firefox **requires** a `browser_specific_settings.gecko.id` field for the extension to be installable. Without it, the extension cannot be permanently installed (only temporarily).

**Changes to [vite.config.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/vite.config.ts):**
- Add a `BROWSER` environment variable (`BROWSER=chrome` or `BROWSER=firefox`)
- In the `viteStaticCopy` plugin, conditionally copy `manifest.chrome.json` or `manifest.firefox.json` as [manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json)
- Add separate npm scripts: `build:chrome`, `build:firefox`

```ts
// vite.config.ts (conceptual)
const browser = process.env.BROWSER ?? "chrome";

viteStaticCopy({
  targets: [
    {
      src: `public/manifest.${browser}.json`,
      dest: ".",
      rename: "manifest.json",
    },
    // ...
  ],
})
```

---

### Phase 3 — Firefox Background Script (Replacing offscreen)

**Goal:** Create a Firefox-compatible background that handles audio directly, removing the need for [offscreen.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/offscreen.html).

**New file: `src/background.firefox.ts`**

This script replaces the Chrome `background.js + offscreen.ts` combo. It:
1. Has full DOM access (Firefox background pages are real pages)
2. Can create `AudioContext` and call `getUserMedia` directly
3. Still needs the sandboxed iframe for WASM — **OR** can load WASM directly if `'wasm-unsafe-eval'` is in the CSP

**Two sub-options for WASM in Firefox:**

**Option A — Keep sandbox iframe in Firefox background page** (simpler, safer)
- The Firefox background page is a real HTML page, so it can embed an iframe
- The sandbox iframe approach still works — just the _hosting_ changes (background page instead of offscreen page)
- Less code change, more confidence in WASM compatibility

**Option B — Load WASM directly in background page** (cleaner, fewer layers)
- Add `'wasm-unsafe-eval'` to CSP in the Firefox manifest
- Load the Edge Impulse model directly in the background script (no iframe)
- Eliminates the `postMessage` bridge entirely
- Simpler overall architecture

> **Recommendation: Start with Option A** for safety and minimal diff. Then consider Option B as a follow-up optimization. The Edge Impulse WASM runtime uses `eval`/`new Function` internally, so you need to be sure `'wasm-unsafe-eval'` is sufficient — test before committing.

**State tracking (replaces `chrome.runtime.getContexts`):**
Since `getContexts()` doesn't exist in Firefox, track mic state with a simple boolean in the background script's module scope:

```ts
// background.firefox.ts
let isMicActive = false;

// When starting: isMicActive = true;
// When stopping: isMicActive = false;
// On checkMicStatus message: sendResponse({ isActive: isMicActive });
```

This is simpler and more reliable than querying contexts.

---

### Phase 4 — Vite Build Pipeline Updates

**Goal:** The build system must output browser-specific bundles cleanly.

**Changes needed in [vite.config.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/vite.config.ts):**

1. **Conditional entry points:** Don't include [offscreen.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/offscreen.html) in the Firefox build
   ```ts
   input: {
     main: "./index.html",
     sandbox: "./sandbox.html",
     ...(browser === "chrome" ? { offscreen: "./offscreen.html" } : {}),
     ...(browser === "firefox" ? { background: "./src/background.firefox.ts" } : {}),
   }
   ```

2. **Background script output:** Firefox background scripts need to be plain [.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/eslint.config.js) files (not module chunks with hashed filenames). Configure Rollup to output [background.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/background.js) with a stable name.

3. **Separate output dirs:** 
   - `build/chrome/` for Chrome
   - `build/firefox/` for Firefox
   
   Or keep them separate via build script orchestration.

4. **npm scripts in [package.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/package.json):**
   ```json
   "build:chrome": "BROWSER=chrome tsc -b && vite build",
   "build:firefox": "BROWSER=firefox tsc -b && vite build",
   "build": "npm run build:chrome && npm run build:firefox"
   ```

---

### Phase 5 — Popup & Permission Flow Adjustments

**Goal:** Make the popup work correctly in Firefox.

**[src/routes/index.tsx](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/routes/index.tsx) changes:**

1. Replace `chrome.runtime.sendMessage` with the polyfill's `browser.runtime.sendMessage`
2. Replace `chrome.tabs.create` with `browser.tabs.create`
3. The `checkMicStatus` handler: since Firefox background returns `isMicActive` boolean directly, this already works — no change needed structurally

**Mic permission flow on Firefox:**
- Firefox does **not** require a separate permission page. The background script can call `getUserMedia` directly and Firefox will show a native permission prompt.
- However, extensions calling `getUserMedia` from a background script in Firefox _may_ still require explicit `"microphone"` permission in the manifest (under `permissions`) and, depending on the context, may present differently.
- The existing [permission.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/permission.html) + [permission.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/permission.js) page approach is still valid as a UX fallback. Keep it for now and test in Firefox.

> [!NOTE]
> Firefox extensions require the `"microphone"` permission in [manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json) to call `getUserMedia` from a background script if the user hasn't granted it via a page prompt. Add `"microphone"` to the Firefox manifest's `permissions` array and test this flow carefully.

---

## Summary of All File Changes

| File | Chrome | Firefox | Action |
|---|---|---|---|
| [public/manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json) | Rename to `manifest.chrome.json` | New `manifest.firefox.json` | Split into two manifests |
| [public/background.js](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/background.js) | Unchanged | Not used | Keep as-is for Chrome |
| `src/background.firefox.ts` | Not used | **New file** | Full Firefox background |
| [src/offscreen.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/offscreen.ts) | Unchanged | Not used | Chrome only |
| [offscreen.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/offscreen.html) | Unchanged | Excluded from build | Chrome only |
| [sandbox.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/sandbox.html) | Unchanged | Included (Option A) | Both browsers |
| [src/sandbox.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/sandbox.ts) | Unchanged | Unchanged | Both browsers |
| [src/routes/index.tsx](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/src/routes/index.tsx) | Use polyfill | Use polyfill | Migrate `chrome.*` → `browser.*` |
| `public/permission.html/js` | Unchanged | Keep, test | Both browsers |
| [vite.config.ts](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/vite.config.ts) | Updated | Updated | Conditional build |
| [package.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/package.json) | Updated | Updated | New build scripts |
| `src/utils/browser.ts` | **New** | **New** | API shim |

---

## Issues You Correctly Identified ✅

| Your Point | Verdict |
|---|---|
| Firefox doesn't support `background.service_worker` | ✅ Correct — use `background.scripts` |
| Offscreen not needed in Firefox | ✅ Correct — Firefox background has DOM |
| `chrome` vs `browser` namespace | ✅ Correct — needs polyfill or shim |

## Issues You Missed (Bonus Points) 🔍

| Issue | Details |
|---|---|
| `chrome.runtime.getContexts()` missing in Firefox | Used to check if offscreen/mic is active — needs replacement |
| `browser_specific_settings.gecko.id` required | Firefox won't allow permanent install without it |
| `"microphone"` permission in Firefox manifest | May be needed for `getUserMedia` from background |
| `ScriptProcessorNode` deprecated | Doesn't block Firefox, but worth upgrading to `AudioWorkletProcessor` eventually |
| WASM `'wasm-unsafe-eval'` CSP directive | Needed explicitly in Firefox manifest if running WASM outside sandbox |
| Firefox build output format | Background scripts need stable filenames (not hashed chunks) |
| Sandbox API (`manifest.sandbox`) | Firefox does **not** support the `sandbox` key in MV3 manifests — the sandbox iframe still works as a resource, but the manifest key must be removed for Firefox |

> [!CAUTION]
> The `"sandbox"` key in [manifest.json](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/public/manifest.json) is Chrome-specific. **It must be omitted from the Firefox manifest.** The [sandbox.html](file:///Users/mohamedramadan/dev/oss/Zikr/apps/extension/sandbox.html) page itself can still exist as a `web_accessible_resource` and be embedded as an iframe — the manifest key just won't be there.

---

## Recommended Implementation Order

1. **Phase 2 first** — Split the manifest. This is the foundation everything else depends on.
2. **Phase 1** — Add the API polyfill so you stop worrying about `chrome.*` vs `browser.*` throughout.
3. **Phase 3** — Write `background.firefox.ts` (the core of the port).
4. **Phase 4** — Update Vite build to produce two bundles.
5. **Phase 5** — Test popup and permission flow in Firefox, fix any issues.
