import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ConnectClient } from '../services/connect-client.js'
import { mcpError, OnSongError, ErrorCodes } from '../lib/errors.js'
import { targetSchema } from '../lib/schemas.js'
import type { ApiSetObject, ApiSongObject } from '../lib/schemas.js'

const LIST_TOOL_NAME = 'onsong_sets_list'
const LIST_TOOL_DESCRIPTION = 'List all sets in the OnSong library'

const CREATE_TOOL_NAME = 'onsong_sets_create'
const CREATE_TOOL_DESCRIPTION = 'Create a new set in OnSong'

const GET_TOOL_NAME = 'onsong_sets_get'
const GET_TOOL_DESCRIPTION = 'Get set details including songs'

const ADD_SONG_TOOL_NAME = 'onsong_sets_add_song'
const ADD_SONG_TOOL_DESCRIPTION = 'Add a song to a set'

const listInputSchema = {
  target: targetSchema.describe('Connection target'),
}

const createInputSchema = {
  target: targetSchema.describe('Connection target'),
  name: z.string().min(1).describe('Name for the new set'),
}

const getInputSchema = {
  target: targetSchema.describe('Connection target'),
  set_id: z.string().min(1).describe('Set ID to retrieve'),
}

const addSongInputSchema = {
  target: targetSchema.describe('Connection target'),
  set_id: z.string().min(1).describe('Set ID to add song to'),
  song_id: z.string().min(1).describe('Song ID to add'),
}

function transformSet(apiSet: ApiSetObject): object {
  return {
    id: apiSet.ID,
    name: apiSet.name,
    song_count: apiSet.quantity ?? 0,
    archived: apiSet.archived ?? false,
    created_at: apiSet.dateCreated,
    updated_at: apiSet.dateModified,
  }
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

async function createAuthenticatedClient(target: {
  host: string
  port: number
  token?: string | undefined
}): Promise<ConnectClient> {
  const client = new ConnectClient({
    host: target.host,
    port: target.port,
    ...(target.token !== undefined && { token: target.token }),
  })

  if (target.token === undefined) {
    await client.authenticate('onsong-mcp')
  }

  return client
}

export function registerSetsTools(server: McpServer): void {
  server.tool(LIST_TOOL_NAME, LIST_TOOL_DESCRIPTION, listInputSchema, async (args) => {
    try {
      const client = await createAuthenticatedClient(args.target)
      const setsResult = await client.listSets()

      const result = {
        sets: setsResult.results.map(transformSet),
        total_count: setsResult.count,
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    } catch (error) {
      return mcpError(error)
    }
  })

  server.tool(CREATE_TOOL_NAME, CREATE_TOOL_DESCRIPTION, createInputSchema, async (args) => {
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
      }
    } catch (error) {
      return mcpError(error)
    }
  })

  server.tool(GET_TOOL_NAME, GET_TOOL_DESCRIPTION, getInputSchema, async (args) => {
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
      }
    } catch (error) {
      return mcpError(error)
    }
  })

  server.tool(ADD_SONG_TOOL_NAME, ADD_SONG_TOOL_DESCRIPTION, addSongInputSchema, async (args) => {
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
      }
    } catch (error) {
      return mcpError(error)
    }
  })
}
