import { describe, it, expect, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerFormatChordProPrompt } from '../../../src/prompts/format-chordpro.js'

describe('registerFormatChordProPrompt', () => {
  let server: McpServer

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    })
  })

  it('registers without throwing errors', () => {
    expect(() => registerFormatChordProPrompt(server)).not.toThrow()
  })
})
