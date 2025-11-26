import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from "./index.ts";
import { SYSTEM_DEPS } from "../utils/system-deps.ts";
import { PG_CLIENT_TS, PRISMA_CONFIG_TS } from "./templates.ts";

/**
 * Unmanaged PostgreSQL provider configuration
 *
 * Uses Docker Compose for local development with a standard PostgreSQL container.
 * Generates a docker-compose.yml file in the infra.db package.
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
  localDevOptions: [
    {
      type: "docker",
      label: "Docker Compose",
      description: "Run PostgreSQL in Docker container (auto-configured)",
      envVars: {
        // DATABASE_URL is auto-populated by db-switch.ts (matches docker-compose.yml)
      },
      packageJsonScripts: {
        dev: "docker compose up -d && prisma studio",
        "db:studio": "prisma studio",
        "db:start": "docker compose up -d",
        "db:stop": "docker compose down",
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
    // Docker Compose file to be generated
    dockerComposeYml: `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`,
  },
  readme: {
    quickstart: `## Quick Start

### Prerequisites
- Docker Desktop must be running

### Local Development
1. Start PostgreSQL: \`pnpm db:start\`
2. Run migrations: \`pnpm db:migrate:dev --name init\`
3. Open Prisma Studio: \`pnpm db:studio\`

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
- Or change the port in docker-compose.yml

**Connection refused**
- Ensure Docker Desktop is running
- Start the container: \`pnpm db:start\`
- Check container status: \`docker compose ps\`

**Reset database**
\`\`\`bash
pnpm db:stop
docker volume rm infra.db_postgres_data
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
