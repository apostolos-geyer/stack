import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from "./index.ts";
import { SYSTEM_DEPS } from "../utils/system-deps.ts";
import { PG_CLIENT_TS, PRISMA_CONFIG_TS } from "./templates.ts";

/**
 * Unmanaged PostgreSQL provider configuration
 *
 * Uses Docker Compose for local development with a standard PostgreSQL container.
 * Generates a docker-compose.yml file in the db package.
 */
export const postgres: ProviderConfig = {
  id: "postgres",
  displayName: "PostgreSQL (Unmanaged)",
  description: "Standard PostgreSQL with Docker Compose for local development",
  prismaProvider: "postgresql",
  authAdapterProvider: "postgresql",
  dependencies: {
    add: {
      "@prisma/adapter-pg": "^7.0.0",
      pg: "^8.13.0",
    },
    remove: ["@prisma/adapter-libsql", "@prisma/adapter-neon"],
  },
  scripts: {
    "db:migrate:deploy": "prisma migrate deploy",
  },
  localDevOptions: [
    {
      type: "docker",
      label: "Docker Compose",
      description: "Run PostgreSQL in Docker container (auto-configured)",
      envVars: {
        // DATABASE_URL is auto-populated by db-switch.ts (matches docker-compose.yml)
      },
      packageJsonScripts: {
        dev: "docker compose --profile postgres up -d && prisma studio",
        "db:start": "docker compose --profile postgres up -d",
        "db:stop": "docker compose --profile postgres down",
      },
      systemDeps: [SYSTEM_DEPS.docker],
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
    provider: "https://www.postgresql.org/docs/",
  },
  templates: {
    clientTs: PG_CLIENT_TS,
    prismaConfigTs: PRISMA_CONFIG_TS,
    // Uses repo-level docker-compose.yml with --profile postgres
  },
  readme: {
    quickstart: `## Quick Start

### Prerequisites
- Docker Desktop must be running

### Local Development
1. Start PostgreSQL: \`pnpm db:start\`
2. Run migrations: \`pnpm db:migrate:dev --name init\`
3. Open Prisma Studio: \`pnpm db:studio\`

### Database Viewer (Adminer)
Access Adminer at http://localhost:8080 to browse, create, and edit database entries.
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: dev

### Stopping the Database
\`\`\`bash
pnpm db:stop
\`\`\`

The database data is persisted in a Docker volume.`,
    troubleshooting: `## Troubleshooting

**"docker: command not found"**
- Install Docker Desktop from https://docker.com

**Port 5432 already in use**
- Stop other PostgreSQL instances
- Or change the port in the repo-level docker-compose.yml

**Port 8080 already in use (Adminer)**
- Stop other services using port 8080
- Or change the Adminer port in the repo-level docker-compose.yml

**Connection refused**
- Ensure Docker Desktop is running
- Start the container: \`pnpm db:start\`
- Check container status: \`docker compose --profile postgres ps\`

**Reset database**
\`\`\`bash
pnpm db:stop
docker volume rm stack_postgres_data
pnpm db:start
\`\`\``,
  },

  async setup(_localDevOption: LocalDevOption, ctx: SetupContext): Promise<SetupResult> {
    // Known URL from our docker-compose.yml configuration (no pooler, same for both)
    const postgresUrl = "postgresql://postgres:postgres@localhost:5432/dev";
    ctx.log.success("PostgreSQL URL configured for Docker");

    return {
      envVars: {
        DATABASE_URL: postgresUrl,
        DIRECT_URL: postgresUrl,
      },
    };
  },
};
