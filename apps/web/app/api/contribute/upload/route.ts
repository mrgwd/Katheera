import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { AzkarList } from "@workspace/azkar/constants";

const ALLOWED_LABELS = AzkarList.map((z) => z.id);
// NOTE: keep in sync with the bucket limit in apps/web/scripts/setup-supabase.mjs
const MAX_BYTES = 600_000; // ~600 KB ceiling per clip
const MAX_PROMPT_CHARS = 500;
const MAX_VARIATION_CHARS = 100;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const audio = formData.get("audio") as File | null;
    const label = formData.get("label") as string | null;
    const prompt = formData.get("prompt") as string | null;
    const variation = formData.get("variation") as string | null;
    const session_id = formData.get("session_id") as string | null;
    // NOTE: formData may also carry `mime_type` (client hint) — the extension
    // is derived from the blob's own type instead, so it is ignored here.

    // --- Validation ---
    if (!audio || !label || !prompt || !variation || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!ALLOWED_LABELS.includes(label)) {
      return NextResponse.json(
        { error: `Invalid label: ${label}` },
        { status: 400 },
      );
    }

    if (
      prompt.length > MAX_PROMPT_CHARS ||
      variation.length > MAX_VARIATION_CHARS
    ) {
      return NextResponse.json(
        { error: "Field too long" },
        { status: 400 },
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        { error: "Empty audio file" },
        { status: 400 },
      );
    }

    if (audio.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large (max 600 KB)" },
        { status: 413 },
      );
    }

    // Validate session_id is a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session_id)) {
      return NextResponse.json(
        { error: "Invalid session_id format" },
        { status: 400 },
      );
    }

    // --- Determine file extension from the actual blob type ---
    // Unknown recorder output is rejected rather than silently stored as webm.
    const ext = getExtension(audio.type);
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported audio type: ${audio.type || "unknown"}` },
        { status: 400 },
      );
    }
    const timestamp = Date.now();
    const rawPath = `${label}/${session_id}/${timestamp}.${ext}`;

    // --- Upload raw audio to Supabase Storage ---
    const audioBuffer = await audio.arrayBuffer();
    const { error: storageError } = await supabaseAdmin.storage
      .from("raw-contributions")
      .upload(rawPath, audioBuffer, {
        contentType: audio.type || "audio/webm",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json(
        { error: "Failed to upload audio" },
        { status: 500 },
      );
    }

    // --- Insert metadata row into ei_reviews ---
    const { data, error: dbError } = await supabaseAdmin
      .from("ei_reviews")
      .insert({
        session_id,
        label,
        prompt,
        variation,
        raw_path: rawPath,
        status: "pending",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Try to clean up the uploaded file
      await supabaseAdmin.storage
        .from("raw-contributions")
        .remove([rawPath]);
      return NextResponse.json(
        { error: "Failed to save sample metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sample_id: data.id, status: "pending" });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getExtension(mimeType: string): string | null {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/ogg": "ogg",
    "audio/ogg;codecs=opus": "ogg",
    "audio/mp4": "mp4",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
  };
  const clean = mimeType.toLowerCase().trim();
  return map[clean] ?? null;
}
