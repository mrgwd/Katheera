import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";
import { DevAudioDebugger } from "@workspace/ui/components/DevAudioDebugger";
import { SettingsProvider } from "@workspace/ui/hooks/useSettings";
import { useEffect } from "react";
import { ext } from "../utils/browser";
// import { TooltipProvider } from "@workspace/ui/components/tooltip";

// Relay debug audio chunks from the offscreen document (separate page context)
// into the popup's window event bus so DevAudioDebugger can listen normally.
function useDebugAudioRelay() {
  useEffect(() => {
    const listener = (message: unknown) => {
      const msg = message as { action?: string; detail?: object };
      if (msg.action === "debugAudioChunk" && msg.detail) {
        window.dispatchEvent(
          new CustomEvent("debugAudioChunk", { detail: msg.detail }),
        );
      }
    };
    ext.runtime.onMessage.addListener(listener);
    return () => ext.runtime.onMessage.removeListener(listener);
  }, []);
}

function RootComponent() {
  useDebugAudioRelay();

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {/* <TooltipProvider> */}
      <SettingsProvider>
        <Outlet />
        {import.meta.env.DEV && (
          <DevAudioDebugger apiKey={import.meta.env.VITE_EDGE_IMPULSE_API_KEY} />
        )}
      </SettingsProvider>
      {/* </TooltipProvider> */}
    </NextThemesProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});

// import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";

// export const Route = createRootRoute({
//   component: () => (
//     <NextThemesProvider
//       attribute="class"
//       defaultTheme="system"
//       enableSystem
//       disableTransitionOnChange
//       enableColorScheme
//     >
//       <Outlet />
//     </NextThemesProvider>
//   ),
// });
