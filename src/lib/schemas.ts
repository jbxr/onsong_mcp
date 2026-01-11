import { z } from 'zod'

export const deviceMetadataSchema = z.object({
  model: z.string().optional(),
  deviceId: z.string().optional(),
  version: z.string().optional(),
  role: z.enum(['client', 'server']).optional(),
})

export const onSongDeviceSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  addresses: z.array(z.string()),
  metadata: deviceMetadataSchema.optional(),
})

export const targetSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  token: z.string().min(32).optional(),
})

export const songSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  artist: z.string().optional(),
  key: z.string().optional(),
  transposedKey: z.string().optional(),
  capo: z.number().int().min(0).max(12).optional(),
  tempo: z.number().int().min(1).optional(),
  timeSignature: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  favorite: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  content: z.string().optional(),
  usefile: z.boolean().optional(),
  path: z.string().optional(),
})

export const songSearchResultSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  artist: z.string().optional(),
  key: z.string().optional(),
  favorite: z.boolean().optional(),
  matchFields: z.array(z.string()).optional(),
})

export const setSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  songs: z.array(songSchema).optional(),
  songCount: z.number().int().min(0).optional(),
  archived: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const capabilitiesSchema = z.object({
  connectState: z.boolean(),
  connectSearch: z.boolean(),
  connectSets: z.boolean(),
  urlImport: z.boolean(),
  urlExport: z.boolean(),
  urlActions: z.boolean(),
  urlOpen: z.boolean(),
})

export const discoverInputSchema = z.object({
  timeout_ms: z
    .number()
    .int()
    .min(500)
    .max(30000)
    .default(2000)
    .describe('Discovery timeout in milliseconds'),
})

export const connectTestInputSchema = z.object({
  host: z.string().min(1).describe('Target host IP or hostname'),
  port: z.number().int().min(1).max(65535).describe('Target port number'),
})

export const stateGetInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
})

export const searchInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  query: z.string().min(1).describe('Search query (matches title, artist, keywords, lyrics)'),
  limit: z.number().int().min(1).max(100).default(25).describe('Maximum results to return'),
})

export const importInputSchema = z
  .object({
    file_path: z.string().optional().describe('Path to chart file to import'),
    content_base64: z.string().optional().describe('Base64-encoded chart content'),
    filename: z.string().optional().describe('Filename for base64 content'),
    destination: z.string().optional().describe('Target set or collection name'),
    open_after_import: z.boolean().default(false).describe('Open the song after importing'),
  })
  .refine((data) => (data.file_path !== undefined) !== (data.content_base64 !== undefined), {
    message: 'Either file_path or content_base64 must be provided, but not both',
  })
  .refine(
    (data) => {
      if (data.content_base64 !== undefined) {
        return data.filename !== undefined
      }
      return true
    },
    {
      message: 'filename is required when content_base64 is provided',
    }
  )

export const exportInputSchema = z.object({
  target: targetSchema.describe('Connection target'),
  scope: z.enum(['song', 'set', 'library']).describe('Export scope'),
  identifier: z.string().min(1).describe('Song ID/name or set name to export'),
  format: z.enum(['onsong', 'chordpro', 'txt', 'pdf']).describe('Output format'),
  output_dir: z.string().min(1).describe('Directory path for exported files'),
})

export const actionInputSchema = z.object({
  action_name: z
    .string()
    .min(1)
    .describe('Action identifier (e.g., ForwardPedalWasPressed, BackwardPedalWasPressed)'),
  args: z
    .record(z.unknown())
    .optional()
    .describe('Action parameters (e.g., amount for scroll position)'),
})

export const openInputSchema = z.object({
  type: z.enum(['song', 'set']).describe('What to open'),
  identifier: z.string().min(1).describe('Song or set name/ID'),
})

export const discoverOutputSchema = z.object({
  devices: z.array(onSongDeviceSchema),
})

export const connectTestOutputSchema = z.object({
  ok: z.boolean(),
  version: z.string().optional(),
  capabilities: capabilitiesSchema.optional(),
})

export const stateGetOutputSchema = z.object({
  current_song: songSchema.optional(),
  current_set: setSchema.optional(),
  song_position: z.number().min(0).max(100).optional(),
  mode: z.string().optional(),
  timestamp: z.string(),
})

export const searchOutputSchema = z.object({
  songs: z.array(songSearchResultSchema),
  total_count: z.number().int().optional(),
})

export const importOutputSchema = z.object({
  ok: z.boolean(),
  onsong_result: z.string().optional(),
  warnings: z.array(z.string()).optional(),
})

export const exportOutputSchema = z.object({
  exported_files: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
})

export const actionOutputSchema = z.object({
  ok: z.boolean(),
  performed_via: z.enum(['connect', 'url_scheme']).optional(),
  warnings: z.array(z.string()).optional(),
})

export const openOutputSchema = z.object({
  ok: z.boolean(),
})

export const setsListOutputSchema = z.object({
  sets: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      song_count: z.number().int().min(0),
      archived: z.boolean(),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
    })
  ),
  total_count: z.number().int().min(0),
})

export const setsGetOutputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  archived: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  songs: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      artist: z.string().optional(),
      key: z.string().optional(),
      favorite: z.boolean().optional(),
    })
  ),
})

export const setsCreateOutputSchema = z.object({
  ok: z.boolean(),
  set: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

export const setsAddSongOutputSchema = z.object({
  ok: z.boolean(),
  set_id: z.string(),
  song_id: z.string(),
})

export const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug', 'trace'])

export const configSchema = z.object({
  defaultTarget: targetSchema.optional(),
  targets: z.record(targetSchema).optional(),
  enableImport: z.boolean().default(false),
  logLevel: logLevelSchema.default('info'),
  allowedHosts: z.array(z.string()).default([]),
  callbackPort: z.number().int().min(1024).max(65535).default(9876),
  dryRun: z.boolean().default(false),
})

export const apiAuthResponseSchema = z.object({
  success: z.enum(['Token Registered', 'Token Accepted']).optional(),
  error: z.enum(['Not Registered', 'Invalid Token Length', 'Not Accepting Users']).optional(),
})

export const apiPingResponseSchema = z.object({
  pong: z.string(),
})

export const apiSongObjectSchema = z.object({
  ID: z.string().optional(),
  title: z.string(),
  artist: z.string().optional(),
  key: z.string().optional(),
  transposedKey: z.string().optional(),
  capo: z.number().optional(),
  tempo: z.number().optional(),
  timeSignature: z.string().optional(),
  duration: z.number().optional(),
  favorite: z.union([z.literal(0), z.literal(1)]).optional(),
  usefile: z.boolean().optional(),
  content: z.string().optional(),
  keywords: z.string().optional(),
  copyright: z.string().optional(),
  ccli: z.string().optional(),
})

export const apiSetObjectSchema = z.object({
  ID: z.string().optional(),
  name: z.string(),
  archived: z.boolean().optional(),
  dateCreated: z.string().optional(),
  dateModified: z.string().optional(),
  quantity: z.number().optional(),
})

export const apiStateObjectSchema = z.object({
  song: apiSongObjectSchema.optional(),
  set: apiSetObjectSchema.optional(),
  book: z.string().optional(),
  position: z.number().optional(),
  section: z.number().optional(),
  autoScroll: z.boolean().optional(),
})

export const apiSongsSearchResponseSchema = z.object({
  count: z.number(),
  results: z.array(apiSongObjectSchema),
  attributes: z.record(z.unknown()).optional(),
})

export const apiSetsListResponseSchema = z.object({
  count: z.number(),
  results: z.array(apiSetObjectSchema),
})

export const apiCreateSongResponseSchema = z.object({
  success: z
    .object({
      ID: z.string(),
      title: z.string(),
      artist: z.string().optional(),
      key: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
})

export const apiUpdateContentResponseSchema = z.object({
  success: z
    .object({
      ID: z.string(),
      title: z.string(),
    })
    .optional(),
  error: z.string().optional(),
})

export const apiCreateSetResponseSchema = z.object({
  success: z
    .object({
      ID: z.string(),
      name: z.string(),
    })
    .optional(),
  error: z.string().optional(),
})

export const apiSetDetailResponseSchema = z.object({
  ID: z.string().optional(),
  name: z.string(),
  archived: z.boolean().optional(),
  dateCreated: z.string().optional(),
  dateModified: z.string().optional(),
  songs: z.array(apiSongObjectSchema).optional(),
})

export const apiAddSongToSetResponseSchema = z.object({
  success: z.string().optional(),
  error: z.string().optional(),
})

export type DeviceMetadata = z.infer<typeof deviceMetadataSchema>
export type OnSongDevice = z.infer<typeof onSongDeviceSchema>
export type Target = z.infer<typeof targetSchema>
export type Song = z.infer<typeof songSchema>
export type SongSearchResult = z.infer<typeof songSearchResultSchema>
export type Set = z.infer<typeof setSchema>
export type Capabilities = z.infer<typeof capabilitiesSchema>
export type Config = z.infer<typeof configSchema>
export type LogLevel = z.infer<typeof logLevelSchema>

export type DiscoverInput = z.infer<typeof discoverInputSchema>
export type ConnectTestInput = z.infer<typeof connectTestInputSchema>
export type StateGetInput = z.infer<typeof stateGetInputSchema>
export type SearchInput = z.infer<typeof searchInputSchema>
export type ImportInput = z.infer<typeof importInputSchema>
export type ExportInput = z.infer<typeof exportInputSchema>
export type ActionInput = z.infer<typeof actionInputSchema>
export type OpenInput = z.infer<typeof openInputSchema>

export type DiscoverOutput = z.infer<typeof discoverOutputSchema>
export type ConnectTestOutput = z.infer<typeof connectTestOutputSchema>
export type StateGetOutput = z.infer<typeof stateGetOutputSchema>
export type SearchOutput = z.infer<typeof searchOutputSchema>
export type ImportOutput = z.infer<typeof importOutputSchema>
export type ExportOutput = z.infer<typeof exportOutputSchema>
export type ActionOutput = z.infer<typeof actionOutputSchema>
export type OpenOutput = z.infer<typeof openOutputSchema>
export type SetsListOutput = z.infer<typeof setsListOutputSchema>
export type SetsGetOutput = z.infer<typeof setsGetOutputSchema>
export type SetsCreateOutput = z.infer<typeof setsCreateOutputSchema>
export type SetsAddSongOutput = z.infer<typeof setsAddSongOutputSchema>

export type ApiAuthResponse = z.infer<typeof apiAuthResponseSchema>
export type ApiPingResponse = z.infer<typeof apiPingResponseSchema>
export type ApiSongObject = z.infer<typeof apiSongObjectSchema>
export type ApiSetObject = z.infer<typeof apiSetObjectSchema>
export type ApiStateObject = z.infer<typeof apiStateObjectSchema>
export type ApiSongsSearchResponse = z.infer<typeof apiSongsSearchResponseSchema>
export type ApiSetsListResponse = z.infer<typeof apiSetsListResponseSchema>
export type ApiCreateSongResponse = z.infer<typeof apiCreateSongResponseSchema>
export type ApiUpdateContentResponse = z.infer<typeof apiUpdateContentResponseSchema>
export type ApiCreateSetResponse = z.infer<typeof apiCreateSetResponseSchema>
export type ApiSetDetailResponse = z.infer<typeof apiSetDetailResponseSchema>
export type ApiAddSongToSetResponse = z.infer<typeof apiAddSongToSetResponseSchema>
