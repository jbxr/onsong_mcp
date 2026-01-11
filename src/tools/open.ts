import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import { openOutputSchema } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_open'
const TOOL_TITLE = 'Open in OnSong'
const TOOL_DESCRIPTION = 'Open a specific song or set in OnSong'

const inputSchema = z.object({
  type: z.enum(['song', 'set']).describe('What to open'),
  identifier: z.string().min(1).describe('Song or set name/ID'),
})

export function registerOpenTool(server: McpServer): void {
  const urlScheme = new UrlSchemeService()

  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: openOutputSchema,
    },
    async (args) => {
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
          structuredContent: result,
        }
      } catch (error) {
        return mcpError(error)
      }
    }
  )
}
