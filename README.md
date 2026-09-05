  <div align="center"> <img width="36" height="36" alt="image"  src="https://raw.githubusercontent.com/mrgwd/i18n-boost/main/src/images/icon.webp"> <h1>Katheera: AI Sebha</h1> </div>

Katheera is a browser extension and web app that automatically detects and counts your azkar as you say them. no tapping, no clicking, no interruptions to your worship.

## Features

- 🎙️ **Truly hands-free**: just speak your azkar naturally
- 🔒 **On-device AI**: your voice never leaves your browser
- ⚡ **Lightweight**: ~5 MB model, no heavy downloads
- 📴 **Offline**: model runs locally after first load
- 🔢 **Auto-counts**: detects سبحان الله، الحمد لله, and more (growing list)
- 📅 **Daily reset**: counts reset each day automatically

## How It Works

Katheera uses a custom AI model trained specifically on Arabic zikr phrases. The model runs entirely inside your browser using WebAssembly — no server, no cloud, no subscriptions.

## What "Katheera" means?

The name comes from a pattern found throughout the Quran — wherever Allah ﷻ mentions remembrance (zikr), it is almost always paired with the word **كثيرا** (katheera — _a lot_):

> يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا
>
> وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ

### The Journey to On-Device AI

The detection engine went through several iterations before landing on the current approach:

| Approach                  | Verdict       | Reason                                                                |
| ------------------------- | ------------- | --------------------------------------------------------------------- |
| Web Speech API            | ❌ Dropped    | Chrome/Edge only; needs internet; breaks on tab switch / screen lock  |
| Google Speech-to-Text     | ❌ Dropped    | Paid service — goes against the spirit of the app                     |
| Pre-trained Vosk model    | ❌ Dropped    | 100s of MB; scored only 40/100 vs Web Speech API's 89/100 accuracy    |
| Custom Edge Impulse model | ✅ **Chosen** | ~5 MB, accurate, offline-capable, private, free, works on all devices |

The custom model is trained with diverse samples (varying distance, tone, mic hardware) and achieves accuracy comparable to the Web Speech API while working entirely offline.

## Architecture

### Chrome

```
Popup (index.html)
  │  sendMessage({action:"startMic"})
  ▼
background.js  (Service Worker)
  │  chrome.offscreen.createDocument()
  ▼
offscreen.html  (hidden DOM page — AudioContext, getUserMedia)
  │  captures mic → resamples audio → postMessage to iframe
  ▼
sandbox.html  (sandboxed iframe — relaxed CSP for WASM)
  │  loads Edge Impulse WASM model → runs classifier
  │  postMessage results back
  ▼
offscreen.ts  → background.js  → storage + badge
  ▼
Popup  (subscribes to storage changes, updates UI)
```

## Tech Stack

### Extension

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Router** (hash history for extension popups)
- **Edge Impulse** WASM model (~5 MB)
- **webextension-polyfill** for cross-browser API compatibility

### Web App

- **Next.js** (deployed at [katheera.mohamedramadan.dev](https://katheera.mohamedramadan.dev))
- Same design system and shared packages via monorepo

### Monorepo

Built with **Turborepo**. Shared packages include:

- `@workspace/model` — Edge Impulse types and model assets
- `@workspace/audio-processing` — resampling, classifier utilities
- `@workspace/azkar` — azkar definitions and helpers
- `@workspace/ui` — shared React components
- `@workspace/lib` — storage utilities (daily reset, count sync)

## Project Structure

```
apps/
  extension/          # Chrome/Firefox browser extension
  web/                # Next.js landing page & privacy policy
packages/
  model/              # Edge Impulse WASM model + types
  audio-processing/   # Audio resampling & inference utilities
  azkar/              # Azkar constants & helpers
  ui/                 # Shared UI components
  lib/                # Shared storage & logic
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install dependencies

```bash
pnpm install
```

### Build the extension

```bash
# Chrome (default)
pnpm --filter extension build:chrome

# Firefox
pnpm --filter extension build:firefox

# Both
pnpm --filter extension build
```

Build output is placed in `apps/extension/build/chrome/` and `apps/extension/build/firefox/`.

### Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `apps/extension/build/chrome/`

### Load in Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** → select any file inside `apps/extension/build/firefox/`

## Supported Azkar

| Zikr       | Status       |
| ---------- | ------------ |
| سبحان الله | ✅ Supported |
| الحمد لله  | ✅ Supported |
| الله أكبر  | ✅ Supported |

More azkar are planned. The model is retrained and improved continuously.

## Privacy

Your voice is processed entirely on your device. No audio is sent to any server. No account required. No ads. No tracking.

Read the full [Privacy Policy](https://katheera.mohamedramadan.dev/privacy).

## Roadmap

- [x] Complete الله أكبر detection
- [ ] Add لا إله إلا الله and لا حول ولا قوة إلا بالله
- [ ] Firefox stable release
- [ ] Session history and statistics
- [ ] Customizable daily targets

## Contributing

This project is currently in early development. If you want to contribute azkar audio samples (to improve model accuracy) or have feedback, reach out via the website.

## License

Personal project by [Mohamed Ramadan](https://mohamedramadan.dev). All rights reserved.
