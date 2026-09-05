import type { Metadata } from "next";
import { vazirmatn } from "@/lib/fonts";
import { version } from "../../package.json";
import { DynamicMetadata } from "@/features/zikr-app/components/DynamicMetadata";
import { AppBootstrapper } from "@/features/zikr-app/components/AppBootstrapper";
import { Providers } from "@/features/zikr-app/providers/Providers";
import { FloatingMiniBarWrapper } from "@/features/zikr-app/components/FloatingMiniBarWrapper";
import { DevAudioDebugger } from "@workspace/ui/components/DevAudioDebugger";

export const metadata: Metadata = {
  title: "Katheera - Web App",
  description:
    "A smart sebha that uses AI to count your zikr for you while you are working, studying, or focusing on something else. You say the zikr, and Katheera will count it for you.",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      lang="ar"
      dir="rtl"
      className={`${vazirmatn.variable} mx-auto max-w-xs p-2 font-sans antialiased`}
    >
      <Providers>
        <AppBootstrapper />
        <DynamicMetadata />
        {children}
        {process.env.NODE_ENV === "development" && (
          <DevAudioDebugger apiKey={process.env.EDGE_IMPULSE_API_KEY} />
        )}
        <FloatingMiniBarWrapper />
        <p className="text-muted-foreground absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs">
          v{version}
        </p>
      </Providers>
    </main>
  );
}
