declare global {
  interface Window {
    EdgeImpulseClassifier?: new () => EdgeImpulseClassifier;
    Module?: unknown;
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface EdgeImpulseResultItem {
  label: string;
  value: number;
}

export interface EdgeImpulseResult {
  results: EdgeImpulseResultItem[];
}

export interface EdgeImpulseClassifier {
  init: () => Promise<void>;
  classify: (data: Float32Array, debug?: boolean) => EdgeImpulseResult | null;
  getProjectInfo?: () => unknown;
  getProperties?: () => unknown;
}

export type WindowWithAudioCtx = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

export type Detections = Record<
  string,
  {
    count: number;
    lastAccuracy: number;
    label: string;
    href?: string;
    render: boolean;
  }
>;