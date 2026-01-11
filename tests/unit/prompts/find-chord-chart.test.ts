import { describe, it, expect, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerFindChordChartPrompt } from '../../../src/prompts/find-chord-chart.js'

describe('registerFindChordChartPrompt', () => {
  let server: McpServer

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    })
  })

  it('registers without throwing errors', () => {
    expect(() => registerFindChordChartPrompt(server)).not.toThrow()
  })
})
