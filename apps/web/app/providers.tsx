'use client';

console.log('[TRACE] app/providers.tsx - START', Date.now());

import { ThemeProvider } from 'next-themes';

console.log('[TRACE] app/providers.tsx - after next-themes', Date.now());

import { TRPCQueryClientProvider } from '@_/lib.client';

console.log('[TRACE] app/providers.tsx - after lib.client', Date.now());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCQueryClientProvider url="/api/trpc">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </TRPCQueryClientProvider>
  );
}
