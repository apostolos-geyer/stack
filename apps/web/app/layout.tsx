console.log('[TRACE] app/layout.tsx - START', Date.now());

import type { Metadata } from 'next';
import { IBM_Plex_Mono, Libre_Baskerville, Lora } from 'next/font/google';

console.log('[TRACE] app/layout.tsx - after next imports', Date.now());
import '@_/ui.style';
console.log('[TRACE] app/layout.tsx - after ui.style', Date.now());

import { Providers } from './providers';

console.log('[TRACE] app/layout.tsx - after providers', Date.now());

const libreBaskerville = Libre_Baskerville({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'web',
  description: 'lowkey tuff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${libreBaskerville.variable} ${lora.variable} ${ibmPlexMono.variable} font-sans bg-background text-foreground`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col pt-20">
            <main className="flex-1 w-full py-6">{children}</main>
            <footer className="py-2 text-center text-xs text-muted-foreground border-t">
              An Apostoli Production
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
