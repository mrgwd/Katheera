import type { ReactNode } from "react";

// Locale-aware subtree lives in app/[locale]/layout.tsx, which owns the
// <html>/<body> shell (lang, dir, fonts, theme, intl provider). This root
// layout stays a passthrough by design (see next-intl App Router setup).
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
