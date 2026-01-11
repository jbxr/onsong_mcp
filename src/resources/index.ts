import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerChordProResource } from './chordpro-format.js'

export function registerAllResources(server: McpServer): void {
  registerChordProResource(server)
}
