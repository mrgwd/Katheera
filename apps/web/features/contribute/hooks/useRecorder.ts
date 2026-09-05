"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";

export interface RecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  error: string | null;
}

const PREFERRED_CODECS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function getSupportedMimeType(): string {
  for (const codec of PREFERRED_CODECS) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(codec)) {
      return codec;
    }
  }
  return ""; // let the browser choose
}

export function useRecorder(stream: MediaStream | null) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    durationMs: 0,
    error: null,
  });

  // Capability probe — memoized so it doesn't run on every render.
  // Guarded for SSR (MediaRecorder is undefined on the server).
  const mimeType = useMemo(() => getSupportedMimeType(), []);

  // Revoke object URLs when replaced or when the owner unmounts.
  // (Double revoke with reset() is a harmless no-op.)
  useEffect(() => {
    const url = state.audioUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state.audioUrl]);

  const startRecording = useCallback(() => {
    if (!stream) {
      setState((s) => ({ ...s, error: "No microphone stream available" }));
      return;
    }

    try {
      chunksRef.current = [];
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;
        setState({
          isRecording: false,
          audioBlob: blob,
          audioUrl: url,
          durationMs,
          error: null,
        });
      };

      recorder.onerror = () => {
        setState((s) => ({ ...s, isRecording: false, error: "Recording error" }));
      };

      startTimeRef.current = Date.now();
      recorder.start(100); // collect in 100ms chunks
      setState((s) => ({ ...s, isRecording: true, audioBlob: null, audioUrl: null, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isRecording: false,
        error: err instanceof Error ? err.message : "Failed to start recording",
      }));
    }
  }, [stream, mimeType]);

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && (rec.state === "recording" || rec.state === "paused")) {
      rec.stop();
    }
  }, []);

  const reset = useCallback(() => {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    setState({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      durationMs: 0,
      error: null,
    });
    chunksRef.current = [];
  }, [state.audioUrl]);

  return { ...state, mimeType, startRecording, stopRecording, reset };
}
