import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { DiscoveryService } from '../services/discovery.js'

const TOOL_NAME = 'onsong.discover'
const TOOL_DESCRIPTION = 'Discover OnSong Connect servers on the local network via Bonjour/mDNS'

const inputSchema = {
  timeout_ms: z
    .number()
    .int()
    .min(500)
    .max(30000)
    .default(2000)
    .describe('Discovery timeout in milliseconds'),
}

export function registerDiscoverTool(server: McpServer, discovery: DiscoveryService): void {
  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    const timeoutMs = args.timeout_ms ?? 2000
    const devices = await discovery.discover(timeoutMs)

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ devices }, null, 2) }],
    }
  })
}
