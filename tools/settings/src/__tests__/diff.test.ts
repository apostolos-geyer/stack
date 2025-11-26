import { describe, it, expect } from 'vitest'
import { generateDiff } from '../diff/generator.ts'

describe('generateDiff', () => {
  it('returns empty string when contents are identical', () => {
    const content = 'line 1\nline 2\nline 3'
    const result = generateDiff(content, content, '/path/to/file.ts')
    expect(result).toBe('')
  })

  it('generates unified diff for simple change', () => {
    const oldContent = 'line 1\nline 2\nline 3'
    const newContent = 'line 1\nline 2 modified\nline 3'
    const result = generateDiff(oldContent, newContent, '/path/to/file.ts')

    expect(result).toContain('--- /path/to/file.ts')
    expect(result).toContain('+++ /path/to/file.ts')
    expect(result).toContain('-line 2')
    expect(result).toContain('+line 2 modified')
  })

  it('generates diff for added lines', () => {
    const oldContent = 'line 1\nline 2'
    const newContent = 'line 1\nline 2\nline 3'
    const result = generateDiff(oldContent, newContent, '/path/to/file.ts')

    expect(result).toContain('+line 3')
  })

  it('generates diff for removed lines', () => {
    const oldContent = 'line 1\nline 2\nline 3'
    const newContent = 'line 1\nline 2'
    const result = generateDiff(oldContent, newContent, '/path/to/file.ts')

    expect(result).toContain('-line 3')
  })

  it('handles empty old content (new file)', () => {
    const oldContent = ''
    const newContent = 'new content\nmore content'
    const result = generateDiff(oldContent, newContent, '/path/to/new-file.ts')

    expect(result).toContain('+new content')
    expect(result).toContain('+more content')
  })

  it('handles empty new content (deleted file)', () => {
    const oldContent = 'old content\nmore content'
    const newContent = ''
    const result = generateDiff(oldContent, newContent, '/path/to/deleted-file.ts')

    expect(result).toContain('-old content')
    expect(result).toContain('-more content')
  })

  it('includes context lines around changes', () => {
    const oldContent = 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7'
    const newContent = 'line 1\nline 2\nline 3\nMODIFIED\nline 5\nline 6\nline 7'
    const result = generateDiff(oldContent, newContent, '/path/to/file.ts')

    // Should include context lines around the change
    expect(result).toContain(' line 2')
    expect(result).toContain(' line 3')
    expect(result).toContain('-line 4')
    expect(result).toContain('+MODIFIED')
    expect(result).toContain(' line 5')
    expect(result).toContain(' line 6')
  })
})
