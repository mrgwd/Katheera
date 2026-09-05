#!/usr/bin/env node
/**
 * scripts/setup-supabase.mjs
 *
 * One-off script to create the required Supabase Storage bucket.
 * Run once before first deployment:
 *
 *   node scripts/setup-supabase.mjs
 *
 * from the apps/web directory (needs SUPABASE_PROJECT_ID and SUPABASE_SECRET in .env).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dep needed — just parse it)
function loadEnv() {
  const envPath = resolve(__dirname, "../.env");
  const raw = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const projectId = env["SUPABASE_PROJECT_ID"];
const secret = env["SUPABASE_SECRET"];

if (!projectId || !secret) {
  console.error("❌ Missing SUPABASE_PROJECT_ID or SUPABASE_SECRET in .env");
  process.exit(1);
}

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  secret,
  { auth: { persistSession: false } }
);

async function main() {
  console.log("🔧 Setting up Supabase Storage for Katheera contributions...\n");

  // List existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("❌ Could not list buckets:", listErr.message);
    process.exit(1);
  }

  const existing = buckets.map((b) => b.name);
  console.log("Existing buckets:", existing.join(", ") || "(none)");

  // Create raw-contributions bucket if it doesn't exist
  const BUCKET = "raw-contributions";
  if (existing.includes(BUCKET)) {
    console.log(`✓ Bucket "${BUCKET}" already exists — skipping.`);
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,           // never publicly readable
      fileSizeLimit: 600000,   // 600 KB max per file
      allowedMimeTypes: [
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
        "audio/wav",
        "audio/mpeg",
      ],
    });

    if (error) {
      console.error(`❌ Failed to create bucket "${BUCKET}":`, error.message);
      process.exit(1);
    }

    console.log(`✅ Created bucket "${BUCKET}" (private, 600 KB limit).`);
  }

  console.log("\n✅ Supabase setup complete.");
  console.log("\nNext steps:");
  console.log(
    "  1. Make sure the ei_reviews table exists (SQL migration in implementation_plan.md)"
  );
  console.log(
    "  2. Set ADMIN_SECRET in .env to a strong random value before deploying"
  );
  console.log("  3. Run: pnpm dev\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
