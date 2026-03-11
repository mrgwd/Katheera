import { Vazirmatn } from "next/font/google";
import "../globals.css";

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
    <html lang="ar">
      <body
        className={`${vazirmatn.variable} mt-10 font-sans antialiased md:mt-16`}
      >
        {children}
      </body>
    </html>
  );
}
