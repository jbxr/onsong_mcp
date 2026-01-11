import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import { actionOutputSchema } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_action_run'
const TOOL_TITLE = 'Run OnSong Action'
const TOOL_DESCRIPTION = 'Trigger a named OnSong action (next/previous song, scroll, pedal actions)'

const inputSchema = z.object({
  action_name: z
    .string()
    .min(1)
    .describe('Action identifier (e.g., ForwardPedalWasPressed, BackwardPedalWasPressed)'),
  args: z
    .record(z.unknown())
    .optional()
    .describe('Action parameters (e.g., amount for scroll position)'),
})

export function registerActionRunTool(server: McpServer): void {
  const urlScheme = new UrlSchemeService()

  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: actionOutputSchema,
    },
    async (args) => {
      try {
        if (!urlScheme.isSupported()) {
          throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
            message: 'URL schemes only supported on macOS',
          })
        }

        const actionArgs = args.args

        await urlScheme.runAction(args.action_name, actionArgs)

        const isKnown = urlScheme.isKnownAction(args.action_name)
        const warnings: string[] = []

        if (!isKnown) {
          warnings.push(
            `Unknown action: ${args.action_name}. Known actions: ${urlScheme.getKnownActions().join(', ')}`
          )
        }

        const result = {
          ok: true,
          performed_via: 'url_scheme' as const,
          ...(warnings.length > 0 ? { warnings } : {}),
        }

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
