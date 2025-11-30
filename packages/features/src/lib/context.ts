import type { PrismaClient } from '@_/db';

import { type Auth, type AuthSession, type AuthUser, auth } from '../auth';

export type ConstContext = {
  db: PrismaClient;
  auth: Auth;
};

export type InjectedContext = {
  session: AuthSession | null;
  user: AuthUser | null;
};

export type AuthenticatedInjectedContext = {
  session: AuthSession;
  user: AuthUser;
};

/**
 * Inner context - environment-agnostic, pure data
 * Can be used in tRPC, Hono, cron jobs, CLI, tests
 */
export type InnerContext = ConstContext & InjectedContext;

/**
 * Authenticated context - guaranteed to have user and session
 */
export type AuthenticatedInnerContext = ConstContext &
  AuthenticatedInjectedContext;
// compat
export type AuthenticatedContext = AuthenticatedInnerContext;

export type ContextFactory<Options extends {} = object> = (
  o: Options,
) => Promise<InnerContext> | InnerContext;

export type CreateInnerContextOptions = {
  session: AuthSession | null;
  user: AuthUser | null;
  $override?: ConstContext;
};

/**
 * Factory to create inner context
 * Called by outer context creators (HTTP handlers, test setup, etc.)
 */
export const createInnerContext: ContextFactory<
  CreateInnerContextOptions
> = async ({ $override, ...ctx }) =>
  ({
    db: await _getDb(),
    auth,
    ...ctx,
    ...$override,
  }) as const satisfies InnerContext;

/**
 * Reqiured dynamic import because Prisma uses SharedArrayBuffer
 * which is unavailable in native.
 *
 * In general we should only be using this module on the server anyways.
 */
const _getDb = async () => {
  const { prisma } = await import('@_/db');
  return prisma;
};
