'use client';

import { ThemeProvider } from 'next-themes';
import { createAuthFeatures } from '@_/features.client/auth';
import { authClient } from '@_/features/auth/client';
import { TRPCQueryClientProvider } from '@_/features.client/lib';

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
