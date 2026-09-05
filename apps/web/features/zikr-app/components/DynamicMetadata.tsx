"use client";

import { useEffect, useRef } from "react";
import { useMic } from "../providers/MicProvider";

const DEFAULT_FAVICON = "/favicon.ico";
const LISTENING_FAVICON = "/listening.ico";

function applyFavicon(href: string) {
  const icons = document.querySelectorAll(
    'link[rel*="icon"]',
  ) as NodeListOf<HTMLLinkElement>;
  if (icons.length === 0) {
    const newIcon = document.createElement("link");
    newIcon.rel = "shortcut icon";
    newIcon.href = href;
    document.head.appendChild(newIcon);
  } else {
    icons.forEach((icon) => {
      icon.href = href;
    });
  }
}

export function DynamicMetadata() {
  const mic = useMic();
  const originalTitleRef = useRef<string | null>(null);
  const activeCount = mic.activeZikr
    ? (mic.detections[mic.activeZikr]?.count ?? null)
    : null;

  // Favicon follows listening state only — no reason to touch the DOM
  // on every detection.
  useEffect(() => {
    if (typeof document === "undefined") return;
    applyFavicon(mic.isListening ? LISTENING_FAVICON : DEFAULT_FAVICON);
    return () => applyFavicon(DEFAULT_FAVICON);
  }, [mic.isListening]);

  // Title follows listening state + active zikr count only (not the whole
  // detections object, whose identity changes on every detection).
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (originalTitleRef.current === null) {
      originalTitleRef.current = document.title || "Zikr AI";
    }
    const original = originalTitleRef.current;

    if (mic.isListening) {
      const label = mic.activeZikr
        ? (mic.detections[mic.activeZikr]?.label ?? mic.activeZikr)
        : null;
      document.title =
        label !== null && activeCount !== null
          ? `(${activeCount}) ${label}`
          : `Listening... | ${original}`;
    } else if (document.title !== original) {
      document.title = original;
    }

    return () => {
      document.title = originalTitleRef.current ?? document.title;
    };
  }, [mic.isListening, mic.activeZikr, activeCount]);

  return null; // This component doesn't render anything
}
