import { CONFIDENCE_THRESHOLD, TARGET_SAMPLE_RATE } from "./constants";
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

export const scaleAudioForClassification = (
  audioData: Float32Array,
  inputGain: number,
): Float32Array => {
  const scaledAudioData = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const scaled = audioData[i]! * inputGain;
    const clamped = scaled > 1 ? 1 : scaled < -1 ? -1 : scaled;
    scaledAudioData[i] = clamped * 32768.0;
  }
  return scaledAudioData;
};

export const processClassifierResult = (
  result: EdgeImpulseResult,
  confidenceThreshold: number = CONFIDENCE_THRESHOLD,
  maxConfidence: number = 0.9,
) => {
  let detectedLabel: string | null = null;

  if (!result || !result.results) return null;

  // Log all results to see what's happening
  console.log(
    "Full predictions:",
    result.results.map((r) => `${r.label}: ${r.value.toFixed(2)}`).join(", "),
  );

  result.results.forEach((prediction: EdgeImpulseResultItem) => {
    if (
      prediction.value > maxConfidence &&
      prediction.value > confidenceThreshold
    ) {
      maxConfidence = prediction.value;
      detectedLabel = prediction.label;
    }
  });

  return detectedLabel;
};

export const processAudio = (audioData: Float32Array, INPUT_GAIN: number) => {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++)
    sum += audioData[i]! * audioData[i]!;
  const rms = Math.sqrt(sum / audioData.length);
  if (rms < 0.001) return;

  return scaleAudioForClassification(audioData, INPUT_GAIN);
};
