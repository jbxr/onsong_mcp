import { randomBytes } from 'node:crypto'
import type {
  ApiAuthResponse,
  ApiPingResponse,
  ApiStateObject,
  ApiSongsSearchResponse,
  ApiSetsListResponse,
  ApiCreateSongResponse,
  ApiUpdateContentResponse,
} from '../lib/schemas.js'
import {
  apiAuthResponseSchema,
  apiPingResponseSchema,
  apiStateObjectSchema,
  apiSongsSearchResponseSchema,
  apiSetsListResponseSchema,
  apiCreateSongResponseSchema,
  apiUpdateContentResponseSchema,
} from '../lib/schemas.js'
import { OnSongError, ErrorCodes } from '../lib/errors.js'
import { createChildLogger } from '../lib/logger.js'

const DEFAULT_TIMEOUT_MS = 10_000
const TOKEN_LENGTH = 32

export interface ConnectClientOptions {
  host: string
  port: number
  token?: string
  timeoutMs?: number
}

export interface SearchParams {
  q?: string
  title?: string
  artist?: string
  key?: string
  limit?: number
  start?: number
}

export interface CreateSongParams {
  title: string
  artist?: string | undefined
  key?: string | undefined
  tempo?: number | undefined
  timeSignature?: string | undefined
}

export class ConnectClient {
  private readonly logger = createChildLogger({ service: 'connect-client' })
  private readonly host: string
  private readonly port: number
  private readonly timeoutMs: number
  private token: string

  constructor(options: ConnectClientOptions) {
    this.host = options.host
    this.port = options.port
    this.token = options.token ?? this.generateToken()
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  private generateToken(): string {
    return randomBytes(TOKEN_LENGTH / 2).toString('hex')
  }

  private buildUrl(path: string): string {
    return `http://${this.host}:${this.port}/api/${this.token}${path}`
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    this.logger.debug({ method, url }, 'Making request')

    try {
      const init: RequestInit = {
        method,
        signal: controller.signal,
      }

      if (body !== undefined) {
        init.headers = { 'Content-Type': 'application/json' }
        init.body = JSON.stringify(body)
      }

      const response = await fetch(url, init)

      if (!response.ok) {
        const text = await response.text()
        this.logger.error({ status: response.status, body: text }, 'Request failed')
        throw new OnSongError(ErrorCodes.CONNECTION_REFUSED, {
          status: response.status,
          body: text,
        })
      }

      const data: unknown = await response.json()
      this.logger.debug({ response: data }, 'Response received')
      return data as T
    } catch (error) {
      if (error instanceof OnSongError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OnSongError(ErrorCodes.CONNECTION_TIMEOUT, { timeoutMs: this.timeoutMs })
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error({ err: error }, 'Connection error')
      throw new OnSongError(ErrorCodes.CONNECTION_REFUSED, { message })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async authenticate(deviceName?: string): Promise<ApiAuthResponse> {
    const body = deviceName !== undefined ? { name: deviceName } : undefined
    const response = await this.request<ApiAuthResponse>('PUT', '/auth', body)
    const parsed = apiAuthResponseSchema.safeParse(response)

    if (!parsed.success) {
      throw new OnSongError(ErrorCodes.AUTH_FAILED, { reason: 'Invalid auth response format' })
    }

    if (parsed.data.error !== undefined) {
      throw new OnSongError(ErrorCodes.AUTH_FAILED, { reason: parsed.data.error })
    }

    this.logger.info({ success: parsed.data.success }, 'Authenticated')
    return parsed.data
  }

  async checkAuth(): Promise<ApiAuthResponse> {
    const response = await this.request<ApiAuthResponse>('GET', '/auth')
    return apiAuthResponseSchema.parse(response)
  }

  async ping(): Promise<ApiPingResponse> {
    const response = await this.request<ApiPingResponse>('GET', '/ping')
    return apiPingResponseSchema.parse(response)
  }

  async getState(): Promise<ApiStateObject> {
    const response = await this.request<ApiStateObject>('GET', '/state')
    return apiStateObjectSchema.parse(response)
  }

  async searchSongs(params: SearchParams): Promise<ApiSongsSearchResponse> {
    const queryParts: string[] = []

    if (params.q !== undefined) queryParts.push(`q=${encodeURIComponent(params.q)}`)
    if (params.title !== undefined) queryParts.push(`title=${encodeURIComponent(params.title)}`)
    if (params.artist !== undefined) queryParts.push(`artist=${encodeURIComponent(params.artist)}`)
    if (params.key !== undefined) queryParts.push(`key=${encodeURIComponent(params.key)}`)
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`)
    if (params.start !== undefined) queryParts.push(`start=${params.start}`)

    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
    const response = await this.request<ApiSongsSearchResponse>('GET', `/songs${query}`)
    return apiSongsSearchResponseSchema.parse(response)
  }

  async listSets(): Promise<ApiSetsListResponse> {
    const response = await this.request<ApiSetsListResponse>('GET', '/sets')
    return apiSetsListResponseSchema.parse(response)
  }

  async createSong(params: CreateSongParams): Promise<ApiCreateSongResponse> {
    const response = await this.request<ApiCreateSongResponse>('PUT', '/songs', params)
    const parsed = apiCreateSongResponseSchema.parse(response)

    if (parsed.error !== undefined) {
      throw new OnSongError(ErrorCodes.API_ERROR, { message: parsed.error })
    }

    this.logger.info({ songId: parsed.success?.ID, title: params.title }, 'Song created')
    return parsed
  }

  async updateSongContent(songId: string, content: string): Promise<ApiUpdateContentResponse> {
    const url = this.buildUrl(`/songs/${encodeURIComponent(songId)}/content`)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    this.logger.debug({ songId, contentLength: content.length }, 'Updating song content')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        this.logger.error({ status: response.status, body: text }, 'Content update failed')
        throw new OnSongError(ErrorCodes.API_ERROR, { status: response.status, body: text })
      }

      const data: unknown = await response.json()
      const parsed = apiUpdateContentResponseSchema.parse(data)

      if (parsed.error !== undefined) {
        throw new OnSongError(ErrorCodes.API_ERROR, { message: parsed.error })
      }

      this.logger.info({ songId }, 'Song content updated')
      return parsed
    } catch (error) {
      if (error instanceof OnSongError) throw error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OnSongError(ErrorCodes.CONNECTION_TIMEOUT, { timeoutMs: this.timeoutMs })
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error({ err: error }, 'Content update error')
      throw new OnSongError(ErrorCodes.CONNECTION_REFUSED, { message })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async importSong(content: string): Promise<{ songId: string; title: string }> {
    const metadata = this.parseChartMetadata(content)

    const createResponse = await this.createSong({
      title: metadata.title,
      artist: metadata.artist,
      key: metadata.key,
      tempo: metadata.tempo,
    })

    const songId = createResponse.success?.ID
    if (songId === undefined) {
      throw new OnSongError(ErrorCodes.API_ERROR, { message: 'No song ID returned from create' })
    }

    await this.updateSongContent(songId, content)

    return { songId, title: metadata.title }
  }

  private parseChartMetadata(content: string): CreateSongParams {
    const lines = content.split('\n')
    let title = 'Untitled'
    let artist: string | undefined
    let key: string | undefined
    let tempo: number | undefined

    for (const line of lines) {
      const trimmed = line.trim()

      const titleMatch = trimmed.match(/^\{title:\s*(.+?)\}$/i)
      if (titleMatch !== null && titleMatch[1] !== undefined) {
        title = titleMatch[1]
        continue
      }

      const artistMatch = trimmed.match(/^\{artist:\s*(.+?)\}$/i)
      if (artistMatch !== null && artistMatch[1] !== undefined) {
        artist = artistMatch[1]
        continue
      }

      const keyMatch = trimmed.match(/^\{key:\s*(.+?)\}$/i)
      if (keyMatch !== null && keyMatch[1] !== undefined) {
        key = keyMatch[1]
        continue
      }

      const tempoMatch = trimmed.match(/^\{tempo:\s*(\d+)\}$/i)
      if (tempoMatch !== null && tempoMatch[1] !== undefined) {
        tempo = parseInt(tempoMatch[1], 10)
        continue
      }

      if (!trimmed.startsWith('{')) break
    }

    return { title, artist, key, tempo }
  }

  getToken(): string {
    return this.token
  }

  getHost(): string {
    return this.host
  }

  getPort(): number {
    return this.port
  }
}
