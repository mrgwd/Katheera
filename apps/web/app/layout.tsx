import { Vazirmatn } from "next/font/google";
import "../globals.css";
import { ThemeProvider as NextThemesProvider } from "@workspace/ui/components/theme-provider";

const vazirmatn = Vazirmatn({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
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
