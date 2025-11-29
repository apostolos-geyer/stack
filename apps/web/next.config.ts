import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    viewTransition: true,
    authInterrupts: true,
  },
  transpilePackages: [
    '@_/api.trpc',
    '@_/features',
    '@_/features.client',
    '@_/db',
    '@_/lib.email',
    '@_/platform',
    '@_/ui.utils',
    '@_/ui.web',
  ],
};

export default nextConfig;
