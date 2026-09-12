import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client with service role access.
 * Lazily initialized on first call so that a missing env var
 * doesn't crash the Next.js build during static page-data collection.
 * Bypasses RLS — never import this in client components.
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const projectId = process.env.SUPABASE_PROJECT_ID;
  const supabaseServiceKey = process.env.SUPABASE_SECRET;

  if (!projectId || !supabaseServiceKey) {
    throw new Error(
      `Supabase env vars not configured (SUPABASE_PROJECT_ID=${projectId ? "set" : "missing"}, SUPABASE_SECRET=${supabaseServiceKey ? "set" : "missing"}).`,
    );
  }

  _supabaseAdmin = createClient(
    `https://${projectId}.supabase.co`,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return _supabaseAdmin;
}

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
