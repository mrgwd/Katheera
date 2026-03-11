/**
 * apps/web/lib/MicService.ts
 * 
 * Singleton service that manages the microphone and audio pipeline
 * across route changes. This ensures the mic stays active when navigating
 * between pages in the Next.js app.
 */

export class MicService {
  private static instance: MicService | null = null;
  
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isListening = false;
  private onAudioDataCallback: ((audioData: Float32Array, sampleRate: number) => void) | null = null;
  private error: string = "";
  
  private constructor() {}
  
  static getInstance(): MicService {
    if (!MicService.instance) {
      MicService.instance = new MicService();
    }
    return MicService.instance;
  }
  
  setAudioCallback(callback: (audioData: Float32Array, sampleRate: number) => void) {
    this.onAudioDataCallback = callback;
  }
  
  async startListening(workletUrl: string): Promise<void> {
    console.log('MicService: startListening called, isListening:', this.isListening);
    if (this.isListening) return;
    
    try {
      this.error = "";
      
      // Get mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      this.mediaStream = stream;
      console.log('MicService: Microphone stream obtained');
      
      // Create AudioContext
      const AudioCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      
      if (!AudioCtor) {
        throw new Error("AudioContext not available in this environment");
      }
      
      this.audioContext = new AudioCtor();
      console.log('MicService: AudioContext created');
      
      // Load AudioWorklet processor
      await this.audioContext.audioWorklet.addModule(workletUrl);
      console.log('MicService: AudioWorklet loaded');
      
      // Wire up the audio graph
      const source = this.audioContext.createMediaStreamSource(stream);
      this.workletNode = new AudioWorkletNode(this.audioContext, "zikr-audio-processor");
      
      const sampleRate = this.audioContext.sampleRate;
      
      // Receive processed windows from the audio thread
      this.workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "audio-window" && this.onAudioDataCallback) {
          const samples = new Float32Array(event.data.samples);
          this.onAudioDataCallback(samples, sampleRate);
        }
      };
      
      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
      
      this.isListening = true;
      console.log('MicService: Successfully started listening');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.error = "Error accessing microphone: " + message;
      this.isListening = false;
      console.error('MicService: Failed to start:', err);
      throw err;
    }
  }
  
  stopListening(): void {
    console.log('MicService: stopListening called, isListening:', this.isListening);
    if (!this.isListening) return;
    
    if (this.workletNode) {
      this.workletNode.port.close();
      this.workletNode.disconnect();
      this.workletNode = null;
      console.log('MicService: WorkletNode cleaned up');
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      console.log('MicService: AudioContext closed');
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      console.log('MicService: MediaStream stopped');
    }
    
    this.isListening = false;
    console.log('MicService: Successfully stopped listening');
  }
  
  getIsListening(): boolean {
    return this.isListening;
  }
  
  getError(): string {
    return this.error;
  }
  
  // Cleanup method to be called when the app is completely shutting down
  cleanup(): void {
    this.stopListening();
    this.onAudioDataCallback = null;
  }
}
