import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError } from '../lib/errors.js'
import { stateGetOutputSchema, targetSchema } from '../lib/schemas.js'
import type { ApiSongObject, ApiSetObject, ApiStateObject } from '../lib/schemas.js'

const TOOL_NAME = 'onsong_state_get'
const TOOL_TITLE = 'Get OnSong State'
const TOOL_DESCRIPTION =
  'Get current performance state including current song, set, and scroll position'

const inputSchema = z.object({
  target: targetSchema.describe('Connection target'),
})

function transformSong(apiSong: ApiSongObject | undefined): Record<string, unknown> | undefined {
  if (apiSong === undefined) return undefined
  return {
    id: apiSong.ID,
    title: apiSong.title,
    artist: apiSong.artist,
    key: apiSong.key,
    transposedKey: apiSong.transposedKey,
    capo: apiSong.capo,
    tempo: apiSong.tempo,
    timeSignature: apiSong.timeSignature,
    duration: apiSong.duration,
    favorite: apiSong.favorite === 1,
  }
}

function transformSet(apiSet: ApiSetObject | undefined): Record<string, unknown> | undefined {
  if (apiSet === undefined) return undefined
  return {
    id: apiSet.ID,
    name: apiSet.name,
    songCount: apiSet.quantity,
    archived: apiSet.archived,
    createdAt: apiSet.dateCreated,
    updatedAt: apiSet.dateModified,
  }
}

function transformState(apiState: ApiStateObject): Record<string, unknown> {
  return {
    current_song: transformSong(apiState.song),
    current_set: transformSet(apiState.set),
    book: apiState.book,
    song_position: apiState.position,
    section: apiState.section,
    auto_scroll: apiState.autoScroll,
    timestamp: new Date().toISOString(),
  }
}

export function registerStateGetTool(server: McpServer): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema,
      outputSchema: stateGetOutputSchema,
    },
    async (args) => {
      try {
        const client = await createAuthenticatedClient(args.target)
        const apiState = await client.getState()
        const result = transformState(apiState)

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
