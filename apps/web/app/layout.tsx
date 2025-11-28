console.log('[TRACE] app/layout.tsx - START', Date.now());

import type { Metadata } from 'next';
import { IBM_Plex_Mono, Libre_Baskerville, Lora } from 'next/font/google';

console.log('[TRACE] app/layout.tsx - after next imports', Date.now());
import '@_/ui.style';
console.log('[TRACE] app/layout.tsx - after ui.style', Date.now());

import { Providers } from './providers';
import { FloatingHeader } from './components/floating-header';

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

import { cn } from '@_/ui.utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          libreBaskerville.variable,
          lora.variable,
          ibmPlexMono.variable,
          `font-sans bg-background text-foreground min-h-dvh flex flex-col`,
        )}
      >
        <Providers>
          <FloatingHeader />
          <main className="flex flex-col flex-1 w-full py-6 mt-20">
            {children}
          </main>
          <footer className="py-2 text-center text-xs text-muted-foreground border-t">
            An Apostoli Production
          </footer>
        </Providers>
      </body>
    </html>
  );
}
