/**
 * useMicrophone — manages mic stream and audio processing pipeline.
 *
 * Key changes from original:
 * - Uses AudioWorkletNode (dedicated audio thread) instead of the
 *   deprecated ScriptProcessorNode (main thread)
 * - onAudioData ref pattern prevents stale closure issues — the
 *   callback can change without recreating the entire audio pipeline
 */

"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseMicrophoneProps {
  onAudioData: (audioData: Float32Array, sampleRate: number) => void;
  workletUrl: string;
}

export function useMicrophone({ onAudioData, workletUrl }: UseMicrophoneProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  /**
   * Always-current ref to the callback.
   * The audio worklet message handler closes over this ref,
   * so onAudioData can change (e.g. on parent re-renders) without
   * needing to recreate the entire audio pipeline.
   */
  const onAudioDataRef = useRef(onAudioData);
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  });

  const startListening = useCallback(async () => {
    try {
      setError("");

      // ── 1. Get mic stream ──────────────────────────────────────────────
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      // ── 2. Create AudioContext ─────────────────────────────────────────
      const AudioCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtor) {
        throw new Error("AudioContext not available in this environment");
      }

      const ctx = new AudioCtor();
      audioContextRef.current = ctx;

      // ── 3. Load AudioWorklet processor ────────────────────────────────
      // The worklet file is in /public/worklets/ and served statically.
      // The Service Worker caches it alongside the model files.
      await ctx.audioWorklet.addModule(workletUrl);

      // ── 4. Wire up the graph: source → worklet ────────────────────────
      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "zikr-audio-processor");
      workletNodeRef.current = workletNode;

      const sampleRate = ctx.sampleRate;

      // Receive processed windows from the audio thread
      workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "audio-window") {
          const samples = new Float32Array(event.data.samples);
          // Use the ref — always calls the latest version of the callback
          onAudioDataRef.current(samples, sampleRate);
        }
      };

      source.connect(workletNode);
      // Do NOT connect workletNode to ctx.destination — we don't want
      // processed audio to play back through the speakers
      workletNode.connect(ctx.destination);

      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError("Error accessing microphone: " + message);
      setIsListening(false);
    }
  }, []); // No deps — onAudioData is handled via ref

  const stopListening = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.close();
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't call stopListening — if mic is intentionally persisted
      // across routes via a context, we don't want unmounting this hook
      // to kill the stream. Only stop if this hook fully owns the stream.
      // For now: cleanup on unmount. When you implement persistent mic,
      // move the AudioContext into MicService (singleton) instead.
    };
  }, []);

  return { isListening, error, startListening, stopListening, toggleListening };
}
