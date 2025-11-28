'use client';

console.log('[TRACE] app/providers.tsx - START', Date.now());

import { ThemeProvider } from 'next-themes';

console.log('[TRACE] app/providers.tsx - after next-themes', Date.now());

import { TRPCQueryClientProvider } from '@_/lib.client';
import { createAuthFeatures } from '@_/features.client/auth';
import { authClient } from '@_/infra.auth/client';
import { FloatingHeader } from './components/floating-header';

console.log('[TRACE] app/providers.tsx - after lib.client', Date.now());

const AuthFeaturesProvider = createAuthFeatures(authClient);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCQueryClientProvider url="/api/trpc">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthFeaturesProvider>
          <FloatingHeader />
          {children}
        </AuthFeaturesProvider>
      </ThemeProvider>
    </TRPCQueryClientProvider>
  );
}
