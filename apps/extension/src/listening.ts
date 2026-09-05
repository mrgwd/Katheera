/**
 * listening.ts — Firefox audio host page
 *
 * This page runs in a real browser tab, which means getUserMedia works.
 * It captures mic audio via an AudioWorkletNode, resamples each 1-second
 * window to 16 kHz, and sends it to the background script via
 * runtime.sendMessage. The background script owns the model (via sandbox
 * iframe) and handles inference + storage + badge.
 *
 * Lifecycle:
 *   1. Page loads → sends "listeningPageReady" to background
 *   2. Background responds with "startAudio" once model is ready
 *   3. Page calls getUserMedia and starts streaming audio windows
 *   4. Tab closed (or Stop button clicked) → stopListening() + notify background
 */

import {
  TARGET_SAMPLE_RATE,
} from "@workspace/audio-processing/constants";
import { resampleAudio } from "@workspace/audio-processing/utils";
import { ext } from "./utils/browser";

// ─── State ────────────────────────────────────────────────────────────────────

let audioContext: AudioContext | null = null;
let stream: MediaStream | null = null;
let workletNode: AudioWorkletNode | null = null;
let isListening = false;

// ─── Audio pipeline ───────────────────────────────────────────────────────────

async function startListening(): Promise<void> {
  if (isListening) return;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    const AudioCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext!;

    audioContext = new AudioCtor();
    const sampleRate = audioContext.sampleRate;
    const source = audioContext.createMediaStreamSource(stream);

    // Load the AudioWorklet processor
    await audioContext.audioWorklet.addModule(
      "worklets/zikr-audio-processor.worklet.js",
    );
    console.log("[FF Listening] AudioWorklet loaded");

    workletNode = new AudioWorkletNode(audioContext, "zikr-audio-processor");

    // Receive 1-second windows from the audio thread
    workletNode.port.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== "audio-window") return;

      const rawSamples = new Float32Array(event.data.samples);

      // Resample to 16 kHz (same pattern as web app)
      const resampled = resampleAudio(rawSamples, sampleRate, TARGET_SAMPLE_RATE);

      // Send audio chunk to background for inference
      ext.runtime.sendMessage({
        action: "audioChunk",
        data: Array.from(resampled), // serialisable for sendMessage
      }).catch(() => {
        // Background may have unloaded — stop gracefully
        stopListening();
      });
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
    isListening = true;
    console.log("[FF Listening] Audio pipeline started (AudioWorklet)");
  } catch (err) {
    console.error("[FF Listening] getUserMedia failed:", err);
    ext.runtime.sendMessage({ action: "listeningPageError", error: (err as Error).message });
  }
}

function stopListening(): void {
  if (workletNode) {
    workletNode.port.close();
    workletNode.disconnect();
    workletNode = null;
  }
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  audioContext?.close();
  audioContext = null;
  isListening = false;
  console.log("[FF Listening] Stopped");
}

// ─── Stop button ──────────────────────────────────────────────────────────────

document.getElementById("stopBtn")?.addEventListener("click", () => {
  stopListening();
  ext.runtime.sendMessage({ action: "stopMic" });
  window.close();
});

// ─── Tab close — notify background ───────────────────────────────────────────

window.addEventListener("beforeunload", () => {
  stopListening();
  // sendMessage may not complete before unload but best-effort is fine —
  // background also tracks tab ID and detects removal via tabs.onRemoved
  ext.runtime.sendMessage({ action: "listeningPageClosed" });
});

// ─── Listen for commands from background ─────────────────────────────────────

ext.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as { action: string };
  if (msg.action === "startAudio") {
    startListening();
  } else if (msg.action === "stopAudio") {
    stopListening();
    window.close();
  }
});

// ─── Boot: tell background we are ready ──────────────────────────────────────

ext.runtime.sendMessage({ action: "listeningPageReady" });