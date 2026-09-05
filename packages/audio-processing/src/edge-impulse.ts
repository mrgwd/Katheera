import { TARGET_RMS, MIN_RMS, TARGET_SAMPLE_RATE } from "./constants";
import { normalizeAudio, resampleAudio } from "./utils";
import { createWavBlob } from "./wav";

export type EdgeImpulseEndpoint = "training" | "testing";

export function runAudioPipeline(
  channelData: Float32Array,
  fromSampleRate: number,
): Float32Array {
  const resampled = resampleAudio(
    channelData,
    fromSampleRate,
    TARGET_SAMPLE_RATE,
  );
  return normalizeAudio(resampled, TARGET_RMS, MIN_RMS) ?? resampled;
}

export async function decodeAudioArrayBuffer(
  arrayBuffer: ArrayBuffer,
): Promise<{ channelData: Float32Array; sampleRate: number }> {
  const AudioCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) throw new Error("AudioContext not available");

  const audioCtx = new AudioCtor();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return {
      channelData: decoded.getChannelData(0),
      sampleRate: decoded.sampleRate,
    };
  } finally {
    audioCtx.close();
  }
}

export async function uploadWavToEdgeImpulse(options: {
  apiKey: string;
  label: string;
  fileName: string;
  audioData: Float32Array | number[];
  sampleRate?: number;
  endpoint?: EdgeImpulseEndpoint;
}): Promise<string> {
  const {
    apiKey,
    label,
    fileName,
    audioData,
    sampleRate = TARGET_SAMPLE_RATE,
    endpoint = "training",
  } = options;

  const wavBlob = createWavBlob(audioData, sampleRate);
  const formData = new FormData();
  formData.append("data", wavBlob, fileName);

  const response = await fetch(
    `https://ingestion.edgeimpulse.com/api/${endpoint}/files`,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "x-label": label,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EI upload failed: ${text}`);
  }

  const result = (await response.json()) as {
    success: boolean;
    files?: { id: number }[];
  };
  return result.files?.[0]?.id?.toString() ?? "unknown";
}

export async function pushUrlToEdgeImpulse(options: {
  apiKey: string;
  label: string;
  sampleId: string;
  rawAudioUrl: string;
}): Promise<string> {
  const response = await fetch(options.rawAudioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: HTTP ${response.status}`);
  }

  const { channelData, sampleRate } = await decodeAudioArrayBuffer(
    await response.arrayBuffer(),
  );
  const processed = runAudioPipeline(channelData, sampleRate);

  return uploadWavToEdgeImpulse({
    apiKey: options.apiKey,
    label: options.label,
    fileName: `${options.sampleId}_${Date.now()}.wav`,
    audioData: processed,
  });
}
