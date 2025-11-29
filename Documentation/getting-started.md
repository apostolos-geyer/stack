# getting started

## prereqs

- node 20+
- pnpm (`npm i -g pnpm`)
- a database (sqlite works fine locally)

## install

```bash
pnpm install
```

## env

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

generate an auth secret:

```bash
./scripts/generate-secret.sh
```

add it to `.env`:

```env
AUTH_SECRET=your_generated_secret
```

### database urls

**sqlite**
```env
DATABASE_URL="file:./dev.db"
```

**postgres**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

**supabase**
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

**neon**
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/db"
```

**turso**
```env
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your_token"
```

## migrate

```bash
pnpm --filter @_/db db:migrate:dev --name init
```

## run

```bash
pnpm dev
```

[localhost:3000](http://localhost:3000)
