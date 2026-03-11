import { INPUT_GAIN } from "@repo/audio-processing/constants";
import type { EdgeImpulseClassifier } from "@repo/model/types";
// import { loadFont } from "./utils/loadFont";

declare global {
  interface Window {
    EdgeImpulseClassifier?: new () => EdgeImpulseClassifier;
    Module?: unknown;
    webkitAudioContext?: typeof AudioContext;
  }
}

// loadFont();

let classifier: any = null;
let isModelLoaded = false;

// Initialize
(async () => {
  try {
    console.log("Sandbox: Loading model...");

    // Wait for scripts to load
    if (!window.EdgeImpulseClassifier) {
      // Simple retry mechanism if scripts aren't ready immediately
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!window.EdgeImpulseClassifier) {
      throw new Error("EdgeImpulseClassifier not found in sandbox");
    }

    classifier = new window.EdgeImpulseClassifier();
    await classifier.init();

    isModelLoaded = true;
    console.log("Sandbox: Model loaded successfully");

    // Notify parent that we are ready
    window.parent.postMessage({ type: "MODEL_LOADED" }, "*");
  } catch (err) {
    console.error("Sandbox: Error loading model:", err);
    window.parent.postMessage(
      { type: "ERROR", error: (err as Error).message },
      "*",
    );
  }
})();

// Listen for audio data from parent
window.addEventListener("message", (event) => {
  if (!isModelLoaded || !classifier) return;

  const { type, data } = event.data;

  if (type === "AUDIO_DATA") {
    try {
      // data is expected to be an array or Float32Array
      // We need to convert it back to Float32Array if it was serialized
      const audioData = new Float32Array(data);

      // Process audio (Scale to int16 range)
      const scaledAudioData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const boosted = audioData[i] * INPUT_GAIN;
        const clamped = boosted > 1 ? 1 : boosted < -1 ? -1 : boosted;
        scaledAudioData[i] = clamped * 32768.0;
      }

      // Run inference
      const result = classifier.classify(scaledAudioData, false);

      console.log("Sandbox: Inference result:", result);

      if (result && result.results) {
        console.log("Sandbox: Sending results to parent:", result.results);
        // Send results back to parent
        window.parent.postMessage(
          {
            type: "INFERENCE_RESULT",
            results: result.results,
          },
          "*",
        );
      }
    } catch (err) {
      console.error("Sandbox: Inference error:", err);
    }
  }
});
