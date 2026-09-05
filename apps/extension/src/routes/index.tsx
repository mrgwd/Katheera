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
import { TopBar } from "@workspace/ui/layout/TopBar";
import { ext } from "../utils/browser";

type BackgroundResponse = {
  success?: boolean;
  error?: string;
  isActive?: boolean;
};

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
    (async () => {
      try {
        const response = (await ext.runtime.sendMessage({
          action: "checkMicStatus",
        })) as BackgroundResponse | undefined;
        if (response?.isActive) {
          setIsActive(true);
          setStatus("Mic is running in the background (offscreen).");
        }
      } catch (err) {
        console.error("Failed to check mic status:", err);
      }
    })();
  }, []);

  const handleStartMic = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "granted") {
        startMicProcess();
      } else {
        await ext.tabs.create({ url: "permission.html" });
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

  const startMicProcess = async () => {
    try {
      const response = (await ext.runtime.sendMessage({
        action: "startMic",
      })) as BackgroundResponse | undefined;
      console.log("Mic started", response);
      if (response?.success) {
        setIsActive(true);
        setStatus("Mic is running in the background (offscreen).");
      } else if (response?.error) {
        setStatus(`Error: ${response.error}`);
      }
    } catch (err) {
      console.error("Failed to start mic:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const stopMicProcess = async () => {
    try {
      const response = (await ext.runtime.sendMessage({
        action: "stopMic",
      })) as BackgroundResponse | undefined;
      console.log("Mic stopped", response);
      if (response?.success) {
        setIsActive(false);
        setStatus("Mic stopped.");
      } else if (response?.error) {
        setStatus(`Error: ${response.error}`);
      }
    } catch (err) {
      console.error("Failed to stop mic:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="group text-center">
      {/* Shared square zone: mic button + settings panel */}
      <div className="relative aspect-square w-full">
        <TopBar />
        <div className="absolute inset-0">
          <ButtonContainer
            isListening={isActive}
            isModelLoaded={true}
            onToggleListening={handleToggleMic}
          />
        </div>
      </div>
      <p className="text-foreground hidden">{status}</p>
      <ZikrList list={counts} LinkComponent={Link} to="/zikr" />
    </div>
  );
}
