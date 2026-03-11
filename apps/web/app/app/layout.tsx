import { Vazirmatn } from "next/font/google";
import "../../globals.css";
import { Metadata } from "next";
import { DynamicMetadata } from "@/components/DynamicMetadata";
import { AppBootstrapper } from "@/components/AppBootstrapper";
import { Providers } from "@/components/Providers";
import { FloatingMiniBarWrapper } from "@/components/FloatingMiniBarWrapper";

const vazirmatn = Vazirmatn({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
      <AppBootstrapper />
      <Providers>
        <DynamicMetadata />
        {children}
        <FloatingMiniBarWrapper />
      </Providers>
    </main>
  );
}
