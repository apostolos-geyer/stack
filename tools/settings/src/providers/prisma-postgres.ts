import type {
  ProviderConfig,
  LocalDevOption,
  SetupContext,
  SetupResult,
} from "./index.ts";
import { PG_CLIENT_TS, PRISMA_CONFIG_TS } from "./templates.ts";
import { launchPrismaDev } from "../utils/prisma-dev.ts";

/**
 * Prisma Postgres provider configuration
 *
 * Uses Prisma Dev (PgLite) for local development - no Docker required.
 * The CLI automatically captures the connection string from `prisma dev`.
 */
export const prismaPostgres: ProviderConfig = {
  id: "prisma-postgres",
  displayName: "Prisma Postgres",
  description: "Prisma Postgres with PgLite local development",
  prismaProvider: "postgresql",
  authAdapterProvider: "postgresql",
  dependencies: {
    add: {
      "@prisma/adapter-pg": "^7.0.0",
      pg: "^8.13.0",
    },
    remove: ["@prisma/adapter-libsql", "@prisma/adapter-neon"],
  },
  localDevOptions: [
    {
      type: "prisma-dev",
      label: "Prisma Dev (PgLite)",
      description: "Local PostgreSQL without Docker (auto-configured)",
      envVars: {
        // DATABASE_URL is auto-captured from Prisma Dev by db-switch.ts
      },
      packageJsonScripts: {
        dev: "prisma dev --name template",
        "db:studio": "prisma studio",
        "db:start": "prisma dev --name template",
        "db:stop": "prisma dev stop template",
      },
    },
  ],
  productionEnvVars: [
    {
      name: "DATABASE_URL",
      description: "PostgreSQL connection string",
      required: true,
      example: "postgresql://user:password@host:5432/dbname",
    },
  ],
  docs: {
    prisma: "https://www.prisma.io/docs/orm/overview/databases/postgresql",
    provider: "https://www.prisma.io/docs/orm/overview/databases/postgresql",
  },
  templates: {
    clientTs: PG_CLIENT_TS,
    prismaConfigTs: PRISMA_CONFIG_TS,
  },
  readme: {
    quickstart: `## Quick Start

1. Start Prisma Dev: \`pnpm dev\` (or \`pnpm db:start\`)
2. The DATABASE_URL is automatically configured in \`.env\`
3. Run migrations: \`pnpm db:migrate:dev --name init\`
4. Open Prisma Studio: \`pnpm db:studio\`

Prisma Dev uses PgLite - a lightweight PostgreSQL that runs locally without Docker.`,
    troubleshooting: `## Troubleshooting

**"prisma dev" command not found**
- Ensure @prisma/dev is installed: \`pnpm add -D @prisma/dev\`

**Connection refused**
- Start Prisma Dev first: \`pnpm db:start\`
- Check if running: \`npx prisma dev ls\`

**Port already in use**
- Stop existing instance: \`npx prisma dev stop template\``,
  },

  async setup(
    _localDevOption: LocalDevOption,
    ctx: SetupContext,
  ): Promise<SetupResult> {
    ctx.log.info("Launching Prisma Dev to capture connection string...");

    try {
      const server = await launchPrismaDev("template");
      ctx.log.success("Captured connection string from Prisma Dev");
      await server.stop();

      return {
        envVars: {
          DATABASE_URL: server.databaseUrl,
          DIRECT_URL: server.directUrl,
        },
      };
    } catch (error) {
      ctx.log.warn(
        "Could not launch Prisma Dev - DATABASE_URL and DIRECT_URL will need to be set manually",
      );
      return { envVars: {} };
    }
  },
};
