import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const ALLOWED_STATUSES = new Set(["pending", "accepted", "rejected"]);
const ALLOWED_SORTS = new Set(["created_at", "label"]);
const MAX_ID_CHARS = 200;

function isAuthorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${ADMIN_SECRET}`;
}

function requireConfigured() {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin API not configured" },
      { status: 503 },
    );
  }
  return null;
}

/** Extension of a storage path, or "webm" when absent/untrusted. */
function storageExtension(rawPath: string): string {
  const dot = rawPath.lastIndexOf(".");
  const ext = dot > 0 ? rawPath.slice(dot + 1).toLowerCase() : "";
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : "webm";
}

// ---------------------------------------------------------------------------
// GET — list samples (status, label, sort, pagination) + signed audio URLs
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const misconfigured = requireConfigured();
  if (misconfigured) return misconfigured;
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const label = searchParams.get("label");
  const sortBy = searchParams.get("sort") ?? "created_at";
  const sortDir = searchParams.get("dir") === "asc";
  const pageRaw = parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 0 ? pageRaw : 0;
  const pageSize = 20;

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!ALLOWED_SORTS.has(sortBy)) {
    return NextResponse.json({ error: "Invalid sort" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("ei_reviews")
    .select("*", { count: "exact" })
    .eq("status", status);

  if (label) query = query.eq("label", label);

  query = query
    .order(sortBy, { ascending: sortDir })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate short-lived signed URLs for playback (10 min)
  const samplesWithUrls = await Promise.all(
    (data ?? []).map(async (sample) => {
      let rawAudioUrl: string | null = null;
      let processedAudioUrl: string | null = null;

      if (sample.raw_path) {
        const { data: signed } = await supabaseAdmin.storage
          .from("raw-contributions")
          .createSignedUrl(sample.raw_path, 600);
        rawAudioUrl = signed?.signedUrl ?? null;
      }

      if (sample.processed_path) {
        const { data: signed } = await supabaseAdmin.storage
          .from("raw-contributions")
          .createSignedUrl(sample.processed_path, 600);
        processedAudioUrl = signed?.signedUrl ?? null;
      }

      return { ...sample, rawAudioUrl, processedAudioUrl };
    }),
  );

  return NextResponse.json({ samples: samplesWithUrls, total: count, page, pageSize });
}

// ---------------------------------------------------------------------------
// POST — three actions:
//   reject        → mark rejected
//   accept        → mark accepted in DB, return signed raw URL; the client
//                   converts to WAV and pushes via /api/contribute/push-to-ei
//   update_ei     → write ei_sample_id + pipeline_version after EI push
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const misconfigured = requireConfigured();
  if (misconfigured) return misconfigured;
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sample_id, action, corrected_label, ei_sample_id, pipeline_version } =
      body as {
        sample_id: string;
        action: "accept" | "reject" | "update_ei";
        corrected_label?: string;
        ei_sample_id?: string;
        pipeline_version?: string;
      };

    if (!sample_id || !action) {
      return NextResponse.json({ error: "Missing sample_id or action" }, { status: 400 });
    }

    if (
      (ei_sample_id && ei_sample_id.length > MAX_ID_CHARS) ||
      (pipeline_version && pipeline_version.length > MAX_ID_CHARS) ||
      (corrected_label && corrected_label.length > MAX_ID_CHARS)
    ) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 });
    }

    // ── update_ei: called by client after successful EI push ──────────────
    if (action === "update_ei") {
      const { error } = await supabaseAdmin
        .from("ei_reviews")
        .update({ ei_sample_id: ei_sample_id ?? null, pipeline_version: pipeline_version ?? null })
        .eq("id", sample_id);

      if (error) throw error;
      return NextResponse.json({ status: "ok" });
    }

    // Fetch sample for accept/reject
    const { data: sample, error: fetchError } = await supabaseAdmin
      .from("ei_reviews")
      .select("*")
      .eq("id", sample_id)
      .single();

    if (fetchError || !sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    if (sample.status !== "pending") {
      return NextResponse.json({ error: `Sample already ${sample.status}` }, { status: 409 });
    }

    // ── reject ────────────────────────────────────────────────────────────
    if (action === "reject") {
      const { error } = await supabaseAdmin
        .from("ei_reviews")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", sample_id);

      if (error) throw error;
      return NextResponse.json({ status: "rejected" });
    }

    // ── accept ────────────────────────────────────────────────────────────
    // Server side: mark accepted + store a copy path. The client converts raw
    // audio to WAV and pushes it via /api/contribute/push-to-ei (server key).
    const effectiveLabel = corrected_label ?? sample.label;
    const ext = storageExtension(sample.raw_path);

    // Copy raw file to processed/ folder (pre-EI slot; client will push WAV to EI)
    const processedPath = `processed/${effectiveLabel}/${sample.session_id}/${Date.now()}.${ext}`;
    const { error: copyErr } = await supabaseAdmin.storage
      .from("raw-contributions")
      .copy(sample.raw_path, processedPath);

    if (copyErr) {
      console.error("Failed to copy to processed/:", copyErr);
      // Non-fatal — leave processed_path empty instead of pointing at a
      // file that was never created.
    }

    const { error: updateErr } = await supabaseAdmin
      .from("ei_reviews")
      .update({
        status: "accepted",
        label: effectiveLabel,
        processed_path: copyErr ? null : processedPath,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", sample_id);

    if (updateErr) throw updateErr;

    // Return a fresh signed URL so the client can download raw audio for EI push
    const { data: signed } = await supabaseAdmin.storage
      .from("raw-contributions")
      .createSignedUrl(sample.raw_path, 120); // 2 min — only needed for immediate push

    return NextResponse.json({
      status: "accepted",
      rawAudioUrl: signed?.signedUrl ?? null,
      effectiveLabel,
      processedPath,
    });
  } catch (err) {
    console.error("Review route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
