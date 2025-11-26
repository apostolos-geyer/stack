#!/usr/bin/env npx tsx
/**
 * Patches the Prisma schema after Better Auth CLI generates auth models.
 *
 * Better Auth CLI is not yet compatible with Prisma 7 and adds back the
 * deprecated `url` property in the datasource block. It also uses the old
 * `prisma-client-js` provider name instead of `prisma-client`.
 *
 * This script fixes both issues.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = resolve(__dirname, '..', 'prisma', 'schema.prisma')

let schema = readFileSync(schemaPath, 'utf-8')

// Fix generator: prisma-client-js -> prisma-client with output path
schema = schema.replace(
  /generator\s+client\s*\{\s*\n\s*provider\s*=\s*"prisma-client-js"\s*\n\s*\}/g,
  `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}`
)

// Also handle case where it's already prisma-client but missing output
schema = schema.replace(
  /generator\s+client\s*\{\s*\n\s*provider\s*=\s*"prisma-client"\s*\n\s*\}/g,
  `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}`
)

// Remove url from datasource block (Prisma 7 requires url in prisma.config.ts)
schema = schema.replace(
  /(\ndatasource\s+\w+\s*\{[^}]*)\n\s*url\s*=\s*env\([^)]+\)/g,
  '$1'
)

writeFileSync(schemaPath, schema)

console.log('✓ Patched schema.prisma for Prisma 7 compatibility')
