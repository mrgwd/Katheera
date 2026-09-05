"use client";
import { useMic } from "@/features/zikr-app/providers/MicProvider";
import { TopBar } from "@workspace/ui/layout/TopBar";
import ButtonContainer from "@workspace/ui/layout/ButtonContainer";
import ZikrList from "@workspace/ui/layout/ZikrList";
import Link from "next/link";

export default function Page() {
  const { isLoading, isListening, toggle, detections } = useMic();
  return (
    <main className="group">
      <div className="relative aspect-square w-full">
        <TopBar />
        <div className="absolute inset-0">
          <ButtonContainer
            isListening={isListening}
            isModelLoaded={!isLoading}
            onToggleListening={toggle}
          />
        </div>
      </div>
      <ZikrList list={detections} LinkComponent={Link} href="/app/zikr" />
    </main>
  );
}
