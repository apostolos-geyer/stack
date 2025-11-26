import { describe, it, expect } from 'vitest'
import { getProvider, getProviderChoices } from '../providers/index.ts'

describe('providers', () => {
  const providerIds = ['sqlite', 'prisma-postgres', 'postgres', 'turso', 'supabase', 'neon']

  describe('getProvider', () => {
    it.each(providerIds)('returns valid config for %s', (providerId) => {
      const provider = getProvider(providerId)

      expect(provider).toBeDefined()
      expect(provider?.id).toBe(providerId)
      expect(provider?.displayName).toBeTruthy()
      expect(provider?.description).toBeTruthy()
    })

    it('returns undefined for unknown provider', () => {
      const provider = getProvider('unknown')
      expect(provider).toBeUndefined()
    })
  })

  describe('getProviderChoices', () => {
    it('returns all 6 providers', () => {
      const choices = getProviderChoices()
      expect(choices).toHaveLength(6)
    })

    it('each choice has name, value, and description', () => {
      const choices = getProviderChoices()

      for (const choice of choices) {
        expect(choice.name).toBeTruthy()
        expect(choice.value).toBeTruthy()
        expect(choice.description).toBeTruthy()
      }
    })
  })

  describe('provider templates', () => {
    it.each(providerIds)('%s has valid clientTs template', (providerId) => {
      const provider = getProvider(providerId)!
      const template = provider.templates.clientTs

      // Should import from correct paths
      expect(template).toContain("import { serverEnv } from '@_/platform/server'")
      expect(template).toContain("import { PrismaClient } from './generated/prisma/client'")

      // Should export prisma
      expect(template).toContain('export const prisma')

      // Should have global singleton pattern
      expect(template).toContain('globalForPrisma')
    })

    it.each(providerIds)('%s has valid prismaConfigTs template', (providerId) => {
      const provider = getProvider(providerId)!
      const template = provider.templates.prismaConfigTs

      // Should use defineConfig
      expect(template).toContain('defineConfig')

      // Should have schema path
      expect(template).toContain('schema.prisma')

      // Should use DIRECT_URL for migrations
      expect(template).toContain('process.env.DIRECT_URL')
    })

    it('postgres, prisma-postgres, and supabase share the same clientTs', () => {
      const postgres = getProvider('postgres')!
      const prismaPostgres = getProvider('prisma-postgres')!
      const supabase = getProvider('supabase')!

      expect(postgres.templates.clientTs).toBe(prismaPostgres.templates.clientTs)
      expect(postgres.templates.clientTs).toBe(supabase.templates.clientTs)
    })

    it('all providers share the same prismaConfigTs', () => {
      const providers = providerIds.map((id) => getProvider(id)!)
      const firstTemplate = providers[0].templates.prismaConfigTs

      for (const provider of providers) {
        expect(provider.templates.prismaConfigTs).toBe(firstTemplate)
      }
    })
  })

  describe('provider local dev options', () => {
    it.each(providerIds)('%s has at least one local dev option', (providerId) => {
      const provider = getProvider(providerId)!

      expect(provider.localDevOptions.length).toBeGreaterThanOrEqual(1)
    })

    it.each(providerIds)('%s local dev options have required fields', (providerId) => {
      const provider = getProvider(providerId)!

      for (const option of provider.localDevOptions) {
        expect(option.type).toBeTruthy()
        expect(option.label).toBeTruthy()
        expect(option.description).toBeTruthy()
        expect(option.envVars).toBeDefined()
        expect(option.packageJsonScripts).toBeDefined()
      }
    })
  })

  describe('provider production env vars', () => {
    it.each(providerIds)('%s has production env vars defined', (providerId) => {
      const provider = getProvider(providerId)!

      expect(provider.productionEnvVars.length).toBeGreaterThanOrEqual(1)
    })

    it.each(providerIds)('%s production env vars have required fields', (providerId) => {
      const provider = getProvider(providerId)!

      for (const envVar of provider.productionEnvVars) {
        expect(envVar.name).toBeTruthy()
        expect(envVar.description).toBeTruthy()
        expect(typeof envVar.required).toBe('boolean')
        expect(envVar.example).toBeTruthy()
      }
    })
  })

  describe('provider-specific requirements', () => {
    it('sqlite uses libsql adapter', () => {
      const provider = getProvider('sqlite')!
      expect(provider.templates.clientTs).toContain('PrismaLibSql')
      expect(provider.prismaProvider).toBe('sqlite')
    })

    it('turso uses libsql adapter with auth token', () => {
      const provider = getProvider('turso')!
      expect(provider.templates.clientTs).toContain('PrismaLibSql')
      expect(provider.templates.clientTs).toContain('authToken')
      expect(provider.prismaProvider).toBe('sqlite')
    })

    it('supabase uses pg adapter', () => {
      const provider = getProvider('supabase')!
      expect(provider.templates.clientTs).toContain('PrismaPg')
      expect(provider.prismaProvider).toBe('postgresql')
    })

    it('neon uses neon adapter (remote-only)', () => {
      const provider = getProvider('neon')!
      expect(provider.templates.clientTs).toContain('PrismaNeon')
      expect(provider.prismaProvider).toBe('postgresql')
      // Neon is remote-only, no dual adapter support
      expect(provider.templates.clientTs).not.toContain('PrismaPg')
      expect(provider.templates.clientTs).not.toContain('USE_LOCAL_DB')
    })

    it('postgres uses pg adapter with Docker', () => {
      const provider = getProvider('postgres')!
      expect(provider.templates.clientTs).toContain('PrismaPg')
      expect(provider.prismaProvider).toBe('postgresql')
      // Postgres has docker-compose.yml template
      expect(provider.templates.dockerComposeYml).toBeDefined()
    })

  })

  describe('provider automation config', () => {
    // Deterministic providers: env vars auto-populated by db-switch.ts
    const deterministicProviders = ['sqlite', 'prisma-postgres', 'postgres', 'supabase']

    // External service providers: require user input
    const externalProviders = ['neon']

    // Partial automation: some vars auto, some user input
    const partialProviders = ['turso']

    it.each(deterministicProviders)(
      '%s has no placeholder env vars (fully automated)',
      (providerId) => {
        const provider = getProvider(providerId)!
        const option = provider.localDevOptions[0]

        // All env var values should either be empty or comments (not placeholders starting with #)
        // Comments inside the envVars object are fine, but actual placeholder values are not
        const envVarValues = Object.values(option.envVars)
        const hasPlaceholder = envVarValues.some(
          (v) => typeof v === 'string' && v.startsWith('#')
        )
        expect(hasPlaceholder).toBe(false)
      }
    )

    it.each(externalProviders)(
      '%s has placeholder env vars (requires user input)',
      (providerId) => {
        const provider = getProvider(providerId)!
        const option = provider.localDevOptions[0]

        // Should have placeholder values starting with #
        const envVarValues = Object.values(option.envVars)
        const hasPlaceholder = envVarValues.some(
          (v) => typeof v === 'string' && v.startsWith('#')
        )
        expect(hasPlaceholder).toBe(true)
      }
    )

    it.each(partialProviders)(
      '%s has placeholder env vars for external vars only',
      (providerId) => {
        const provider = getProvider(providerId)!
        const option = provider.localDevOptions[0]

        // Should have some placeholder values for external services
        const hasPlaceholder = Object.entries(option.envVars).some(([key, value]) => {
          // TURSO_* vars should have placeholders
          if (key.startsWith('TURSO_')) {
            return typeof value === 'string' && value.startsWith('#')
          }
          return false
        })
        expect(hasPlaceholder).toBe(true)
      }
    )

    it('neon requires both DATABASE_URL and DIRECT_URL from user', () => {
      const provider = getProvider('neon')!
      const option = provider.localDevOptions[0]

      expect(option.envVars.DATABASE_URL).toMatch(/^#/)
      expect(option.envVars.DIRECT_URL).toMatch(/^#/)
    })

    it('turso requires TURSO_* vars from user but not DATABASE_URL', () => {
      const provider = getProvider('turso')!
      const option = provider.localDevOptions[0]

      // DATABASE_URL should NOT be a placeholder (auto-filled with local SQLite)
      expect(option.envVars.DATABASE_URL).toBeUndefined()

      // TURSO_* vars should be placeholders
      expect(option.envVars.TURSO_DATABASE_URL).toMatch(/^#/)
      expect(option.envVars.TURSO_AUTH_TOKEN).toMatch(/^#/)
      expect(option.envVars.TURSO_DB_NAME).toMatch(/^#/)
    })
  })
})
