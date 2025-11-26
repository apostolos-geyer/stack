import { headers } from "next/headers";
import { auth } from "@_/infra.auth";
import { prisma } from "@_/infra.db";
import { createInnerContext, type InnerContext } from "@_/lib.server";

/**
 * Creates the tRPC context for HTTP requests
 * Extracts the auth session from headers and creates an InnerContext
 */
export async function createContext(): Promise<InnerContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return createInnerContext({
    db: prisma,
    auth,
    session: session?.session ?? null,
    user: session?.user ?? null,
  });
}
