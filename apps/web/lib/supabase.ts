import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SECRET!;

/**
 * Server-only Supabase client with service role access.
 * Bypasses RLS — never import this in client components.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Row shape for the ei_reviews table.
 */
export interface EiReview {
  id: string;
  session_id: string;
  label: string;
  prompt: string;
  variation: string;
  raw_path: string;
  processed_path: string | null;
  status: "pending" | "accepted" | "rejected";
  pipeline_version: string | null;
  ei_sample_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}
