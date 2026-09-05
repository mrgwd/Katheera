import { NextRequest, NextResponse } from "next/server";
import { AzkarList } from "@workspace/azkar/constants";

const ADMIN_SECRET = process.env.ADMIN_SECRET!;
const EI_API_KEY = process.env.EDGE_IMPULSE_API_KEY;
const EI_INGESTION_BASE = "https://ingestion.edgeimpulse.com/api";

const ALLOWED_LABELS = new Set(AzkarList.map((z) => z.id));
const ALLOWED_ENDPOINTS = new Set(["training", "testing"]);
// WAV at 16 kHz mono 16-bit is ~32 KB/s; debug/admin chunks are seconds long.
const MAX_WAV_BYTES = 1_000_000;

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${ADMIN_SECRET}`;
}

// ---------------------------------------------------------------------------
// POST — accept a WAV file + label, forward to Edge Impulse ingestion.
// The browser records webm/opus (MediaRecorder) and converts to WAV client-side
// (decode + pipeline + createWavBlob); this route only forwards, so the EI API
// key stays server-only and is never baked into client bundles.
// Body: multipart form-data { audio: File(.wav), label, fileName?, endpoint? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!EI_API_KEY) {
    console.error("push-to-ei: EDGE_IMPULSE_API_KEY is not configured");
    return NextResponse.json(
      { error: "EI upload not configured" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data" },
      { status: 400 },
    );
  }

  const audio = formData.get("audio");
  const label = formData.get("label");
  const endpoint = String(formData.get("endpoint") ?? "training");
  const fileNameRaw = formData.get("fileName");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "Missing audio file" },
      { status: 400 },
    );
  }

  if (audio.size > MAX_WAV_BYTES) {
    return NextResponse.json(
      { error: "Audio file too large (max 1 MB)" },
      { status: 413 },
    );
  }

  if (typeof label !== "string" || !ALLOWED_LABELS.has(label)) {
    return NextResponse.json({ error: "Invalid label" }, { status: 400 });
  }

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const fileName =
    typeof fileNameRaw === "string" && fileNameRaw.length > 0
      ? fileNameRaw.replace(/[/\\]/g, "_")
      : `${label}_${Date.now()}.wav`;

  const forward = new FormData();
  forward.append("data", audio, fileName);

  let eiRes: Response;
  try {
    eiRes = await fetch(`${EI_INGESTION_BASE}/${endpoint}/files`, {
      method: "POST",
      headers: { "x-api-key": EI_API_KEY, "x-label": label },
      body: forward,
    });
  } catch (err) {
    console.error("push-to-ei: EI request failed:", err);
    return NextResponse.json({ error: "EI upload failed" }, { status: 502 });
  }

  if (!eiRes.ok) {
    const detail = await eiRes.text().catch(() => "");
    console.error("push-to-ei: EI rejected upload:", eiRes.status, detail);
    return NextResponse.json({ error: "EI upload failed" }, { status: 502 });
  }

  const result = (await eiRes.json().catch(() => null)) as {
    success?: boolean;
    files?: { id: number }[];
  } | null;
  const eiSampleId = result?.files?.[0]?.id?.toString() ?? "unknown";

  return NextResponse.json({ eiSampleId });
}
