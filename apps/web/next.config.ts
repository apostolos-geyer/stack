import type { NextConfig } from 'next';

console.log('[TRACE] next.config.ts - START', Date.now());

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    '@_/api.trpc',
    '@_/features.client',
    '@_/features.server',
    '@_/infra.auth',
    '@_/infra.db',
    '@_/lib.client',
    '@_/lib.email',
    '@_/lib.server',
    '@_/platform',
    '@_/ui.utils',
    '@_/ui.web',
  ],
};

console.log('[TRACE] next.config.ts - END', Date.now());

export default nextConfig;
