"use client";

import { useState, useCallback } from "react";
import type { UploadStatus } from "../types";

export interface UploadResult {
  status: UploadStatus;
  sampleId?: string;
  error?: string;
}

const MAX_RETRIES = 1;

export function useUpload(sessionId: string) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (params: {
      audioBlob: Blob;
      mimeType: string;
      label: string;
      prompt: string;
      variation: string;
    }): Promise<UploadResult> => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const msg = "You're offline — check your connection and retry";
        setStatus("error");
        setError(msg);
        return { status: "error", error: msg };
      }

      setStatus("uploading");
      setError(null);

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const formData = new FormData();
          formData.append("audio", params.audioBlob, "clip.audio");
          formData.append("label", params.label);
          formData.append("prompt", params.prompt);
          formData.append("variation", params.variation);
          formData.append("session_id", sessionId);
          formData.append("mime_type", params.mimeType);

          const res = await fetch("/api/contribute/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
          }

          const data = (await res.json()) as { sample_id: string; status: string };
          setStatus("success");
          return { status: "success", sampleId: data.sample_id };
        } catch (err) {
          if (attempt === MAX_RETRIES) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setStatus("error");
            setError(msg);
            return { status: "error", error: msg };
          }
          // Wait 1s before retry
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      return { status: "error", error: "Upload failed" };
    },
    [sessionId],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, upload, reset };
}
