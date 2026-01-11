import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'

const TOOL_NAME = 'onsong.open'
const TOOL_DESCRIPTION = 'Open a specific song or set in OnSong'

const inputSchema = {
  type: z.enum(['song', 'set']).describe('What to open'),
  identifier: z.string().min(1).describe('Song or set name/ID'),
}

export function registerOpenTool(server: McpServer): void {
  const urlScheme = new UrlSchemeService()

  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    try {
      if (!urlScheme.isSupported()) {
        throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
          message: 'URL schemes only supported on macOS',
        })
      }

      if (args.type === 'song') {
        await urlScheme.openSong(args.identifier)
      } else {
        await urlScheme.openSet(args.identifier)
      }

      const result = { ok: true }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      return mcpError(error)
    }
  })
}
