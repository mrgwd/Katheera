/**
 * zikr-audio-processor.worklet.ts
 *
 * AudioWorklet processor — runs on the dedicated audio rendering thread,
 * completely separate from the main JS thread. This prevents audio
 * processing from competing with React rendering.
 *
 * Replaces the deprecated ScriptProcessorNode.
 *
 * Strategy:
 *   - Accumulates raw PCM samples into a rolling buffer
 *   - When buffer reaches 1 second of audio (at native sample rate),
 *     sends a 1-second window to the main thread via MessagePort
 *   - Slides the window by 25% (75% overlap) matching the original logic
 *
 * This file must be placed in apps/web/public/worklets/
 * so it can be loaded as a URL by AudioContext.audioWorklet.addModule()
 */
class ZikrAudioProcessor extends AudioWorkletProcessor {
    buffer;
    bufferIndex = 0;
    windowSize; // 1 second of samples
    slideAmount; // 25% of window
    constructor() {
        super();
        // sampleRate is a global in AudioWorkletGlobalScope
        this.windowSize = sampleRate; // 1 second
        this.slideAmount = Math.floor(sampleRate * 0.25);
        this.buffer = new Float32Array(this.windowSize * 2); // 2x for safety headroom
    }
    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0])
            return true; // Keep processor alive
        const channelData = input[0];
        // Fill our rolling buffer
        for (let i = 0; i < channelData.length; i++) {
            if (this.bufferIndex < this.buffer.length) {
                this.buffer[this.bufferIndex++] = channelData[i];
            }
        }
        // When we have a full 1-second window, send it to main thread
        if (this.bufferIndex >= this.windowSize) {
            const window = this.buffer.slice(0, this.windowSize);
            // Transfer ownership of the buffer for zero-copy transfer
            const transferBuffer = window.buffer.slice(0);
            this.port.postMessage({ type: "audio-window", samples: transferBuffer }, [transferBuffer]);
            // Slide: keep the last (windowSize - slideAmount) samples
            const keepFrom = this.slideAmount;
            const keepCount = this.bufferIndex - keepFrom;
            if (keepCount > 0) {
                this.buffer.copyWithin(0, keepFrom, this.bufferIndex);
            }
            this.bufferIndex = Math.max(0, keepCount);
        }
        return true; // Return true to keep the processor alive
    }
}
registerProcessor("zikr-audio-processor", ZikrAudioProcessor);
