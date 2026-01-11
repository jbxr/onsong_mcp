import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createAuthenticatedClient } from '../services/client-factory.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import {
  targetSchema,
  setsListOutputSchema,
  setsGetOutputSchema,
  setsCreateOutputSchema,
  setsAddSongOutputSchema,
} from '../lib/schemas.js'
import type { ApiSetObject, ApiSongObject } from '../lib/schemas.js'

const LIST_TOOL_NAME = 'onsong_sets_list'
const LIST_TOOL_TITLE = 'List OnSong Sets'
const LIST_TOOL_DESCRIPTION = 'List all sets in the OnSong library'

const CREATE_TOOL_NAME = 'onsong_sets_create'
const CREATE_TOOL_TITLE = 'Create OnSong Set'
const CREATE_TOOL_DESCRIPTION = 'Create a new set in OnSong'

const GET_TOOL_NAME = 'onsong_sets_get'
const GET_TOOL_TITLE = 'Get OnSong Set'
const GET_TOOL_DESCRIPTION = 'Get set details including songs'

const ADD_SONG_TOOL_NAME = 'onsong_sets_add_song'
const ADD_SONG_TOOL_TITLE = 'Add Song to Set'
const ADD_SONG_TOOL_DESCRIPTION = 'Add a song to a set'

const listInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
})

const createInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  name: z.string().min(1).describe('Name for the new set'),
})

const getInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  set_id: z.string().min(1).describe('Set ID to retrieve'),
})

const addSongInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  set_id: z.string().min(1).describe('Set ID to add song to'),
  song_id: z.string().min(1).describe('Song ID to add'),
})

function transformSet(apiSet: ApiSetObject): Record<string, unknown> {
  return {
    id: apiSet.ID,
    name: apiSet.name,
    song_count: apiSet.quantity ?? 0,
    archived: apiSet.archived ?? false,
    created_at: apiSet.dateCreated,
    updated_at: apiSet.dateModified,
  }
}

function transformSong(apiSong: ApiSongObject): Record<string, unknown> {
  return {
    id: apiSong.ID,
    title: apiSong.title,
    artist: apiSong.artist,
    key: apiSong.key,
    favorite: apiSong.favorite === 1,
  }
}

export function registerSetsTools(server: McpServer): void {
  server.registerTool(
    LIST_TOOL_NAME,
    {
      title: LIST_TOOL_TITLE,
      description: LIST_TOOL_DESCRIPTION,
      inputSchema: listInputSchema,
      outputSchema: setsListOutputSchema,
    },
    async (args) => {
      try {
        const client = await createAuthenticatedClient(args.target)
        const setsResult = await client.listSets()

        const result = {
          sets: setsResult.results.map(transformSet),
          total_count: setsResult.count,
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

  server.registerTool(
    CREATE_TOOL_NAME,
    {
      title: CREATE_TOOL_TITLE,
      description: CREATE_TOOL_DESCRIPTION,
      inputSchema: createInputSchema,
      outputSchema: setsCreateOutputSchema,
    },
    async (args) => {
      try {
        const client = await createAuthenticatedClient(args.target)
        const createResult = await client.createSet(args.name)

        if (createResult.success === undefined) {
          throw new OnSongError(ErrorCodes.API_ERROR, { message: 'No set ID returned from create' })
        }

        const result = {
          ok: true,
          set: {
            id: createResult.success.ID,
            name: createResult.success.name,
          },
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

  server.registerTool(
    GET_TOOL_NAME,
    {
      title: GET_TOOL_TITLE,
      description: GET_TOOL_DESCRIPTION,
      inputSchema: getInputSchema,
      outputSchema: setsGetOutputSchema,
    },
    async (args) => {
      try {
        const client = await createAuthenticatedClient(args.target)
        const setDetail = await client.getSet(args.set_id)

        const result = {
          id: setDetail.ID,
          name: setDetail.name,
          archived: setDetail.archived ?? false,
          created_at: setDetail.dateCreated,
          updated_at: setDetail.dateModified,
          songs: (setDetail.songs ?? []).map(transformSong),
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

  server.registerTool(
    ADD_SONG_TOOL_NAME,
    {
      title: ADD_SONG_TOOL_TITLE,
      description: ADD_SONG_TOOL_DESCRIPTION,
      inputSchema: addSongInputSchema,
      outputSchema: setsAddSongOutputSchema,
    },
    async (args) => {
      try {
        const client = await createAuthenticatedClient(args.target)
        await client.addSongToSet(args.set_id, args.song_id)

        const result = {
          ok: true,
          set_id: args.set_id,
          song_id: args.song_id,
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
