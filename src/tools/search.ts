import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError } from '../lib/errors.js'
import type { ApiSongObject } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_library_search'
const TOOL_DESCRIPTION = 'Search songs by title, artist, or text query'

const targetSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  token: z.string().min(32).optional(),
})

const inputSchema = {
  target: targetSchema.describe('Connection target'),
  query: z.string().min(1).describe('Search query (matches title, artist, keywords, lyrics)'),
  limit: z.number().int().min(1).max(100).default(25).describe('Maximum results to return'),
}

function transformSong(apiSong: ApiSongObject): object {
  return {
    id: apiSong.ID,
    title: apiSong.title,
    artist: apiSong.artist,
    key: apiSong.key,
    favorite: apiSong.favorite === 1,
  }
}

export function registerSearchTool(server: McpServer): void {
  server.tool(TOOL_NAME, TOOL_DESCRIPTION, inputSchema, async (args) => {
    try {
      const client = await createAuthenticatedClient(args.target)

      const searchResult = await client.searchSongs({
        q: args.query,
        limit: args.limit,
      })

      const result = {
        songs: searchResult.results.map(transformSong),
        total_count: searchResult.count,
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      return mcpError(error)
    }
  })
}
