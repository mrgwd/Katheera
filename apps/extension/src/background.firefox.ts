/**
 * background.firefox.ts — Firefox MV3 Background Script
 *
 * Architecture (Firefox-specific):
 *
 *   [listening.html tab]          [background event page]         [sandbox iframe]
 *   getUserMedia                       (this file)               edge-impulse WASM
 *   AudioContext                  ┌─────────────────────┐
 *   ScriptProcessor  ──audioChunk→│ receive audio chunk │
 *                                 │ forward to sandbox  │──AUDIO_DATA postMessage→ classify()
 *                                 │ receive result      │←─INFERENCE_RESULT────────
 *                                 │ storage + badge     │
 *                                 └─────────────────────┘
 *
 * Why this shape:
 *   - Firefox blocks getUserMedia from background event pages (intentional security design)
 *   - Firefox blocks new Function() in extension pages (MV3 CSP) — model must run in sandbox iframe
 *   - listening.html is a real tab → getUserMedia works
 *   - sandbox iframe in background page → model's eval/new Function allowed (after source patch)
 *
 * Lifecycle:
 *   startMic()
 *     1. ensureSandboxFrame() — inject sandbox iframe, wait for MODEL_LOADED
 *     2. openListeningTab()   — open listening.html tab
 *     3. listening.html sends "listeningPageReady"
 *     4. background sends "startAudio" back to that tab
 *     5. listening.html streams audioChunk messages
 *     6. background forwards each chunk to sandbox iframe via postMessage
 *     7. sandbox sends INFERENCE_RESULT back
 *     8. background updates storage + badge
 *
 *   stopMic()
 *     - sends "stopAudio" to listening tab → tab closes itself
 *     - OR tab closed by user → tabs.onRemoved fires → background cleans up
 */

import { COOLDOWN_MS } from "@workspace/audio-processing/constants";
import { ext } from "./utils/browser";
import { processClassifierResult } from "@workspace/audio-processing/utils";

// ─── State ────────────────────────────────────────────────────────────────────

let isMicActive = false;
let isSandboxReady = false;
let listeningTabId: number | null = null;
let lastDetectionTime: Record<string, number> = {};
let sandboxFrame: HTMLIFrameElement | null = null;

let sandboxReadyResolve: (() => void) | null = null;
let sandboxReadyReject: ((e: Error) => void) | null = null;
let tabReadyResolve: (() => void) | null = null;
let tabReadyReject: ((e: Error) => void) | null = null;

// ─── Icon / badge ─────────────────────────────────────────────────────────────

const ICONS = {
  default: { 16: "icons/default16.png", 32: "icons/default32.png" },
  listening: { 16: "icons/listening16.png", 32: "icons/listening32.png" },
} as const;

async function updateIcon(isListening: boolean) {
  await ext.action.setIcon({
    path: isListening ? ICONS.listening : ICONS.default,
  });
}

function updateBadge(text: string) {
  ext.action.setBadgeText({ text });
  ext.action.setBadgeBackgroundColor({ color: "#368c39" });
}

// ─── Sandbox iframe (model host) ──────────────────────────────────────────────

function ensureSandboxFrame(): Promise<void> {
  if (isSandboxReady) return Promise.resolve();

  if (!sandboxFrame) {
    const frame = document.createElement("iframe");
    frame.id = "ei-sandbox";
    frame.src = ext.runtime.getURL("sandbox.html");
    frame.style.display = "none";
    // No sandbox attribute — runs as extension origin so postMessage works.
    // new Function() calls in the EI model are patched in the source file.
    document.body.appendChild(frame);
    sandboxFrame = frame;
  }

  return new Promise((resolve, reject) => {
    sandboxReadyResolve = resolve;
    sandboxReadyReject = reject;
    setTimeout(() => reject(new Error("Sandbox model load timed out")), 20_000);
  });
}

// ─── Sandbox postMessage handler ──────────────────────────────────────────────

window.addEventListener("message", (event) => {
  const { type, results, error } = event.data as {
    type: string;
    results?: Array<{ label: string; value: number }>;
    error?: string;
  };

  if (type === "MODEL_LOADED") {
    console.log("[FF BG] Model ready");
    isSandboxReady = true;
    sandboxReadyResolve?.();
    sandboxReadyResolve = null;
    sandboxReadyReject = null;
  } else if (type === "ERROR") {
    console.error("[FF BG] Sandbox error:", error);
    sandboxReadyReject?.(new Error(error ?? "Sandbox error"));
    sandboxReadyResolve = null;
    sandboxReadyReject = null;
  } else if (type === "INFERENCE_RESULT" && results) {
    handleInferenceResults(results);
  }
});

// ─── Inference handler ────────────────────────────────────────────────────────

function handleInferenceResults(
  results: Array<{ label: string; value: number }>,
) {
  const detectedLabel =
    processClassifierResult({ results } as never)?.label ?? null;
  if (
    !detectedLabel ||
    detectedLabel === "noise" ||
    detectedLabel === "unknown"
  )
    return;

  const now = Date.now();
  if (now - (lastDetectionTime[detectedLabel] ?? 0) < COOLDOWN_MS) return;
  lastDetectionTime[detectedLabel] = now;

  console.log(`[FF BG] Detected: ${detectedLabel}`);

  ext.storage.local.get([detectedLabel]).then((result) => {
    const newCount = ((result[detectedLabel] as number) ?? 0) + 1;
    ext.storage.local.set({ [detectedLabel]: newCount }).then(() => {
      updateBadge(newCount.toString());
    });
  });
}

// ─── Listening tab ────────────────────────────────────────────────────────────

function openListeningTab(): Promise<void> {
  return new Promise((resolve, reject) => {
    tabReadyResolve = resolve;
    tabReadyReject = reject;
    setTimeout(
      () => reject(new Error("Listening tab did not respond in time")),
      15_000,
    );

    ext.tabs
      .create({ url: ext.runtime.getURL("listening.html") })
      .then((tab) => {
        listeningTabId = tab.id ?? null;
      });
  });
}

function closeListeningTab() {
  if (listeningTabId !== null) {
    ext.tabs.remove(listeningTabId).catch(() => {});
    listeningTabId = null;
  }
}

// Detect when the user manually closes the listening tab
ext.tabs.onRemoved.addListener((tabId) => {
  if (tabId === listeningTabId) {
    console.log("[FF BG] Listening tab closed by user");
    listeningTabId = null;
    isMicActive = false;
    lastDetectionTime = {};
    updateIcon(false);
    updateBadge("");
  }
});

// ─── startMic / stopMic ───────────────────────────────────────────────────────

async function startMic(): Promise<{ success: boolean; error?: string }> {
  if (isMicActive) return { success: true };

  try {
    await ensureSandboxFrame(); // wait for model
    await openListeningTab(); // wait for tab ready signal
    isMicActive = true;
    updateIcon(true);
    return { success: true };
  } catch (err: unknown) {
    isMicActive = false;
    closeListeningTab();
    updateIcon(false);
    return { success: false, error: (err as Error).message };
  }
}

function stopMic() {
  if (listeningTabId !== null) {
    ext.tabs.sendMessage(listeningTabId, { action: "stopAudio" }).catch(() => {
      closeListeningTab();
    });
  }
  isMicActive = false;
  lastDetectionTime = {};
  updateIcon(false);
  updateBadge("");
}

// ─── Message handler ──────────────────────────────────────────────────────────

ext.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as { action: string; data?: number[]; error?: string };

  if (msg.action === "startMic") return startMic();
  if (msg.action === "checkMicStatus")
    return Promise.resolve({ isActive: isMicActive });

  if (msg.action === "stopMic") {
    stopMic();
    return Promise.resolve({ success: true });
  }

  if (msg.action === "listeningPageReady") {
    console.log("[FF BG] Listening page ready — sending startAudio");
    if (listeningTabId !== null) {
      ext.tabs
        .sendMessage(listeningTabId, { action: "startAudio" })
        .catch(console.error);
    }
    tabReadyResolve?.();
    tabReadyResolve = null;
    tabReadyReject = null;
    return;
  }

  if (msg.action === "listeningPageClosed") {
    listeningTabId = null;
    isMicActive = false;
    lastDetectionTime = {};
    updateIcon(false);
    updateBadge("");
    return;
  }

  if (msg.action === "listeningPageError") {
    console.error("[FF BG] Listening page error:", msg.error);
    tabReadyReject?.(new Error(msg.error ?? "Unknown error"));
    tabReadyResolve = null;
    tabReadyReject = null;
    isMicActive = false;
    updateIcon(false);
    return;
  }

  if (msg.action === "audioChunk" && msg.data) {
    if (!sandboxFrame?.contentWindow) return;
    const samples = new Float32Array(msg.data);
    sandboxFrame.contentWindow.postMessage(
      { type: "AUDIO_DATA", data: samples },
      "*",
    );
    return;
  }
});

// ─── Boot: preload model so first click is instant ───────────────────────────

ensureSandboxFrame().catch((err) => {
  console.error("[FF BG] Model preload failed:", err);
});

// /**
//  * background.firefox.ts — Firefox MV3 Background Script
//  *
//  * Firefox background scripts run in a real Event Page (full DOM), so we can:
//  *   - Create AudioContext and call getUserMedia directly (no offscreen needed)
//  *   - Embed a sandboxed iframe to host the Edge Impulse WASM model
//  *
//  * The WASM model uses new Function() / eval() internally (Emscripten embind),
//  * which Firefox MV3 blocks in extension pages even with 'unsafe-eval' in CSP.
//  * The only reliable escape hatch is a sandboxed iframe — its CSP is independent
//  * and can allow eval. This is exactly the same approach as Chrome's offscreen
//  * + sandbox setup, just collapsed into one layer (background page hosts iframe).
//  *
//  * Data flow:
//  *   background page
//  *     → getUserMedia → AudioContext → ScriptProcessor
//  *     → postMessage(AUDIO_DATA) → sandbox iframe
//  *     → classifier.classify() → postMessage(INFERENCE_RESULT)
//  *     → background page handles detection → storage + badge
//  */

// import {
//   COOLDOWN_MS,
//   TARGET_SAMPLE_RATE,
// } from "@workspace/audio-processing/constants";
// import { ext } from "./utils/browser";
// import {
//   resampleAudio,
//   processClassifierResult,
// } from "@workspace/audio-processing/utils";

// // ─── State ────────────────────────────────────────────────────────────────────

// let isMicActive = false;
// let isSandboxReady = false;
// let lastDetectionTime: Record<string, number> = {};
// let audioContext: AudioContext | null = null;
// let stream: MediaStream | null = null;
// let processor: ScriptProcessorNode | null = null;
// let sandboxFrame: HTMLIFrameElement | null = null;

// // Queued resolve/reject from startMic while we wait for MODEL_LOADED
// let pendingStartResolve: (() => void) | null = null;
// let pendingStartReject: ((err: Error) => void) | null = null;

// // ─── Icon / badge helpers ─────────────────────────────────────────────────────

// const ICONS = {
//   default: { 16: "icons/default16.png", 32: "icons/default32.png" },
//   listening: { 16: "icons/listening16.png", 32: "icons/listening32.png" },
// } as const;

// async function updateIcon(isListening: boolean) {
//   await ext.action.setIcon({
//     path: isListening ? ICONS.listening : ICONS.default,
//   });
// }

// function updateBadge(text: string) {
//   ext.action.setBadgeText({ text });
//   ext.action.setBadgeBackgroundColor({ color: "#368c39" });
// }

// // ─── Sandbox iframe ───────────────────────────────────────────────────────────
// // The background page is a real HTML page in Firefox, so we can inject an
// // iframe into its document. sandbox.html loads the EI model scripts which
// // need eval — inside the iframe their CSP is governed by the sandbox attribute,
// // not the extension page CSP.

// function ensureSandboxFrame(): HTMLIFrameElement {
//   if (sandboxFrame) return sandboxFrame;

//   const frame = document.createElement("iframe");
//   frame.id = "ei-sandbox";
//   frame.src = ext.runtime.getURL("sandbox.html");
//   frame.style.display = "none";
//   // allow-scripts is required; omitting allow-same-origin keeps it isolated
// frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
//   document.body.appendChild(frame);
//   sandboxFrame = frame;
//   return frame;
// }

// // ─── Sandbox message handler ──────────────────────────────────────────────────

// window.addEventListener("message", (event) => {
//   const { type, results, error } = event.data as {
//     type: string;
//     results?: Array<{ label: string; value: number }>;
//     error?: string;
//   };

//   if (type === "MODEL_LOADED") {
//     console.log("[FF BG] Sandbox model loaded");
//     isSandboxReady = true;
//     if (pendingStartResolve) {
//       pendingStartResolve();
//       pendingStartResolve = null;
//       pendingStartReject = null;
//     }
//   } else if (type === "ERROR") {
//     console.error("[FF BG] Sandbox error:", error);
//     if (pendingStartReject) {
//       pendingStartReject(new Error(error ?? "Sandbox model error"));
//       pendingStartResolve = null;
//       pendingStartReject = null;
//     }
//   } else if (type === "INFERENCE_RESULT" && results) {
//     handleInferenceResults(results);
//   }
// });

// // ─── Inference result handler ─────────────────────────────────────────────────

// function handleInferenceResults(
//   results: Array<{ label: string; value: number }>,
// ) {
//   const detectedLabel = processClassifierResult({ results } as never);

//   if (
//     !detectedLabel ||
//     detectedLabel === "noise" ||
//     detectedLabel === "unknown"
//   )
//     return;

//   const now = Date.now();
//   if (now - (lastDetectionTime[detectedLabel] ?? 0) < COOLDOWN_MS) return;

//   lastDetectionTime[detectedLabel] = now;
//   console.log(`[FF BG] Detected: ${detectedLabel}`);

//   ext.storage.local.get([detectedLabel]).then((result) => {
//     const newCount = ((result[detectedLabel] as number) ?? 0) + 1;
//     ext.storage.local.set({ [detectedLabel]: newCount }).then(() => {
//       updateBadge(newCount.toString());
//     });
//   });
// }

// // ─── Audio pipeline ───────────────────────────────────────────────────────────

// async function startListening(): Promise<void> {
//   stream = await navigator.mediaDevices.getUserMedia({
//     audio: {
//       echoCancellation: true,
//       noiseSuppression: true,
//       autoGainControl: true,
//       channelCount: 1,
//     },
//   });

//   const AudioCtor =
//     window.AudioContext ??
//     (window as Window & { webkitAudioContext?: typeof AudioContext })
//       .webkitAudioContext!;

//   audioContext = new AudioCtor();
//   const sampleRate = audioContext.sampleRate;
//   const source = audioContext.createMediaStreamSource(stream);

//   // ScriptProcessorNode is deprecated but universally supported.
//   // AudioWorklet requires a separate .js file which complicates the
//   // Firefox background page setup — ScriptProcessor is fine here.
//   const bufferSize = 4096;
//   processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

//   const continuousBuffer: number[] = [];

//   processor.onaudioprocess = (e) => {
//     if (!isSandboxReady || !sandboxFrame?.contentWindow) return;

//     const inputData = e.inputBuffer.getChannelData(0);
//     for (let i = 0; i < inputData.length; i++) {
//       continuousBuffer.push(inputData[i]);
//     }

//     const oneSec = sampleRate;
//     if (continuousBuffer.length >= oneSec) {
//       const oneSecWindow = continuousBuffer.slice(0, oneSec);
//       const slideAmount = Math.floor(sampleRate * 0.25);
//       continuousBuffer.splice(0, slideAmount);

//       const resampled = resampleAudio(
//         new Float32Array(oneSecWindow),
//         sampleRate,
//         TARGET_SAMPLE_RATE,
//       );

//       sandboxFrame.contentWindow.postMessage(
//         { type: "AUDIO_DATA", data: resampled },
//         "*",
//       );
//     }
//   };

//   source.connect(processor);
//   processor.connect(audioContext.destination);
//   console.log("[FF BG] Audio pipeline started");
// }

// function stopListening(): void {
//   processor?.disconnect();
//   processor = null;

//   stream?.getTracks().forEach((t) => t.stop());
//   stream = null;

//   audioContext?.close();
//   audioContext = null;

//   isMicActive = false;
//   lastDetectionTime = {};
//   console.log("[FF BG] Mic stopped");
// }

// // ─── Start sequence ───────────────────────────────────────────────────────────
// // 1. Inject sandbox iframe (model loads automatically via sandbox.html)
// // 2. Wait for MODEL_LOADED message
// // 3. Start audio pipeline

// function waitForSandbox(): Promise<void> {
//   if (isSandboxReady) return Promise.resolve();
//   return new Promise((resolve, reject) => {
//     pendingStartResolve = resolve;
//     pendingStartReject = reject;
//     // Timeout after 15s in case sandbox never responds
//     setTimeout(
//       () => reject(new Error("Sandbox model load timed out")),
//       15_000,
//     );
//   });
// }

// async function startMic(): Promise<{ success: boolean; error?: string }> {
//   if (isMicActive) return { success: true };

//   isMicActive = true;
//   updateIcon(true);

//   try {
//     ensureSandboxFrame(); // inject iframe if not already there
//     await waitForSandbox(); // wait for MODEL_LOADED
//     await startListening(); // start audio
//     return { success: true };
//   } catch (err: unknown) {
//     isMicActive = false;
//     updateIcon(false);
//     return { success: false, error: (err as Error).message };
//   }
// }

// // ─── Message handler ──────────────────────────────────────────────────────────

// type BgMessage = { action: string };

// ext.runtime.onMessage.addListener(async (message: unknown) => {
//   const req = message as BgMessage;

//   if (req.action === "startMic") {
//     return startMic();
//   }

//   if (req.action === "stopMic") {
//     stopListening();
//     updateIcon(false);
//     updateBadge("");
//     return { success: true };
//   }

//   if (req.action === "checkMicStatus") {
//     return { isActive: isMicActive };
//   }
// });

// // ─── Boot: pre-inject sandbox so model is warm before first click ─────────────

// ensureSandboxFrame();
