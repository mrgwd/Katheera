import { TARGET_SAMPLE_RATE } from "./constants";

type AudioSample = Float32Array | number[];

function sampleToInt16(value: number): number {
  return Math.max(
    -32768,
    Math.min(32767, Math.abs(value) > 1.0 ? value : value * 32768),
  );
}

export function createWavBlob(
  data: AudioSample,
  sampleRate: number = TARGET_SAMPLE_RATE,
): Blob {
  const samples = new Int16Array(Array.from(data).map(sampleToInt16));
  const buf = new ArrayBuffer(44 + samples.byteLength);
  const view = new DataView(buf);
  const writeString = (offset: number, value: string) =>
    [...value].forEach((char, index) =>
      view.setUint8(offset + index, char.charCodeAt(0)),
    );

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.byteLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.byteLength, true);
  new Int16Array(buf, 44).set(samples);
  return new Blob([buf], { type: "audio/wav" });
}
