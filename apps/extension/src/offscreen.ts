// This script runs in the offscreen document

import {
  CONFIDENCE_THRESHOLD,
  COOLDOWN_MS,
  TARGET_SAMPLE_RATE,
} from "@workspace/audio-processing/constants";
// import { loadFont } from "./utils/loadFont";

// loadFont();

(async () => {
  console.log("Offscreen script running - Sandbox Bridge Version");

  // State
  let lastDetectionTime: Record<string, number> = {};
  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let processor: ScriptProcessorNode | null = null;
  let isSandboxReady = false;

  const sandboxFrame = document.getElementById(
    "ei-sandbox",
  ) as HTMLIFrameElement | null;

  console.log("Bridge: Sandbox frame element:", sandboxFrame);
  console.log(
    "Bridge: Sandbox frame contentWindow:",
    sandboxFrame?.contentWindow,
  );

  // --- Helper Functions ---

  // Simple linear interpolation resampling
  const resampleAudio = (
    audioData: Float32Array,
    fromSampleRate: number,
    toSampleRate: number,
  ) => {
    if (fromSampleRate === toSampleRate) {
      return audioData;
    }

    const sampleRateRatio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioData.length / sampleRateRatio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const position = i * sampleRateRatio;
      const index = Math.floor(position);
      const fraction = position - index;

      if (index + 1 < audioData.length) {
        result[i] =
          audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index];
      }
    }

    return result;
  };

  // Handle messages from sandbox
  window.addEventListener("message", (event) => {
    // Security check: ensure message is from our sandbox
    // Note: In extensions, origin might be null or specific, but we trust the iframe we created.

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

  const handleInferenceResults = (results: any[]) => {
    console.log("Bridge: Received inference results:", results);

    let maxConfidence = 0;
    let detectedLabel: string | null = null;

    results.forEach((prediction: any) => {
      console.log(
        `Bridge: Prediction - ${prediction.label}: ${(prediction.value * 100).toFixed(1)}%`,
      );

      if (
        prediction.value > maxConfidence &&
        prediction.value > CONFIDENCE_THRESHOLD
      ) {
        maxConfidence = prediction.value;
        detectedLabel = prediction.label;
      }
    });

    console.log(
      `Bridge: Max confidence: ${(maxConfidence * 100).toFixed(1)}%, Label: ${detectedLabel}`,
    );

    if (
      detectedLabel &&
      detectedLabel !== "noise" &&
      detectedLabel !== "unknown"
    ) {
      const now = Date.now();
      const last = lastDetectionTime[detectedLabel] || 0;

      if (now - last > COOLDOWN_MS) {
        console.log(
          `Detected: ${detectedLabel} (${(maxConfidence * 100).toFixed(1)}%)`,
        );
        lastDetectionTime[detectedLabel] = now;

        // Send to background
        chrome.runtime.sendMessage({
          action: "wordDetected",
          word: detectedLabel,
        });
      } else {
        console.log(`Bridge: Cooldown active for ${detectedLabel}, skipping`);
      }
    }
  };

  const startListening = async () => {
    try {
      console.log("Starting microphone...");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const source = audioContext.createMediaStreamSource(stream);

      // Create a script processor
      const bufferSize = 4096;
      processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

      const sampleRate = audioContext.sampleRate;
      const continuousBuffer: number[] = [];

      processor.onaudioprocess = (e) => {
        if (!isSandboxReady) {
          console.log("Bridge: Sandbox not ready yet");
          return;
        }

        if (!sandboxFrame) {
          console.log("Bridge: Sandbox frame is null");
          return;
        }

        if (!sandboxFrame.contentWindow) {
          console.log("Bridge: Sandbox frame contentWindow is null");
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Add new audio data to continuous buffer
        for (let i = 0; i < inputData.length; i++) {
          continuousBuffer.push(inputData[i]);
        }

        // When we have at least 1 second of audio
        const oneSec = sampleRate;
        if (continuousBuffer.length >= oneSec) {
          const oneSecWindow = continuousBuffer.slice(0, oneSec);

          // Remove processed audio (sliding window)
          const slideAmount = Math.floor(sampleRate * 0.25);
          continuousBuffer.splice(0, slideAmount);

          // Resample to 16kHz
          const resampledAudio = resampleAudio(
            new Float32Array(oneSecWindow),
            sampleRate,
            TARGET_SAMPLE_RATE,
          );

          console.log(
            `Bridge: Sending ${resampledAudio.length} samples to sandbox`,
          );

          // Send to sandbox for processing
          // We must send a copy or transferable to avoid issues, though postMessage handles cloning.
          // Sending as array buffer or typed array is fine.
          sandboxFrame.contentWindow.postMessage(
            {
              type: "AUDIO_DATA",
              data: resampledAudio, // TypedArray is cloned
            },
            "*",
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("Listening...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopListening = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (audioContext) audioContext.close();
    console.log("Mic stopped");
  };

  // Listen for stop message
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "stopMic") {
      stopListening();
    }
  });
})();
