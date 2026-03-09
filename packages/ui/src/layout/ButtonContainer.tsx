"use client";
import { cn } from "@workspace/lib/utils";
import Decoration from "./Decoration";
import MicIcon from "./MicIcon";

interface ButtonContainerProps {
  isListening: boolean;
  isModelLoaded: boolean;
  onToggleListening: () => void;
}

export default function ButtonContainer({
  isListening,
  isModelLoaded,
  onToggleListening,
}: ButtonContainerProps) {
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="relative h-full w-full">
        <Decoration
          className={cn(
            "transition-all duration-500 ease-in-out",
            isListening ? "-translate-y-16" : "-translate-y-44 opacity-0",
          )}
        />
        <button
          role="button"
          aria-roledescription="microphone button"
          onClick={onToggleListening}
          disabled={!isModelLoaded}
          className={cn(
            "flex aspect-square h-full w-full items-center justify-center rounded-3xl bg-linear-0 from-transparent transition-all duration-500 ease-in-out hover:cursor-pointer",
            !isModelLoaded && "cursor-not-allowed opacity-50",
            isListening
              ? "to-muted/60 via-transparent"
              : "to-muted dark:to-muted/60",
          )}
          style={{
            borderRadius: isListening ? "500px" : "2.5rem",
          }}
        >
          <MicIcon isListening={isListening} />
        </button>
      </div>
    </div>
  );
}
