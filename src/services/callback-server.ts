import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { createChildLogger } from '../lib/logger.js'
import { OnSongError, ErrorCodes } from '../lib/errors.js'

export interface ExportCallbackData {
  files: Array<{
    name: string
    content: string
    contentType: string
  }>
  metadata?: Record<string, unknown>
}

interface PendingRequest {
  resolve: (data: ExportCallbackData) => void
  reject: (error: Error) => void
  timeoutId: NodeJS.Timeout
}

export class CallbackServer {
  private readonly logger = createChildLogger({ service: 'callback-server' })
  private server: Server | undefined
  private port: number
  private pendingRequests = new Map<string, PendingRequest>()
  private isStarted = false

  constructor(port: number = 9876) {
    this.port = port
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      return
    }

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res))

      this.server.on('error', (error) => {
        this.logger.error({ err: error }, 'Callback server error')
        reject(error)
      })

      this.server.listen(this.port, '127.0.0.1', () => {
        this.isStarted = true
        this.logger.info({ port: this.port }, 'Callback server started')
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.isStarted || this.server === undefined) {
      return
    }

    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId)
      pending.reject(new OnSongError(ErrorCodes.EXPORT_FAILED, { message: 'Server shutting down' }))
      this.pendingRequests.delete(requestId)
    }

    return new Promise((resolve) => {
      this.server?.close(() => {
        this.isStarted = false
        this.server = undefined
        this.logger.info('Callback server stopped')
        resolve()
      })
    })
  }

  getCallbackUrl(requestId: string): string {
    return `http://127.0.0.1:${this.port}/callback/${encodeURIComponent(requestId)}`
  }

  async waitForCallback(requestId: string, timeoutMs: number = 30000): Promise<ExportCallbackData> {
    if (!this.isStarted) {
      await this.start()
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new OnSongError(ErrorCodes.EXPORT_TIMEOUT, { requestId, timeoutMs }))
      }, timeoutMs)

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId })
      this.logger.debug({ requestId, timeoutMs }, 'Waiting for callback')
    })
  }

  cancelWait(requestId: string): void {
    const pending = this.pendingRequests.get(requestId)
    if (pending !== undefined) {
      clearTimeout(pending.timeoutId)
      pending.reject(new OnSongError(ErrorCodes.EXPORT_FAILED, { message: 'Request cancelled' }))
      this.pendingRequests.delete(requestId)
    }
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${this.port}`)
    const pathParts = url.pathname.split('/').filter(Boolean)

    this.logger.debug({ method: req.method, path: url.pathname }, 'Received callback request')

    if (pathParts[0] !== 'callback' || pathParts[1] === undefined) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
      return
    }

    const requestId = decodeURIComponent(pathParts[1])
    const pending = this.pendingRequests.get(requestId)

    if (pending === undefined) {
      this.logger.warn({ requestId }, 'Callback for unknown request')
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Request not found or expired' }))
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    const chunks: Buffer[] = []

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8')
        const data = this.parseCallbackData(body, req.headers['content-type'])

        clearTimeout(pending.timeoutId)
        this.pendingRequests.delete(requestId)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))

        this.logger.info(
          { requestId, fileCount: data.files.length },
          'Callback received successfully'
        )
        pending.resolve(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error({ err: error, requestId }, 'Failed to parse callback data')

        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: message }))

        clearTimeout(pending.timeoutId)
        this.pendingRequests.delete(requestId)
        pending.reject(new OnSongError(ErrorCodes.EXPORT_FAILED, { message }))
      }
    })

    req.on('error', (error) => {
      this.logger.error({ err: error, requestId }, 'Request error')
      clearTimeout(pending.timeoutId)
      this.pendingRequests.delete(requestId)
      pending.reject(new OnSongError(ErrorCodes.EXPORT_FAILED, { message: error.message }))
    })
  }

  private parseCallbackData(body: string, contentType: string | undefined): ExportCallbackData {
    if (contentType !== undefined && contentType.includes('application/json')) {
      const parsed = JSON.parse(body) as unknown
      return this.normalizeJsonResponse(parsed)
    }

    if (contentType !== undefined && contentType.includes('multipart/form-data')) {
      return this.parseMultipartData(body, contentType)
    }

    return {
      files: [
        {
          name: 'export.txt',
          content: body,
          contentType: contentType ?? 'text/plain',
        },
      ],
    }
  }

  private normalizeJsonResponse(data: unknown): ExportCallbackData {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid callback data: expected object')
    }

    const obj = data as Record<string, unknown>

    if (Array.isArray(obj.files)) {
      const result: ExportCallbackData = {
        files: obj.files.map((file: unknown) => {
          if (typeof file !== 'object' || file === null) {
            throw new Error('Invalid file entry in callback data')
          }
          const f = file as Record<string, unknown>
          const name = typeof f.name === 'string' ? f.name : 'unknown'
          const content =
            typeof f.content === 'string' ? f.content : typeof f.data === 'string' ? f.data : ''
          const fileContentType =
            typeof f.contentType === 'string'
              ? f.contentType
              : typeof f.type === 'string'
                ? f.type
                : 'application/octet-stream'
          return { name, content, contentType: fileContentType }
        }),
      }
      if (obj.metadata !== undefined) {
        result.metadata = obj.metadata as Record<string, unknown>
      }
      return result
    }

    if (obj.content !== undefined || obj.data !== undefined) {
      const name =
        typeof obj.filename === 'string'
          ? obj.filename
          : typeof obj.name === 'string'
            ? obj.name
            : 'export'
      const content =
        typeof obj.content === 'string' ? obj.content : typeof obj.data === 'string' ? obj.data : ''
      const contentType =
        typeof obj.contentType === 'string'
          ? obj.contentType
          : typeof obj.type === 'string'
            ? obj.type
            : 'text/plain'
      return {
        files: [{ name, content, contentType }],
      }
    }

    throw new Error('Invalid callback data structure')
  }

  private parseMultipartData(body: string, contentType: string): ExportCallbackData {
    const boundaryMatch = contentType.match(/boundary=([^;]+)/)
    if (boundaryMatch === null) {
      throw new Error('Missing boundary in multipart data')
    }

    const boundary = boundaryMatch[1]
    const parts = body
      .split(`--${boundary}`)
      .filter((part) => part.trim() !== '' && part.trim() !== '--')

    const files: ExportCallbackData['files'] = []

    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n')
      if (headerEnd === -1) continue

      const headers = part.slice(0, headerEnd)
      const content = part.slice(headerEnd + 4).replace(/\r\n$/, '')

      const nameMatch = headers.match(/name="([^"]+)"/)
      const filenameMatch = headers.match(/filename="([^"]+)"/)
      const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)

      files.push({
        name: filenameMatch?.[1] ?? nameMatch?.[1] ?? 'unknown',
        content,
        contentType: typeMatch?.[1] ?? 'application/octet-stream',
      })
    }

    return { files }
  }
}
