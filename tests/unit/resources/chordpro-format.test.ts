import { describe, it, expect, beforeEach, vi } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerChordProResource } from '../../../src/resources/chordpro-format.js'

describe('ChordPro Format Resource', () => {
  let server: McpServer

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    })
  })

  describe('registerChordProResource', () => {
    it('registers the ChordPro format resource', () => {
      registerChordProResource(server)

      // Verify resource is registered by checking internal state
      const resources = (server as any)._registeredResources
      expect(resources).toBeDefined()
      expect(Object.keys(resources).length).toBe(1)

      const resource = resources['docs://chordpro-format']
      expect(resource).toBeDefined()
      expect(resource.name).toBe('chordpro-format')
    })

    it('provides correct resource metadata', () => {
      registerChordProResource(server)

      const resources = (server as any)._registeredResources
      const resource = resources['docs://chordpro-format']

      expect(resource.metadata).toEqual({
        title: 'ChordPro Format Reference',
        description: 'Guide for formatting chord charts for OnSong import',
        mimeType: 'text/markdown',
      })
    })

    it('returns ChordPro guide content when read', async () => {
      registerChordProResource(server)

      const resources = (server as any)._registeredResources
      const resource = resources['docs://chordpro-format']
      const readCallback = resource.readCallback

      const uri = new URL('docs://chordpro-format')
      const result = await readCallback(uri, {} as any)

      expect(result.contents).toBeDefined()
      expect(result.contents).toHaveLength(1)
      expect(result.contents[0]).toHaveProperty('uri', 'docs://chordpro-format')
      expect(result.contents[0]).toHaveProperty('text')
      expect(result.contents[0].text).toContain('ChordPro Format Guide')
      expect(result.contents[0].text).toContain('Metadata Directives')
      expect(result.contents[0].text).toContain('{title: Song Title}')
      expect(result.contents[0].text).toContain('[G]Amazing')
    })

    it('includes all essential ChordPro format sections', async () => {
      registerChordProResource(server)

      const resources = (server as any)._registeredResources
      const resource = resources['docs://chordpro-format']
      const readCallback = resource.readCallback

      const uri = new URL('docs://chordpro-format')
      const result = await readCallback(uri, {} as any)
      const text = result.contents[0].text

      // Check for key sections
      expect(text).toContain('Basic Structure')
      expect(text).toContain('Metadata Directives')
      expect(text).toContain('Section Markers')
      expect(text).toContain('Chord Placement')
      expect(text).toContain('Chord Notation')
      expect(text).toContain('Example')
    })

    it('includes common chord types in notation section', async () => {
      registerChordProResource(server)

      const resources = (server as any)._registeredResources
      const resource = resources['docs://chordpro-format']
      const readCallback = resource.readCallback

      const uri = new URL('docs://chordpro-format')
      const result = await readCallback(uri, {} as any)
      const text = result.contents[0].text

      // Check for chord types
      expect(text).toContain('Major:')
      expect(text).toContain('Minor:')
      expect(text).toContain('Seventh:')
      expect(text).toContain('Slash:')
      expect(text).toContain('Suspended:')
    })

    it('includes a complete example song', async () => {
      registerChordProResource(server)

      const resources = (server as any)._registeredResources
      const resource = resources['docs://chordpro-format']
      const readCallback = resource.readCallback

      const uri = new URL('docs://chordpro-format')
      const result = await readCallback(uri, {} as any)
      const text = result.contents[0].text

      // Check for example song
      expect(text).toContain('Amazing Grace')
      expect(text).toContain('Traditional')
      expect(text).toContain('{comment: Verse 1}')
      expect(text).toContain('[G]Amazing [G/B]grace')
    })
  })
})
