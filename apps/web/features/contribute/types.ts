import type { ToneVariationId } from "@workspace/azkar/constants";

export type ContributeStep =
  | "landing"
  | "consent"
  | "mic-check"
  | "recording"
  | "complete";

export type PromptKind = "zikr" | "noise-phrase" | "open-prompt";

export interface RecordingPrompt {
  id: string; // unique key for this prompt slot
  kind: PromptKind;
  label: string; // Edge Impulse label: sbhn | hamd | akbr | noise | unknown
  displayText: string; // what to show in big text (Arabic phrase or instruction)
  toneVariation?: {
    id: ToneVariationId;
    label: string;
    emoji: string;
    instruction: string;
  };
}

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface SampleRecord {
  promptId: string;
  audioBlob: Blob;
  audioUrl: string;
  status: UploadStatus;
  sampleId?: string; // returned by the server on success
  retries: number;
}
