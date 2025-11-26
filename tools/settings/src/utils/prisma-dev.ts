/**
 * @fileoverview Prisma Dev server management
 * Programmatically launches Prisma Dev (PgLite) and captures the connection string
 */

import { log } from "./logger.ts";

export interface PrismaDevServer {
  databaseUrl: string;
  directUrl: string;
  stop: () => Promise<void>;
}

/**
 * Launches a local Prisma Dev server and returns the connection string
 * Uses @prisma/dev unstable_startServer API
 *
 * @param name - Database instance name (e.g., 'template')
 * @returns Server info including connection string
 */
export async function launchPrismaDev(
  name: string = "template",
): Promise<PrismaDevServer> {
  log.info(`Starting Prisma Dev server (${name})...`);

  try {
    // Dynamic import to avoid issues if @prisma/dev isn't installed yet
    const { unstable_startServer } = await import("@prisma/dev");

    const server = await unstable_startServer({
      name,
      persistenceMode: "stateful", // Persist data between runs
    });

    const databaseUrl = server.database.prismaORMConnectionString!;
    const directUrl = server.ppg.url;

    log.success(`Prisma Dev server started`);
    log.info(`Connection string: ${databaseUrl.substring(0, 50)}...`);

    return {
      databaseUrl,
      directUrl,
      stop: async () => {
        log.info("Stopping Prisma Dev server...");
        await server.close();
        log.success("Prisma Dev server stopped");
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Cannot find module")
    ) {
      throw new Error(
        "Prisma Dev (@prisma/dev) is not installed. Run: pnpm add -D @prisma/dev",
      );
    }
    throw error;
  }
}

/**
 * Checks if Prisma Dev is available
 */
export async function isPrismaDevAvailable(): Promise<boolean> {
  try {
    await import("@prisma/dev");
    return true;
  } catch {
    return false;
  }
}

/**
 * Stops all running Prisma Dev instances matching a pattern
 * @param namePattern - Glob pattern for instance names
 */
export async function stopPrismaDevInstances(
  namePattern: string = "*",
): Promise<void> {
  try {
    const { execSync } = await import("node:child_process");
    execSync(`npx prisma dev stop "${namePattern}"`, { stdio: "pipe" });
    log.success(`Stopped Prisma Dev instances matching: ${namePattern}`);
  } catch {
    // Ignore errors - instances may not be running
  }
}
