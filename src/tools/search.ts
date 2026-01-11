import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError } from '../lib/errors.js'
import { searchOutputSchema, targetSchema } from '../lib/schemas.js'
import type { ApiSongObject } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_library_search'
const TOOL_TITLE = 'Search OnSong Library'
const TOOL_DESCRIPTION = 'Search songs by title, artist, or text query'

const inputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  query: z.string().min(1).describe('Search query (matches title, artist, keywords, lyrics)'),
  limit: z.number().int().min(1).max(100).default(25).describe('Maximum results to return'),
})

function transformSong(apiSong: ApiSongObject): Record<string, unknown> {
  return {
    id: apiSong.ID,
    title: apiSong.title,
    artist: apiSong.artist,
    key: apiSong.key,
    favorite: apiSong.favorite === 1,
  }
}

export function registerSearchTool(server: McpServer): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: searchOutputSchema,
    },
    async (args) => {
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
          structuredContent: result,
        }
      } catch (error) {
        return mcpError(error)
      }
    }
  )
}
