import { describe, it, expect, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAllPrompts } from '../../../src/prompts/index.js'

describe('registerAllPrompts', () => {
  let server: McpServer

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    })
  })

  it('registers all prompts without throwing errors', () => {
    expect(() => registerAllPrompts(server)).not.toThrow()
  })
})
