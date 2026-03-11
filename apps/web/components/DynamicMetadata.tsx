"use client";

import { useEffect, useRef } from "react";
import { useMic } from "@/providers/MicProvider";

export function DynamicMetadata() {
  const mic = useMic();
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Capture the original title only once
    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title || "Zikr AI";
    }

    const icons = document.querySelectorAll('link[rel*="icon"]') as NodeListOf<HTMLLinkElement>;
    const defaultFavicon = "/favicon.ico";
    const listeningFavicon = "/listening.ico";

    if (icons.length === 0) {
      // Create favicon if it doesn't exist
      const newIcon = document.createElement("link");
      newIcon.rel = "shortcut icon";
      newIcon.href = mic.isListening ? listeningFavicon : defaultFavicon;
      document.head.appendChild(newIcon);
    } else {
      icons.forEach((icon) => {
        if (mic.isListening) {
          icon.href = listeningFavicon;
        } else {
          icon.href = defaultFavicon;
        }
      });
    }

    if (mic.isListening) {
      // Update Title
      if (mic.activeZikr) {
        const detection = mic.detections[mic.activeZikr];
        if (detection) {
          document.title = `(${detection.count}) ${detection.label} | ${originalTitleRef.current}`;
        } else {
          document.title = `Listening... | ${originalTitleRef.current}`;
        }
      } else {
        document.title = `Listening... | ${originalTitleRef.current}`;
      }
    } else {
      // Reset Title
      if (document.title !== originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }
  }, [mic.isListening, mic.activeZikr, mic.detections]);


  return null; // This component doesn't render anything
}
