console.log('[TRACE] @_/platform/server - START', Date.now());

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

console.log('[TRACE] @_/platform/server - after imports', Date.now());

export const serverEnv = createEnv({
  server: {
    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),

    // Stripe (optional - only if using payments)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Email (optional - only if using email)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.email().optional(),

    // Social OAuth providers (all optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),

    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Local dev flag
    USE_LOCAL_DB: z.enum(['true', 'false']).optional(),

    // Database
    DATABASE_URL: z.string(),
    // Direct connection for migrations
    DIRECT_URL: z.string(),
  },

  runtimeEnv: process.env,
});

console.log('[TRACE] @_/platform/server - END', Date.now());

export type ServerEnv = typeof serverEnv;
