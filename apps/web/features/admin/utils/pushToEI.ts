import {
  decodeAudioArrayBuffer,
  runAudioPipeline,
} from "@workspace/audio-processing/edge-impulse";
import { createWavBlob } from "@workspace/audio-processing/wav";

// Decode + pipeline run in the browser: MediaRecorder output is webm/opus
// while Edge Impulse ingestion only accepts WAV. The resulting WAV is POSTed
// to the server proxy (/api/contribute/push-to-ei), which holds the EI API
// key — browsers never see it.
export async function pushToEI(
  rawAudioUrl: string,
  label: string,
  sampleId: string,
  secret: string,
): Promise<string> {
  const audioRes = await fetch(rawAudioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to fetch audio: HTTP ${audioRes.status}`);
  }

  const { channelData, sampleRate } = await decodeAudioArrayBuffer(
    await audioRes.arrayBuffer(),
  );
  const processed = runAudioPipeline(channelData, sampleRate);
  const wavBlob = createWavBlob(processed);

  const formData = new FormData();
  formData.append("audio", wavBlob, `${sampleId}_${Date.now()}.wav`);
  formData.append("label", label);
  formData.append("endpoint", "training");

  const res = await fetch("/api/contribute/push-to-ei", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "EI upload failed",
    );
  }

  const data = (await res.json()) as { eiSampleId?: string };
  return data.eiSampleId ?? "unknown";
}
