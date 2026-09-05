"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "./button";
import { AzkarList } from "@workspace/azkar/constants";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ScrollArea, ScrollBar } from "./scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Badge } from "./badge";
import { Card } from "./card";
import { Bug, Download, LoaderCircle, Play, Upload, X } from "../index";

export type DebugChunk = {
  rawAudio: number[];
  processedAudio: number[];
  results: Array<{ label: string; value: number }>;
  timestamp: number;
};

import { createWavBlob } from "@workspace/audio-processing/wav";
import { uploadWavToEdgeImpulse } from "@workspace/audio-processing/edge-impulse";
import { useSettings } from "../hooks/useSettings";

/**
 * DevAudioDebugger
 *
 * Drop-in audio debug overlay. Listens for:
 *   window.dispatchEvent(new CustomEvent("debugAudioChunk", {
 *     detail: { rawAudio, processedAudio, results }
 *   }))
 *
 * Mount this component only when you want the debugger to be available.
 * It carries no environment guard itself — the consumer decides when to render it.
 *
 * Layout: bottom-sheet style (inset-x-0 bottom-0 max-h-[90vh]) so it works
 * in both full-page web apps and narrower extension popups without overflowing.
 */
export const DevAudioDebugger = ({ apiKey }: { apiKey?: string }) => {
  const { settings } = useSettings();
  const confidenceThreshold = settings.confidenceThreshold;
  const [chunks, setChunks] = useState<Record<string, DebugChunk[]>>({
    all: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const handleDebugAudio = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<DebugChunk, "timestamp">;
      const newChunk = { ...detail, timestamp: Date.now() };

      setChunks((prev) => {
        const next = { ...prev };

        // Add to "all" tab
        const allChunks = [newChunk, ...(next.all || [])];
        if (allChunks.length > 30) allChunks.pop();
        next.all = allChunks;

        // Add to specific keyword tab if successful
        const bestResult = newChunk.results.reduce(
          (prev, current) => (prev.value > current.value ? prev : current),
          newChunk.results[0] || { label: "none", value: 0 },
        );

        if (
          bestResult.value > confidenceThreshold &&
          bestResult.label !== "noise"
        ) {
          const key = bestResult.label;
          const keyChunks = [newChunk, ...(next[key] || [])];
          if (keyChunks.length > 30) keyChunks.pop();
          next[key] = keyChunks;
        }

        return next;
      });
    };

    window.addEventListener("debugAudioChunk", handleDebugAudio);
    return () =>
      window.removeEventListener("debugAudioChunk", handleDebugAudio);
  }, [confidenceThreshold]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-50 size-10 rounded-full bg-black text-lg text-white opacity-50 shadow-lg hover:opacity-100 dark:bg-white dark:text-black"
        title="Open Audio Debugger"
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Bug />
        </span>
      </Button>
    );
  }

  const activeChunks = chunks[activeTab] || [];

  return (
    <div
      dir="ltr"
      className="fixed right-0 bottom-0 z-50 flex max-h-[80vh] w-full flex-col gap-3 overflow-hidden overflow-x-hidden rounded-t-xl border border-zinc-200 bg-white p-3 text-xs shadow-xl sm:w-[400px] md:right-4 md:bottom-16 md:h-[600px] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex shrink-0 items-center justify-between border-b pb-2 dark:border-zinc-800">
        <h3 className="flex items-center gap-1.5 font-bold">
          <Bug className="size-4" /> Audio Debugger
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-black dark:hover:text-white"
          aria-label="Close Audio Debugger"
        >
          <X className="size-4" />
        </button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          <ScrollArea className="w-full pb-2">
            <TabsList className="inline-flex h-auto w-auto gap-1 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800"
              >
                All
              </TabsTrigger>
              {AzkarList.map((a) => (
                <TabsTrigger
                  key={a.id}
                  value={a.id}
                  className="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800"
                >
                  {a.id}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <TabsContent
            value={activeTab}
            className="mt-0 flex flex-col gap-3 pt-1 pb-2 outline-none"
          >
            {activeChunks.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No audio chunks yet. Start listening!
              </div>
            ) : (
              activeChunks.map((chunk, i) => (
                <AudioChunkView
                  key={chunk.timestamp + i}
                  chunk={chunk}
                  confidenceThreshold={confidenceThreshold}
                  apiKey={apiKey}
                />
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const AudioChunkView = ({
  chunk,
  confidenceThreshold,
  apiKey,
}: {
  chunk: DebugChunk;
  confidenceThreshold: number;
  apiKey?: string;
}) => {
  const rawCanvasRef = useRef<HTMLCanvasElement>(null);
  const procCanvasRef = useRef<HTMLCanvasElement>(null);

  const [uploadLabel, setUploadLabel] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    drawWaveform(rawCanvasRef.current, chunk.rawAudio, "rgb(239, 68, 68)");
    drawWaveform(
      procCanvasRef.current,
      chunk.processedAudio,
      "rgb(34, 197, 94)",
    );
  }, [chunk]);

  const bestResult = chunk.results.reduce(
    (prev, current) => (prev.value > current.value ? prev : current),
    chunk.results[0] || { label: "none", value: 0 },
  );

  const isGood = bestResult.value > confidenceThreshold;

  const playAudio = (data: number[]) => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const sampleRate = 16000;
    const normalizedArray = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let val = data[i]!;
      if (Math.abs(val) > 1.0) val = val / 32768.0;
      normalizedArray[i] = val;
    }
    const buffer = audioCtx.createBuffer(1, normalizedArray.length, sampleRate);
    buffer.copyToChannel(normalizedArray, 0);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  };

  const downloadWav = (data: number[]) => {
    const blob = createWavBlob(data);
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `sample_${Date.now()}.wav`,
    }).click();
  };

  const uploadWav = async (data: number[]) => {
    if (!uploadLabel) return;
    if (!apiKey) {
      alert(
        "Missing EDGE_IMPULSE_API_KEY. Pass it as a prop to DevAudioDebugger.",
      );
      return;
    }

    setIsUploading(true);
    try {
      const endpoint = Math.random() < 0.8 ? "training" : "testing";
      await uploadWavToEdgeImpulse({
        apiKey,
        label: uploadLabel,
        fileName: `sample_${Date.now()}.wav`,
        audioData: data,
        endpoint,
      });
      alert(`Uploaded to ${endpoint} successfully as '${uploadLabel}'`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="flex shrink-0 flex-col gap-1.5 overflow-visible rounded-md border-zinc-200 bg-zinc-50 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Top Row: Info and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-zinc-500">
            {new Date(chunk.timestamp).toLocaleTimeString()}
          </span>
          <Badge
            variant={isGood ? "default" : "secondary"}
            className={
              "h-4 px-1.5 py-0 text-[9px] leading-none font-medium " +
              (isGood
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400")
            }
          >
            {bestResult.label}: {bestResult.value.toFixed(2)}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Select
            value={uploadLabel}
            onValueChange={(val: string | null) => setUploadLabel(val || "")}
          >
            <SelectTrigger className="h-5! min-h-0 border-zinc-200 px-1.5 py-0 text-[9px] shadow-none dark:border-zinc-800">
              <SelectValue placeholder="Select Label" />
            </SelectTrigger>
            <SelectContent>
              {AzkarList.map((a) => (
                <SelectItem
                  key={a.id}
                  value={a.id}
                  className="rounded-none p-1! px-2! text-[10px]"
                >
                  {a.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => uploadWav(chunk.processedAudio)}
            title="Upload to Edge Impulse"
            disabled={isUploading || !uploadLabel}
            className="h-5 min-h-0 border-zinc-200 px-1.5 py-0 text-[10px] shadow-none dark:border-zinc-800"
          >
            {isUploading ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Middle Row: Canvases side by side */}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between text-[9px] leading-none text-zinc-500">
            <span className="flex items-center gap-1">
              Raw
              <button
                onClick={() => playAudio(chunk.rawAudio)}
                title="Play raw"
                aria-label="Play raw audio"
                className="transition-transform hover:scale-110"
              >
                <Play className="size-3" />
              </button>
            </span>
            <span>n={chunk.rawAudio.length}</span>
          </div>
          <canvas
            ref={rawCanvasRef}
            width={160}
            height={24}
            className="w-full rounded-[3px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between text-[9px] leading-none text-zinc-500">
            <span className="flex items-center gap-1">
              Proc
              <button
                onClick={() => playAudio(chunk.processedAudio)}
                title="Play processed"
                aria-label="Play processed audio"
                className="transition-transform hover:scale-110"
              >
                <Play className="size-3" />
              </button>
              <button
                onClick={() => downloadWav(chunk.processedAudio)}
                title="Download WAV"
                aria-label="Download WAV"
                className="ml-0.5 transition-transform hover:scale-110"
              >
                <Download className="size-3" />
              </button>
            </span>
            <span>n={chunk.processedAudio.length}</span>
          </div>
          <canvas
            ref={procCanvasRef}
            width={160}
            height={24}
            className="w-full rounded-[3px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
          />
        </div>
      </div>

      {/* Bottom Row: Additional labels */}
      {chunk.results.filter(
        (r) => r.value > 0.05 && r.label !== bestResult.label,
      ).length > 0 && (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {chunk.results
            .filter((r) => r.value > 0.05 && r.label !== bestResult.label)
            .sort((a, b) => b.value - a.value)
            .map((r) => (
              <span
                key={r.label}
                className="rounded bg-zinc-200/50 px-1 py-0 text-[8px] leading-tight text-zinc-500 dark:bg-zinc-800/50"
              >
                {r.label}: {r.value.toFixed(2)}
              </span>
            ))}
        </div>
      )}
    </Card>
  );
};

function drawWaveform(
  canvas: HTMLCanvasElement | null,
  data: number[],
  color: string,
) {
  if (!canvas || !data.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = Math.max(1, Math.floor(data.length / width));
  const amp = height / 2;
  for (let i = 0; i < width; i++) {
    let min = 1.0,
      max = -1.0;
    for (let j = 0; j < step; j++) {
      const idx = i * step + j;
      if (idx >= data.length) break;
      let val = data[idx]!;
      if (Math.abs(val) > 1.0) val = val / 32768.0;
      if (val < min) min = val;
      if (val > max) max = val;
    }
    ctx.moveTo(i, amp - min * amp);
    ctx.lineTo(i, amp - max * amp);
  }
  ctx.stroke();
}

