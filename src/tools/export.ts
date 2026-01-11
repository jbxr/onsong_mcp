import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { UrlSchemeService } from '../services/url-scheme.js'
import { CallbackServer, type ExportCallbackData } from '../services/callback-server.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import type { Config } from '../lib/schemas.js'
import { createChildLogger } from '../lib/logger.js'

const TOOL_NAME = 'onsong.library.export'
const TOOL_DESCRIPTION = 'Export songs/sets/library to local files in specified format'

const EXPORT_TIMEOUT_MS = 60000
const FORMAT_EXTENSIONS: Record<string, string> = {
  onsong: '.onsong',
  chordpro: '.cho',
  txt: '.txt',
  pdf: '.pdf',
}

const inputSchema = {
  scope: z.enum(['song', 'set', 'library']).describe('Export scope'),
  identifier: z.string().min(1).describe('Song ID/name or set name to export'),
  format: z.enum(['onsong', 'chordpro', 'txt', 'pdf']).describe('Output format'),
  output_dir: z.string().min(1).describe('Directory path for exported files'),
}

export function registerExportTool(server: McpServer, config: Config): void {
  const logger = createChildLogger({ tool: TOOL_NAME })
  const urlScheme = new UrlSchemeService()
  const callbackServer = new CallbackServer(config.callbackPort)

  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    const requestId = randomUUID()

    try {
      if (!urlScheme.isSupported()) {
        throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
          message: 'URL schemes only supported on macOS',
        })
      }

      await mkdir(args.output_dir, { recursive: true })

      await callbackServer.start()

      const returnUrl = callbackServer.getCallbackUrl(requestId)
      const collection = buildCollectionString(args.scope, args.identifier)

      logger.info({ requestId, collection, format: args.format }, 'Starting export')

      const callbackPromise = callbackServer.waitForCallback(requestId, EXPORT_TIMEOUT_MS)

      await urlScheme.exportSongs({
        collection,
        returnUrl,
        format: args.format,
      })

      const callbackData = await callbackPromise
      const exportedFiles = await writeExportedFiles(callbackData, args.output_dir, args.format)

      const warnings: string[] = []
      if (callbackData.files.length === 0) {
        warnings.push('No files were returned from OnSong export')
      }

      const result = {
        exported_files: exportedFiles,
        ...(warnings.length > 0 ? { warnings } : {}),
      }

      logger.info({ requestId, fileCount: exportedFiles.length }, 'Export completed')

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      callbackServer.cancelWait(requestId)
      return mcpError(error)
    }
  })
}

function buildCollectionString(scope: 'song' | 'set' | 'library', identifier: string): string {
  switch (scope) {
    case 'song':
      return identifier
    case 'set':
      return `set:${identifier}`
    case 'library':
      return 'all'
  }
}

async function writeExportedFiles(
  data: ExportCallbackData,
  outputDir: string,
  format: string
): Promise<string[]> {
  const writtenFiles: string[] = []
  const defaultExt = FORMAT_EXTENSIONS[format] ?? '.txt'

  for (const file of data.files) {
    const filename = ensureExtension(file.name, defaultExt)
    const filepath = join(outputDir, sanitizeFilename(filename))

    const content = file.contentType.includes('base64')
      ? Buffer.from(file.content, 'base64')
      : file.content

    await writeFile(filepath, content)
    writtenFiles.push(filepath)
  }

  return writtenFiles
}

function ensureExtension(filename: string, defaultExt: string): string {
  const ext = extname(filename)
  if (ext === '' || ext === '.') {
    return filename + defaultExt
  }
  return filename
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255)
}
