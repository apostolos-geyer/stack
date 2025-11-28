'use client';

console.log('[TRACE] app/providers.tsx - START', Date.now());

import { ThemeProvider } from 'next-themes';

console.log('[TRACE] app/providers.tsx - after next-themes', Date.now());

import { createAuthFeatures } from '@_/features.client/auth';
import { authClient } from '@_/infra.auth/client';
import { TRPCQueryClientProvider } from '@_/lib.client';

console.log('[TRACE] app/providers.tsx - after lib.client', Date.now());

const AuthFeaturesProvider = createAuthFeatures(authClient);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCQueryClientProvider url="/api/trpc">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthFeaturesProvider>{children}</AuthFeaturesProvider>
      </ThemeProvider>
    </TRPCQueryClientProvider>
  );
}
