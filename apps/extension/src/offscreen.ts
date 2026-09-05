// This script runs in the offscreen document (Chrome only)

import {
  COOLDOWN_MS,
  SAME_ZIKR_COOLDOWN_MS,
  TARGET_SAMPLE_RATE,
} from "@workspace/audio-processing/constants";
import { ext } from "./utils/browser";
import {
  resampleAudio,
  processAudio,
  processClassifierResult,
} from "@workspace/audio-processing/utils";
import {
  DEFAULT_SETTINGS,
  loadSettingsAsync,
  subscribeSettings,
  type AppSettings,
} from "@workspace/lib/settings";
import type {
  EdgeImpulseResult,
  EdgeImpulseResultItem,
  WindowWithAudioCtx,
} from "@workspace/model/types";

(async () => {
  console.log("Offscreen script running - AudioWorklet version");

  // ── Live settings (updated via chrome.storage.onChanged) ─────────────
  let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };
  try {
    currentSettings = await loadSettingsAsync();
    console.log("Offscreen: settings loaded", currentSettings);
  } catch (e) {
    console.warn("Offscreen: failed to load settings, using defaults", e);
  }
  // Keep settings up-to-date without requiring a mic restart
  const unsubscribeSettings = subscribeSettings((updated) => {
    console.log("Offscreen: settings updated", updated);
    currentSettings = updated;
  });

  let activeZikrLabel: string | null = null;
  let activeZikrTime: number = 0;
  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let isSandboxReady = false;

  // Holds the last resampled and processed audio windows for debugging
  let lastResampledAudio: number[] = [];
  let lastProcessedAudio: number[] = [];

  const sandboxFrame = document.getElementById(
    "ei-sandbox",
  ) as HTMLIFrameElement | null;

  console.log("Bridge: Sandbox frame element:", sandboxFrame);

  // Handle messages from sandbox
  window.addEventListener("message", (event) => {
    const { type, results, error } = event.data;

    if (type === "MODEL_LOADED") {
      console.log("Bridge: Sandbox model loaded");
      isSandboxReady = true;
      startListening();
    } else if (type === "ERROR") {
      console.error("Bridge: Sandbox error:", error);
    } else if (type === "INFERENCE_RESULT") {
      handleInferenceResults(results);
    }
  });

  const handleInferenceResults = (results: EdgeImpulseResultItem[]) => {
    console.log("Bridge: Received inference results:", results);

    // Use live confidenceThreshold from settings
    const detectedLabel =
      processClassifierResult(
        { results } as EdgeImpulseResult,
        currentSettings.confidenceThreshold,
      )?.label ?? null;

    if (detectedLabel) {
      console.log(`Bridge: Detected Label: ${detectedLabel}`);
    }

    if (
      detectedLabel &&
      detectedLabel !== "noise" &&
      detectedLabel !== "unknown"
    ) {
      const now = Date.now();

      if (activeZikrLabel === detectedLabel) {
        if (now - activeZikrTime < SAME_ZIKR_COOLDOWN_MS) {
          return;
        }
      } else if (activeZikrLabel !== null) {
        if (now - activeZikrTime < COOLDOWN_MS) {
          console.log(
            `Bridge: Switch cooldown active, ignoring ${detectedLabel}`,
          );
          return;
        }
      }

      activeZikrLabel = detectedLabel;
      activeZikrTime = now;

      console.log(`Detected: ${detectedLabel}`);

      ext.runtime.sendMessage({
        action: "wordDetected",
        word: detectedLabel,
      });
    }

    // Forward debug data to the popup (dev only — no debugger in prod,
    // and the Array copies below are wasted otherwise).
    if (import.meta.env.DEV) {
      ext.runtime
        .sendMessage({
          action: "debugAudioChunk",
          detail: {
            rawAudio: lastResampledAudio,
            processedAudio: lastProcessedAudio,
            results,
          },
        })
        .catch(() => {
          // Popup not open — drop silently
        });
    }
  };

  const startListening = async () => {
    // Guard against double-start (MODEL_LOADED re-fire, doc reuse).
    if (stream || audioContext) return;
    try {
      console.log("Starting microphone...");
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
        (window as WindowWithAudioCtx).webkitAudioContext;
      if (!AudioCtor) {
        throw new Error("AudioContext not available in this environment");
      }
      audioContext = new AudioCtor();

      // Autoplay policy can leave the context suspended — resume explicitly.
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      await audioContext.audioWorklet.addModule(
        "worklets/zikr-audio-processor.worklet.js",
      );
      console.log("Bridge: AudioWorklet loaded");

      const source = audioContext.createMediaStreamSource(stream);
      sourceNode = source;
      const sampleRate = audioContext.sampleRate;

      workletNode = new AudioWorkletNode(audioContext, "zikr-audio-processor");

      workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type !== "audio-window") return;
        if (!isSandboxReady) {
          console.log("Bridge: Sandbox not ready yet");
          return;
        }
        if (!sandboxFrame?.contentWindow) {
          console.log("Bridge: Sandbox frame contentWindow is null");
          return;
        }

        const rawSamples = new Float32Array(event.data.samples);
        const resampledAudio = resampleAudio(
          rawSamples,
          sampleRate,
          TARGET_SAMPLE_RATE,
        );

        // Normalise using live settings (targetRms / minRms).
        // Null = silence — skip inference entirely.
        const processedAudio = processAudio(
          resampledAudio,
          currentSettings.targetRms,
          currentSettings.minRms,
        );
        if (!processedAudio) return;

        // Store for pairing with the next inference result (dev only —
        // the Array.from copies are expensive and unused in prod).
        if (import.meta.env.DEV) {
          lastResampledAudio = Array.from(resampledAudio);
          lastProcessedAudio = Array.from(processedAudio);
        }

        console.log(
          `Bridge: Sending ${processedAudio.length} samples to sandbox`,
        );

        sandboxFrame.contentWindow.postMessage(
          { type: "AUDIO_DATA", data: processedAudio },
          "*",
        );
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      console.log("Listening...");
      // Mic is truly live — tell the background so startMic can resolve.
      ext.runtime.sendMessage({ action: "micStarted" }).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error accessing microphone:", err);
      releaseAudioResources();
      ext.runtime.sendMessage({ action: "micError", error: message }).catch(() => {});
    }
  };

  // Release all audio resources (stop, failed start, or retry).
  const releaseAudioResources = () => {
    try {
      if (workletNode) {
        workletNode.port.close();
        workletNode.disconnect();
      }
    } catch {
      // Already torn down — safe to ignore.
    }
    try {
      sourceNode?.disconnect();
    } catch {
      // Already disconnected — safe to ignore.
    }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (audioContext) audioContext.close().catch(() => {});
    workletNode = null;
    sourceNode = null;
    audioContext = null;
    stream = null;
    lastResampledAudio = [];
    lastProcessedAudio = [];
  };

  const stopListening = () => {
    unsubscribeSettings();
    releaseAudioResources();
    console.log("Mic stopped");
  };

  ext.runtime.onMessage.addListener((message: unknown) => {
    const request = message as Record<string, string>;
    if (request.action === "stopMic") {
      stopListening();
    }
  });
})();

