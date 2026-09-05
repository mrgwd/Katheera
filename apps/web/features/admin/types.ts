import type { EiReview } from "@/lib/supabase";

export type StatusFilter = "pending" | "accepted" | "rejected";
export type SortField = "created_at" | "label";
export type SortDir = "desc" | "asc";
export type ActionState = "idle" | "loading" | "done" | "error";

export interface SampleWithUrls extends EiReview {
  rawAudioUrl: string | null;
  processedAudioUrl: string | null;
}
