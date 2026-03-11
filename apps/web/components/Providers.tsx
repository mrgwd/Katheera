"use client";

import * as React from "react";
// import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";
import { MicProvider } from "@/providers/MicProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <NextThemesProvider
    //   attribute="class"
    //   defaultTheme="system"
    //   enableSystem
    //   disableTransitionOnChange
    //   enableColorScheme
    // >
    <MicProvider>{children}</MicProvider>
    // </NextThemesProvider>
  );
}
