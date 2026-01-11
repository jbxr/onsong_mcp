export interface DeviceMetadata {
  model?: string
  deviceId?: string
  version?: string
  role?: 'client' | 'server'
}

export interface OnSongDevice {
  name: string
  host: string
  port: number
  addresses: string[]
  metadata?: DeviceMetadata
}

export interface Target {
  host: string
  port: number
  token?: string
}

export interface Song {
  id?: string
  title: string
  artist?: string
  key?: string
  transposedKey?: string
  capo?: number
  tempo?: number
  timeSignature?: string
  duration?: number
  favorite?: boolean
  keywords?: string[]
  content?: string
  usefile?: boolean
  path?: string
}

export interface SongSearchResult {
  id?: string
  title: string
  artist?: string
  key?: string
  favorite?: boolean
  matchFields?: string[]
}

export interface Set {
  id?: string
  name: string
  songs?: Song[]
  songCount?: number
  archived?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Book {
  name: string
  songCount?: number
}

export interface PerformanceState {
  currentSong?: Song
  currentSet?: Set
  book?: string
  position?: number
  section?: number
  autoScroll?: boolean
  timestamp: string
}

export interface Capabilities {
  connectState: boolean
  connectSearch: boolean
  connectSets: boolean
  urlImport: boolean
  urlExport: boolean
  urlActions: boolean
  urlOpen: boolean
}

export interface DiscoverInput {
  timeoutMs?: number
}

export interface DiscoverOutput {
  devices: OnSongDevice[]
}

export interface ConnectTestInput {
  host: string
  port: number
}

export interface ConnectTestOutput {
  ok: boolean
  version?: string
  capabilities?: Capabilities
}

export interface StateGetInput {
  target: Target
}

export interface StateGetOutput {
  currentSong?: Song
  currentSet?: Set
  position?: number
  section?: number
  mode?: string
  timestamp: string
}

export interface SearchInput {
  target: Target
  query: string
  limit?: number
}

export interface SearchOutput {
  songs: SongSearchResult[]
  totalCount?: number
}

export interface ImportInput {
  filePath?: string
  contentBase64?: string
  filename?: string
  destination?: string
  openAfterImport?: boolean
}

export interface ImportOutput {
  ok: boolean
  onsongResult?: string
  warnings?: string[]
}

export interface ExportInput {
  target: Target
  scope: 'song' | 'set' | 'library'
  identifier: string
  format: 'onsong' | 'chordpro' | 'txt' | 'pdf'
  outputDir: string
}

export interface ExportOutput {
  exportedFiles: string[]
  warnings?: string[]
}

export interface ActionInput {
  actionName: string
  args?: Record<string, unknown>
}

export interface ActionOutput {
  ok: boolean
  performedVia?: 'connect' | 'url_scheme'
  warnings?: string[]
}

export interface OpenInput {
  type: 'song' | 'set'
  identifier: string
}

export interface OpenOutput {
  ok: boolean
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

export interface Config {
  defaultTarget?: Target
  targets?: Record<string, Target>
  enableImport?: boolean
  logLevel?: LogLevel
  allowedHosts?: string[]
  callbackPort?: number
  dryRun?: boolean
}

export interface ApiAuthResponse {
  success?: 'Token Registered' | 'Token Accepted'
  error?: 'Not Registered' | 'Invalid Token Length' | 'Not Accepting Users'
}

export interface ApiPingResponse {
  pong: string
}

export interface ApiSongObject {
  ID?: string
  title: string
  artist?: string
  key?: string
  transposedKey?: string
  capo?: number
  tempo?: number
  timeSignature?: string
  duration?: number
  favorite?: 0 | 1
  usefile?: boolean
  content?: string
  keywords?: string
  copyright?: string
  ccli?: string
}

export interface ApiSetObject {
  ID?: string
  name: string
  archived?: boolean
  dateCreated?: string
  dateModified?: string
  quantity?: number
}

export interface ApiStateObject {
  song?: ApiSongObject
  set?: ApiSetObject
  book?: string
  position?: number
  section?: number
  autoScroll?: boolean
}

export interface ApiSongsSearchResponse {
  count: number
  results: ApiSongObject[]
  attributes?: Record<string, unknown>
}

export interface ApiSetsListResponse {
  count: number
  results: ApiSetObject[]
}

export interface ApiErrorResponse {
  error: string
}

export interface ApiSuccessResponse {
  success: string | boolean | object
}

export interface McpToolResponse {
  content: { type: 'text'; text: string }[]
  isError?: boolean
}
