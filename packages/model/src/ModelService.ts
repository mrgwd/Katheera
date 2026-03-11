/**
 * ModelService — singleton that owns the Edge Impulse classifier.
 *
 * Lives entirely outside React. React hooks subscribe to it via
 * callbacks; they never trigger loading or hold the classifier themselves.
 *
 * Lifecycle:
 *   1. App boot → ModelService.getInstance().load()  (called once from layout)
 *   2. Scripts load → WASM initialises → classifier ready
 *   3. Hooks call .getClassifier() to run inference
 *
 * All three model files are served via Service Worker cache-first,
 * so after the first visit they load from cache with zero network cost.
 */

import type { EdgeImpulseClassifier } from "./types";

type LoadState = "idle" | "loading" | "ready" | "error";

type Listener = (state: LoadState, error?: string) => void;

class ModelService {
  private static instance: ModelService;

  private state: LoadState = "idle";
  private classifier: EdgeImpulseClassifier | null = null;
  private error: string = "";
  private listeners = new Set<Listener>();

  // Private — use getInstance()
  private constructor() {}

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  getState(): LoadState {
    return this.state;
  }

  getError(): string {
    return this.error;
  }

  getClassifier(): EdgeImpulseClassifier | null {
    return this.classifier;
  }

  isReady(): boolean {
    return this.state === "ready" && this.classifier !== null;
  }

  /**
   * Subscribe to state changes. Returns an unsubscribe function.
   * Immediately fires with the current state so late subscribers
   * (e.g. components that mount after load is already done) get
   * the correct state right away.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.state, this.error || undefined);
    return () => this.listeners.delete(listener);
  }

  /**
   * Load the model. Safe to call multiple times — only runs once.
   * Subsequent calls while loading or after load resolve immediately.
   */
  async load(): Promise<void> {
    if (this.state === "ready" || this.state === "loading") return;

    this.setState("loading");

    try {
      await this.injectScript("/model/edge-impulse-standalone.js");
      await this.injectScript("/model/run-impulse.js");

      // Give WASM a tick to finish synchronous initialisation
      await new Promise((resolve) => setTimeout(resolve, 200));

      const w = window as Window & {
        EdgeImpulseClassifier?: new () => EdgeImpulseClassifier;
      };

      if (!w.EdgeImpulseClassifier) {
        throw new Error("EdgeImpulseClassifier not found on window after load");
      }

      const classifier = new w.EdgeImpulseClassifier();
      await classifier.init();

      this.classifier = classifier;
      this.setState("ready");
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.setState("error");
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private setState(next: LoadState): void {
    this.state = next;
    this.listeners.forEach((fn) => fn(next, this.error || undefined));
  }

  /**
   * Inject a script tag and wait for it to load.
   * Skips injection if the script is already present in the DOM
   * (safety guard against double-calls).
   */
  private injectScript(src: string): Promise<void> {
    // Deduplication: if already injected, resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false; // Preserve execution order
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }
}

// Export the singleton getter — consumers never `new` this directly
export const modelService = ModelService.getInstance();