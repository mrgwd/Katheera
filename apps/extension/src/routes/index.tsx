import { useState, useEffect } from "react";
import type { Detections } from "@workspace/model/types";
import ButtonContainer from "@workspace/ui/layout/ButtonContainer";
import { getAzkarKeys } from "@workspace/azkar/constants";
import { buildInitialDetections } from "@workspace/azkar/helpers";
import {
  ensureDailyResetAsync,
  getCountsAsync,
  subscribeCounts,
} from "@workspace/lib/zikrStorage";

import { createFileRoute, Link } from "@tanstack/react-router";
import ZikrList from "@workspace/ui/layout/ZikrList";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [counts, setCounts] = useState<Detections>(
    buildInitialDetections() as Detections,
  );
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Click the button to activate.");

  useEffect(() => {
    const keys = getAzkarKeys();
    (async () => {
      await ensureDailyResetAsync(keys);
      const stored = await getCountsAsync(keys);
      setCounts((prev) => ({
        ...prev,
        ...Object.fromEntries(
          keys.map((k) => [k, { ...(prev[k] ?? {}), count: stored[k] ?? 0 }]),
        ),
      }));
    })();
    const unsubscribe = subscribeCounts((changes: Record<string, number>) => {
      setCounts((prev) => {
        const next = { ...prev } as Detections;
        Object.entries(changes).forEach(([k, v]: [string, number]) => {
          if (k in next) {
            next[k] = { ...(next[k] ?? {}), count: v };
          }
        });
        return next;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check mic status
    chrome.runtime.sendMessage({ action: "checkMicStatus" }, (response) => {
      if (response && response.isActive) {
        setIsActive(true);
        setStatus("Mic is running in the background (offscreen).");
      }
    });
  }, []);

  const handleStartMic = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "granted") {
        startMicProcess();
      } else {
        chrome.tabs.create({ url: "permission.html" });
        window.close();
      }
    } catch (err) {
      setStatus(`Error checking permission: ${(err as Error).message}`);
    }
  };

  const handleToggleMic = () => {
    if (isActive) {
      stopMicProcess();
    } else {
      handleStartMic();
    }
  };

  const startMicProcess = () => {
    chrome.runtime.sendMessage({ action: "startMic" }, (response) => {
      console.log("Mic started", response);
      if (response && response.success) {
        setIsActive(true);
        setStatus("Mic is running in the background (offscreen).");
      } else if (response && response.error) {
        setStatus(`Error: ${response.error}`);
      }
    });
  };

  const stopMicProcess = () => {
    chrome.runtime.sendMessage({ action: "stopMic" }, (response) => {
      console.log("Mic stopped", response);
      if (response && response.success) {
        setIsActive(false);
        setStatus("Mic stopped.");
      } else if (response && response.error) {
        setStatus(`Error: ${response.error}`);
      }
    });
  };

  return (
    <div className="space-y-2 text-center font-sans">
      <ButtonContainer
        isListening={isActive}
        isModelLoaded={true}
        onToggleListening={handleToggleMic}
      />
      <p className="text-foreground hidden">{status}</p>
      <ZikrList list={counts} LinkComponent={Link} />
    </div>
  );
}
