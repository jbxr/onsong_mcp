import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError } from '../lib/errors.js'

const TOOL_NAME = 'onsong_connect_test'
const TOOL_DESCRIPTION = 'Validate that a chosen OnSong device is reachable and authenticated'

const inputSchema = {
  host: z.string().min(1).describe('Target host IP or hostname'),
  port: z.number().int().min(1).max(65535).describe('Target port number'),
}

export function registerConnectTestTool(server: McpServer): void {
  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    try {
      const client = await createAuthenticatedClient({ host: args.host, port: args.port })
      const pingResult = await client.ping()

      const result = {
        ok: true,
        version: pingResult.pong,
        capabilities: {
          connectState: true,
          connectSearch: true,
          connectSets: true,
          urlImport: true,
          urlExport: true,
          urlActions: true,
          urlOpen: true,
        },
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      return mcpError(error)
    }
  })
}
