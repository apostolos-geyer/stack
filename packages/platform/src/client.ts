import { createEnv } from '@t3-oss/env-nextjs';

export const clientEnv = createEnv({
  client: {
    // Add client-side env vars here (must be prefixed with NEXT_PUBLIC_)
    // Example:
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    // Map each client var to process.env
    // NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});

export type ClientEnv = typeof clientEnv;
