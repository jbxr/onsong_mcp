import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { platform } from 'node:os'
import { OnSongError, ErrorCodes } from '../lib/errors.js'
import { createChildLogger } from '../lib/logger.js'

const execAsync = promisify(exec)

const KNOWN_ACTIONS = [
  'ForwardPedalWasPressed',
  'BackwardPedalWasPressed',
  'LeftPedalWasPressed',
  'RightPedalWasPressed',
  'PositionWasAdjusted',
  'SongSectionWasPressed',
  'NextSongWasRequested',
  'PreviousSongWasRequested',
  'AutoScrollWasToggled',
  'MetronomeWasToggled',
] as const

export type KnownAction = (typeof KNOWN_ACTIONS)[number]

export class UrlSchemeService {
  private readonly logger = createChildLogger({ service: 'url-scheme' })

  isSupported(): boolean {
    return platform() === 'darwin'
  }

  isKnownAction(action: string): action is KnownAction {
    return (KNOWN_ACTIONS as readonly string[]).includes(action)
  }

  getKnownActions(): readonly string[] {
    return KNOWN_ACTIONS
  }

  buildActionUrl(actionName: string, args?: Record<string, unknown>): string {
    let url = `onsong://action/${encodeURIComponent(actionName)}`

    if (args !== undefined && Object.keys(args).length > 0) {
      const params = Object.entries(args)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
      url = `${url}?${params}`
    }

    return url
  }

  buildImportUrl(filename: string, base64Content: string): string {
    return `onsong://ImportData/${encodeURIComponent(filename)}?${base64Content}`
  }

  buildOpenSongUrl(songIdOrTitle: string): string {
    return `onsong://open/songs?song=${encodeURIComponent(songIdOrTitle)}`
  }

  buildOpenSetUrl(setName: string): string {
    return `onsong://open/songs?set=${encodeURIComponent(setName)}`
  }

  buildNavigateUrl(index: 'first' | 'last' | 'next' | 'previous' | number): string {
    return `onsong://open/songs?index=${encodeURIComponent(String(index))}`
  }

  async invoke(url: string): Promise<void> {
    if (!this.isSupported()) {
      throw new OnSongError(ErrorCodes.URL_SCHEME_UNSUPPORTED, {
        platform: platform(),
        message: 'URL schemes only supported on macOS',
      })
    }

    this.logger.info({ url }, 'Invoking URL scheme')

    try {
      await execAsync(`open "${url}"`)
      this.logger.debug({ url }, 'URL scheme invoked successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error({ err: error, url }, 'URL scheme invocation failed')
      throw new OnSongError(ErrorCodes.URL_SCHEME_FAILED, { url, message })
    }
  }

  async runAction(actionName: string, args?: Record<string, unknown>): Promise<void> {
    const url = this.buildActionUrl(actionName, args)
    await this.invoke(url)
  }

  async importChart(filename: string, base64Content: string): Promise<void> {
    const url = this.buildImportUrl(filename, base64Content)
    await this.invoke(url)
  }

  async openSong(songIdOrTitle: string): Promise<void> {
    const url = this.buildOpenSongUrl(songIdOrTitle)
    await this.invoke(url)
  }

  async openSet(setName: string): Promise<void> {
    const url = this.buildOpenSetUrl(setName)
    await this.invoke(url)
  }

  async navigate(index: 'first' | 'last' | 'next' | 'previous' | number): Promise<void> {
    const url = this.buildNavigateUrl(index)
    await this.invoke(url)
  }

  buildExportUrl(options: {
    collection: string
    returnUrl: string
    format?: 'onsong' | 'chordpro' | 'txt' | 'pdf'
  }): string {
    const params = new URLSearchParams()
    params.set('collection', options.collection)
    params.set('returnURL', options.returnUrl)
    if (options.format !== undefined) {
      params.set('format', options.format)
    }
    return `onsong://export/songs?${params.toString()}`
  }

  async exportSongs(options: {
    collection: string
    returnUrl: string
    format?: 'onsong' | 'chordpro' | 'txt' | 'pdf'
  }): Promise<void> {
    const url = this.buildExportUrl(options)
    await this.invoke(url)
  }
}
