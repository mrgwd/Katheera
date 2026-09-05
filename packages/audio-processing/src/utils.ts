import {
  CONFIDENCE_THRESHOLD,
  MIN_CONFIDENCE_SEED,
  MIN_RMS,
  TARGET_RMS,
  TARGET_SAMPLE_RATE,
} from "./constants";
import type {
  EdgeImpulseResult,
  EdgeImpulseResultItem,
} from "@workspace/model/types";

export const resampleAudio = (
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number = TARGET_SAMPLE_RATE,
) => {
  if (fromSampleRate === toSampleRate) return audioData;
  if (
    !Number.isFinite(fromSampleRate) ||
    fromSampleRate <= 0 ||
    !Number.isFinite(toSampleRate) ||
    toSampleRate <= 0
  ) {
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
        audioData[index]! * (1 - fraction) + audioData[index + 1]! * fraction;
    } else {
      result[i] = audioData[index]!;
    }
  }
  return result;
};

export const processClassifierResult = (
  result: EdgeImpulseResult,
  confidenceThreshold: number = CONFIDENCE_THRESHOLD,
  seed: number = MIN_CONFIDENCE_SEED,
): { label: string; confidence: number } | null => {
  let detectedLabel: string | null = null;
  let bestConfidence = seed;

  if (!result || !result.results) return null;

  // // Log all results to see what's happening
  // console.log(
  //   "Full predictions:",
  //   result.results.map((r) => `${r.label}: ${r.value.toFixed(2)}`).join(", "),
  // );

  result.results.forEach((prediction: EdgeImpulseResultItem) => {
    if (
      prediction.value > bestConfidence &&
      prediction.value > confidenceThreshold
    ) {
      bestConfidence = prediction.value;
      detectedLabel = prediction.label;
    }
  });

  if (detectedLabel === null) return null;
  return { label: detectedLabel, confidence: bestConfidence };
};

export const processAudio = (
  audioData: Float32Array,
  targetRmsOverride?: number,
  minRmsOverride?: number,
) => {
  return normalizeAudio(audioData, targetRmsOverride, minRmsOverride);
};

export const normalizeAudio = (
  audioData: Float32Array,
  targetRmsOverride?: number,
  minRmsOverride?: number,
): Float32Array | null => {
  const effectiveTargetRms = targetRmsOverride ?? TARGET_RMS;
  const effectiveMinRms = minRmsOverride ?? MIN_RMS;

  // Calculate RMS
  let sumSq = 0;
  for (let i = 0; i < audioData.length; i++) {
    sumSq += audioData[i]! * audioData[i]!;
  }
  const rms = Math.sqrt(sumSq / audioData.length);

  // Below this = true silence, skip.
  // Written as !(rms > min) so NaN (empty input) and rms === 0 with
  // minRms === 0 both bail out instead of producing Infinity scale.
  if (!(rms > effectiveMinRms)) return null;

  const out = new Float32Array(audioData.length);
  // Scale so RMS = effectiveTargetRms, then convert to int16 range
  const scale = (effectiveTargetRms / rms) * 32768.0;

  for (let i = 0; i < audioData.length; i++) {
    // Clamp to int16 range to avoid overflow on loud audio
    out[i] = Math.max(-32768, Math.min(32767, audioData[i]! * scale));
  }
  return out;
};
