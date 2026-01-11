import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { DiscoveryService } from '../services/discovery.js'
import { discoverOutputSchema } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_discover'
const TOOL_TITLE = 'Discover OnSong Devices'
const TOOL_DESCRIPTION = 'Discover OnSong Connect servers on the local network via Bonjour/mDNS'

const inputSchema = z.object({
  timeout_ms: z
    .number()
    .int()
    .min(500)
    .max(30000)
    .default(2000)
    .describe('Discovery timeout in milliseconds'),
})

export function registerDiscoverTool(server: McpServer, discovery: DiscoveryService): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: discoverOutputSchema,
    },
    async (args) => {
      const timeoutMs = args.timeout_ms ?? 2000
      const devices = await discovery.discover(timeoutMs)
      const result = { devices }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      }
    }
  )
}
