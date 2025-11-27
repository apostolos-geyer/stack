'use server';
import { type ContextFactory, createInnerContext } from '@_/lib.server';
import { cache } from 'react';

import { getSession } from './dal';

/**
 * Creates the tRPC context for HTTP requests
 * Extracts the auth session from headers and creates an InnerContext
 */
export const createContext: ContextFactory = cache(async () =>
  createInnerContext((await getSession()) ?? { user: null, session: null }),
);
