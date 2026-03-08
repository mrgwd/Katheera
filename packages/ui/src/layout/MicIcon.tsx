import { cn } from "@workspace/lib/utils";

export default function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <svg
      width="48"
      height="55"
      viewBox="0 0 48 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className={cn(
          "fill-muted-foreground/40 transition-all duration-500 ease-in-out",
          isListening ? "-translate-y-5 opacity-0" : "",
        )}
        id="pop-filter"
        x="8"
        width="32"
        height="39"
        rx="16"
        opacity="0.5"
      />

      <path
        className={cn(
          "stroke-muted-foreground/40 transition-all duration-500 ease-in-out",
          isListening ? "translate-y-4 opacity-0" : "",
        )}
        id="stand"
        d="M2.00474 20C1.83808 28.3333 6.00474 45 24.0047 45M24.0047 45C42.0047 45 46.1715 28.3333 46.0049 20M24.0047 45L24.0049 53"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className={cn(
          "stroke-background dark:stroke-muted-foreground transition-all duration-500 ease-in-out",
          isListening
            ? "dark:stroke-secondary-foreground translate-x-14 rotate-90"
            : "opacity-0",
        )}
        id="line-2"
        d="M17 24H30"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className={cn(
          "stroke-background dark:stroke-muted-foreground transition-all duration-500 ease-in-out",
          isListening
            ? "dark:stroke-secondary-foreground translate-x-12 rotate-90"
            : "",
        )}
        id="line-2"
        d="M19 24H29"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className={cn(
          "stroke-background dark:stroke-muted-foreground transition-all duration-500 ease-in-out",
          isListening
            ? "dark:stroke-secondary-foreground translate-x-10 rotate-90"
            : "opacity-0",
        )}
        id="line-2"
        d="M15 24H34"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className={cn(
          "stroke-background dark:stroke-muted-foreground transition-all duration-500 ease-in-out",
          isListening
            ? "dark:stroke-secondary-foreground translate-x-14 rotate-90"
            : "",
        )}
        id="line-1"
        d="M21 16H27"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className={cn(
          "stroke-background dark:stroke-muted-foreground transition-all duration-500 ease-in-out",
          isListening
            ? "dark:stroke-secondary-foreground translate-x-6 rotate-90"
            : "opacity-0",
        )}
        id="line-1"
        d="M21 16H27"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
