import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import { importOutputSchema, targetSchema } from '../lib/schemas.js'
import type { Config } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_library_import'
const TOOL_TITLE = 'Import Chart to OnSong'
const TOOL_DESCRIPTION =
  'Import a chart file into OnSong. Use target for remote devices (REST API) or omit for local (URL scheme)'

const inputSchema = z.object({
  target: targetSchema.optional().describe('Remote OnSong device to import to (uses REST API)'),
  file_path: z.string().optional().describe('Path to chart file to import'),
  content: z.string().optional().describe('Chart content in OnSong/ChordPro format'),
  content_base64: z.string().optional().describe('Base64-encoded chart content (for URL scheme)'),
  filename: z.string().optional().describe('Filename for base64 content'),
})

export function registerImportTool(server: McpServer, config: Config): void {
  const urlScheme = new UrlSchemeService()

  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: importOutputSchema,
    },
    async (args) => {
      try {
        if (config.enableImport !== true) {
          throw new OnSongError(ErrorCodes.IMPORT_DISABLED, {
            message: 'Import operations are disabled. Set enableImport: true in config.',
          })
        }

        let content: string

        const hasFilePath = args.file_path !== undefined
        const hasContent = args.content !== undefined
        const hasBase64 = args.content_base64 !== undefined
        const sourceCount = [hasFilePath, hasContent, hasBase64].filter(Boolean).length

        if (sourceCount !== 1) {
          throw new OnSongError(ErrorCodes.INVALID_INPUT, {
            message: 'Exactly one of file_path, content, or content_base64 must be provided',
          })
        }

        if (hasFilePath && args.file_path !== undefined) {
          try {
            content = await readFile(args.file_path, 'utf-8')
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            throw new OnSongError(ErrorCodes.FILE_READ_ERROR, { path: args.file_path, message })
          }
        } else if (hasContent && args.content !== undefined) {
          content = args.content
        } else if (hasBase64 && args.content_base64 !== undefined) {
          content = Buffer.from(args.content_base64, 'base64').toString('utf-8')
        } else {
          throw new OnSongError(ErrorCodes.INVALID_INPUT, { message: 'No content source provided' })
        }

        if (args.target !== undefined) {
          const client = await createAuthenticatedClient(args.target, 'OnSong MCP Server')

          const { songId, title } = await client.importSong(content)

          const result = { ok: true, songId, title, method: 'rest_api' }
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            structuredContent: result,
          }
        }

        if (!urlScheme.isSupported()) {
          throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
            message: 'URL schemes only supported on macOS. Provide target for remote import.',
          })
        }

        const filename = args.filename ?? basename(args.file_path ?? 'imported.onsong')
        const base64Content = Buffer.from(content).toString('base64')

        await urlScheme.importChart(filename, base64Content)

        const result = { ok: true, method: 'url_scheme' }
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
