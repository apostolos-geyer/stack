import {
  auth,
  type AuthSession,
  type AuthUser,
  type Auth,
} from "@_/infra.auth";
import { prisma as db, type PrismaClient } from "@_/infra.db";

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

export type ContextFactory<Options extends {} = {}> = (
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
export const createInnerContext: ContextFactory<CreateInnerContextOptions> = ({
  $override,
  ...ctx
}) =>
  ({
    db,
    auth,
    ...ctx,
    ...$override,
  }) as const satisfies InnerContext;
