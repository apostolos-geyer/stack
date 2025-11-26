import { describe, it, expect } from 'vitest'
import { parseSupabaseStatus } from '../utils/supabase.ts'

describe('supabase automation', () => {
  describe('parseSupabaseStatus', () => {
    it('extracts Database URL from status output', () => {
      const output = `
Stopped services: [supabase_imgproxy_test supabase_pooler_test]
supabase local development setup is running.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
         MCP URL: http://127.0.0.1:54321/mcp
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
     Mailpit URL: http://127.0.0.1:54324
 Publishable key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
      Secret key: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
`
      const result = parseSupabaseStatus(output)
      expect(result.databaseUrl).toBe('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    })

    it('extracts all URLs from status output', () => {
      const output = `
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
`
      const result = parseSupabaseStatus(output)

      expect(result.apiUrl).toBe('http://127.0.0.1:54321')
      expect(result.graphqlUrl).toBe('http://127.0.0.1:54321/graphql/v1')
      expect(result.databaseUrl).toBe('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
      expect(result.studioUrl).toBe('http://127.0.0.1:54323')
    })

    it('handles output with different whitespace', () => {
      const output = `
API URL: http://127.0.0.1:54321
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
`
      const result = parseSupabaseStatus(output)
      expect(result.databaseUrl).toBe('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    })

    it('throws if Database URL not found', () => {
      const output = `
         API URL: http://127.0.0.1:54321
      Studio URL: http://127.0.0.1:54323
`
      expect(() => parseSupabaseStatus(output)).toThrow('Database URL not found')
    })

    it('throws if API URL not found', () => {
      const output = `
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
`
      expect(() => parseSupabaseStatus(output)).toThrow('missing required URLs')
    })

    it('throws on empty output', () => {
      expect(() => parseSupabaseStatus('')).toThrow()
    })

    it('throws on invalid output', () => {
      expect(() => parseSupabaseStatus('some random text')).toThrow()
    })
  })
})
