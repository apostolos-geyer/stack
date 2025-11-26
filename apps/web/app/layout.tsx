import type { Metadata } from "next";
import { Libre_Baskerville, Lora, IBM_Plex_Mono } from "next/font/google";
import "@_/ui.style";
import { Providers } from "./providers";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "web",
  description: "lowkey tuff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${libreBaskerville.variable} ${lora.variable} ${ibmPlexMono.variable} font-sans bg-background text-foreground`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <footer className="sticky bottom-0 py-2 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border-t">
              An Apostoli Production
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
