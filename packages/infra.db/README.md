# Database Package (@_/infra.db)

This package uses **PostgreSQL (Unmanaged)** with Prisma 7.

## Quick Start

### Prerequisites
- Docker Desktop must be running

### Local Development
1. Start PostgreSQL: `pnpm db:start`
2. Run migrations: `pnpm db:migrate:dev --name init`
3. Open Prisma Studio: `pnpm db:studio`

### Database Viewer (Adminer)
Access Adminer at http://localhost:8080 to browse, create, and edit database entries.
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: dev

### Stopping the Database
```bash
pnpm db:stop
```

The database data is persisted in a Docker volume.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## Local Development

**Selected method:** Docker Compose

Run PostgreSQL in Docker container (auto-configured)

## Commands

```bash
pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate:dev # Run migrations
pnpm db:studio      # Open Prisma Studio
```

## Official Documentation

- [Prisma + PostgreSQL (Unmanaged)](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [PostgreSQL (Unmanaged) Docs](https://www.postgresql.org/docs/)

## Troubleshooting

**"docker: command not found"**
- Install Docker Desktop from https://docker.com

**Port 5432 already in use**
- Stop other PostgreSQL instances
- Or change the port in docker-compose.yml

**Port 8080 already in use (Adminer)**
- Stop other services using port 8080
- Or change the Adminer port in docker-compose.yml

**Connection refused**
- Ensure Docker Desktop is running
- Start the container: `pnpm db:start`
- Check container status: `docker compose ps`

**Reset database**
```bash
pnpm db:stop
docker volume rm infra.db_postgres_data
pnpm db:start
```
