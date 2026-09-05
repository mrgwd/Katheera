"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Check } from "@workspace/ui/index";

interface MicCheckStepProps {
  onReady: (stream: MediaStream) => void;
}

type MicState = "requesting" | "ready" | "denied" | "error";

export function MicCheckStep({ onReady }: MicCheckStepProps) {
  const [micState, setMicState] = useState<MicState>("requesting");
  const [level, setLevel] = useState(0); // 0–1 RMS level
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // True once the stream is handed to the parent — only then may the
  // stream outlive this step. Otherwise stop tracks on unmount.
  const handedOffRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function requestMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Set up analyser for level meter
        const AudioCtor =
          window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtor) {
          setMicState("error");
          return;
        }
        const ctx = new AudioCtor();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function tick() {
          analyser.getByteTimeDomainData(dataArray);
          let sumSq = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i]! - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / bufferLength);
          setLevel(Math.min(rms * 5, 1)); // amplify for visibility
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();

        setMicState("ready");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (
          name === "NotAllowedError" ||
          name === "SecurityError" ||
          (err instanceof Error && /denied|permission/i.test(err.message))
        ) {
          setMicState("denied");
        } else {
          setMicState("error");
        }
      }
    }

    requestMic();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      try {
        sourceRef.current?.disconnect();
      } catch {
        // Already disconnected — safe to ignore.
      }
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close().catch(() => {});
      // The stream belongs to the parent only after Continue; otherwise the
      // mic would stay open when backing out of this step.
      if (!handedOffRef.current) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleContinue = () => {
    if (streamRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      try {
        sourceRef.current?.disconnect();
      } catch {
        // Already disconnected — safe to ignore.
      }
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close().catch(() => {});
      handedOffRef.current = true;
      onReady(streamRef.current);
    }
  };

  return (
    <div className="animate-fade space-y-8 text-center opacity-0">
      <div className="space-y-2">
        <div className="mx-auto mb-4 text-4xl">🎤</div>
        <h2 className="text-foreground text-2xl font-bold">Microphone check</h2>
        <p className="text-muted-foreground text-sm">
          We need microphone access to record your voice samples.
        </p>
      </div>

      {micState === "requesting" && (
        <div className="space-y-4">
          <div className="border-border bg-muted/40 mx-auto max-w-sm rounded-xl border p-6">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              Waiting for microphone permission…
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Look for the permission prompt in your browser's address bar or a
            pop-up dialog.
          </p>
        </div>
      )}

      {micState === "ready" && (
        <div className="space-y-6">
          <div className="border-border bg-muted/40 mx-auto max-w-sm space-y-4 rounded-xl border p-6">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <p className="text-sm font-semibold">Microphone ready</p>
            </div>

            {/* Level meter */}
            <div>
              <p className="text-muted-foreground mb-2 text-xs">
                Say something to test your microphone:
              </p>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${level * 100}%`,
                    background: `hsl(${120 * level}, 70%, 50%)`,
                  }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {level < 0.05
                  ? "No sound detected"
                  : level < 0.4
                    ? "Sound detected ✓"
                    : "Loud — try speaking a bit softer"}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full hover:scale-[1.01] active:scale-[0.99]"
            >
              My mic sounds good <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {micState === "denied" && (
        <div className="mx-auto max-w-sm space-y-4">
          <div className="rounded-xl border border-red-300/40 bg-red-50/60 p-5 dark:bg-red-900/10">
            <p className="text-foreground mb-2 text-sm font-semibold">
              Microphone access denied
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              To contribute, please allow microphone access:
            </p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              <li>• Click the 🔒 or 🎙️ icon in your browser's address bar</li>
              <li>• Set Microphone to "Allow"</li>
              <li>• Reload this page</li>
            </ul>
          </div>
          <Button
            size="lg"
            onClick={() => window.location.reload()}
            className="mx-auto block h-auto! rounded-xl! px-6! py-3! text-sm font-semibold"
          >
            Reload and try again
          </Button>
        </div>
      )}

      {micState === "error" && (
        <div className="mx-auto max-w-sm rounded-xl border border-red-300/40 bg-red-50/60 p-5 dark:bg-red-900/10">
          <p className="text-foreground mb-2 text-sm font-semibold">
            Couldn't access microphone
          </p>
          <p className="text-muted-foreground text-sm">
            Make sure no other app is using your microphone and try reloading.
          </p>
        </div>
      )}
    </div>
  );
}
