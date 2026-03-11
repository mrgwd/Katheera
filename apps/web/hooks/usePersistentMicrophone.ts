/**
 * apps/web/hooks/usePersistentMicrophone.ts
 * 
 * Hook that uses the singleton MicService to provide persistent
 * microphone functionality across route changes.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MicService } from "../lib/MicService";

interface UsePersistentMicrophoneProps {
  onAudioData: (audioData: Float32Array, sampleRate: number) => void;
  workletUrl: string;
}

export function usePersistentMicrophone({ onAudioData, workletUrl }: UsePersistentMicrophoneProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  
  const micServiceRef = useRef<MicService>(MicService.getInstance());
  const onAudioDataRef = useRef(onAudioData);
  
  // Keep the callback ref current
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  });
  
  // Set the audio callback on the service
  useEffect(() => {
    micServiceRef.current.setAudioCallback((audioData, sampleRate) => {
      onAudioDataRef.current(audioData, sampleRate);
    });
  }, []);
  
  // Sync state with service
  useEffect(() => {
    const checkServiceState = () => {
      setIsListening(micServiceRef.current.getIsListening());
      setError(micServiceRef.current.getError());
    };
    
    // Check immediately
    checkServiceState();
    
    // Set up an interval to sync state (in case service state changes externally)
    const interval = setInterval(checkServiceState, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const startListening = useCallback(async () => {
    console.log('usePersistentMicrophone: startListening called');
    try {
      await micServiceRef.current.startListening(workletUrl);
      setIsListening(true);
      setError("");
      console.log('usePersistentMicrophone: Successfully started listening');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError("Error accessing microphone: " + message);
      setIsListening(false);
      console.error('usePersistentMicrophone: Failed to start:', err);
    }
  }, [workletUrl]);
  
  const stopListening = useCallback(() => {
    console.log('usePersistentMicrophone: stopListening called');
    micServiceRef.current.stopListening();
    setIsListening(false);
  }, []);
  
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  return { isListening, error, startListening, stopListening, toggleListening };
}
