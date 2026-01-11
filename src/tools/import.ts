import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import type { Config } from '../lib/schemas.js'

const TOOL_NAME = 'onsong.library.import'
const TOOL_DESCRIPTION = 'Import a chart file into OnSong via URL scheme'

const inputSchema = {
  file_path: z.string().optional().describe('Path to chart file to import'),
  content_base64: z.string().optional().describe('Base64-encoded chart content'),
  filename: z.string().optional().describe('Filename for base64 content'),
  destination: z.string().optional().describe('Target set or collection name'),
  open_after_import: z.boolean().default(false).describe('Open the song after importing'),
}

export function registerImportTool(server: McpServer, config: Config): void {
  const urlScheme = new UrlSchemeService()

  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    try {
      if (config.enableImport !== true) {
        throw new OnSongError(ErrorCodes.IMPORT_DISABLED, {
          message: 'Import operations are disabled. Set enableImport: true in config.',
        })
      }

      if (!urlScheme.isSupported()) {
        throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
          message: 'URL schemes only supported on macOS',
        })
      }

      const hasFilePath = args.file_path !== undefined
      const hasBase64 = args.content_base64 !== undefined

      if (hasFilePath === hasBase64) {
        throw new OnSongError(ErrorCodes.INVALID_INPUT, {
          message: 'Either file_path or content_base64 must be provided, but not both',
        })
      }

      let filename: string
      let base64Content: string

      if (hasFilePath && args.file_path !== undefined) {
        try {
          const fileContent = await readFile(args.file_path)
          base64Content = fileContent.toString('base64')
          filename = basename(args.file_path)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          throw new OnSongError(ErrorCodes.FILE_READ_ERROR, {
            path: args.file_path,
            message,
          })
        }
      } else {
        if (args.filename === undefined) {
          throw new OnSongError(ErrorCodes.INVALID_INPUT, {
            message: 'filename is required when content_base64 is provided',
          })
        }
        filename = args.filename
        base64Content = args.content_base64 as string
      }

      await urlScheme.importChart(filename, base64Content)

      const warnings: string[] = []

      if (args.destination !== undefined) {
        warnings.push('destination parameter is not yet implemented')
      }

      if (args.open_after_import === true) {
        warnings.push('open_after_import parameter is not yet implemented')
      }

      const result = {
        ok: true,
        ...(warnings.length > 0 ? { warnings } : {}),
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      return mcpError(error)
    }
  })
}
