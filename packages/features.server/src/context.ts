import type { PrismaClient } from "@_/infra.db";
import type { Auth, AuthSession, AuthUser } from "@_/infra.auth";

/**
 * Inner context - environment-agnostic, pure data
 * Can be used in tRPC, Hono, cron jobs, CLI, tests
 */
export type InnerContext = {
  db: PrismaClient;
  auth: Auth;
  session: AuthSession | null;
  user: AuthUser | null;
};

/**
 * Authenticated context - guaranteed to have user and session
 */
export type AuthenticatedContext = {
  db: PrismaClient;
  auth: Auth;
  session: AuthSession;
  user: AuthUser;
};

/**
 * Factory to create inner context
 * Called by outer context creators (HTTP handlers, test setup, etc.)
 */
export function createInnerContext(deps: {
  db: PrismaClient;
  auth: Auth;
  session: AuthSession | null;
  user: AuthUser | null;
}): InnerContext {
  return deps;
}
