"use client";
import { useMic } from "@/providers/MicProvider";
import ButtonContainer from "@workspace/ui/layout/ButtonContainer";
import { TopBar } from "@workspace/ui/layout/TopBar";
import ZikrList from "@workspace/ui/layout/ZikrList";
import Link from "next/link";

export default function Page() {
  const { isLoading, isListening, toggle, detections } = useMic();
  return (
    <main className="group">
      <TopBar />
      <ButtonContainer
        isListening={isListening}
        isModelLoaded={!isLoading}
        onToggleListening={toggle}
      />
      <ZikrList list={detections} LinkComponent={Link} href="/app/zikr" />
    </main>
  );
}
