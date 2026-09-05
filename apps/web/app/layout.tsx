import type { Metadata } from "next";
import "../globals.css";
import { vazirmatn } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Katheera - Smart Sebha",
    template: "%s | Katheera",
  },
  description:
    "A smart sebha that uses AI to count your zikr for you while you are working, studying, or focusing on something else.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site default language is English (marketing pages). Arabic fragments
  // carry their own lang/dir attributes; per-locale <html> comes with i18n.
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </NextThemesProvider>
      </body>
    </html>
  );
}
