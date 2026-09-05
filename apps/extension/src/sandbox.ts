import type { EdgeImpulseClassifier } from "@workspace/model/types";

declare global {
  interface Window {
    EdgeImpulseClassifier?: new () => EdgeImpulseClassifier;
    Module?: unknown;
    webkitAudioContext?: typeof AudioContext;
  }
}

let classifier: EdgeImpulseClassifier | null = null;
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
      // Data is expected to be an array or Float32Array.
      // It arrives already normalised (int16 range) by the offscreen
      // document using live user settings — classify directly.
      const audioData = new Float32Array(data);

      // Run inference
      const result = classifier.classify(audioData, false);

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
