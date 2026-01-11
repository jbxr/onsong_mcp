export const ErrorCodes = {
  DISCOVERY_TIMEOUT: 'DISCOVERY_TIMEOUT',
  DISCOVERY_FAILED: 'DISCOVERY_FAILED',

  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  HOST_NOT_ALLOWED: 'HOST_NOT_ALLOWED',

  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_NOT_REGISTERED: 'AUTH_NOT_REGISTERED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_NOT_ACCEPTING: 'AUTH_NOT_ACCEPTING',

  API_ERROR: 'API_ERROR',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_INVALID_RESPONSE: 'API_INVALID_RESPONSE',

  IMPORT_DISABLED: 'IMPORT_DISABLED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  EXPORT_TIMEOUT: 'EXPORT_TIMEOUT',
  EXPORT_FAILED: 'EXPORT_FAILED',

  URL_SCHEME_FAILED: 'URL_SCHEME_FAILED',
  URL_SCHEME_UNSUPPORTED: 'URL_SCHEME_UNSUPPORTED',

  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_TARGET: 'INVALID_TARGET',
  INVALID_CONFIG: 'INVALID_CONFIG',

  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',

  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.DISCOVERY_TIMEOUT]: 'Device discovery timed out',
  [ErrorCodes.DISCOVERY_FAILED]: 'Device discovery failed',

  [ErrorCodes.CONNECTION_REFUSED]: 'Connection refused by host',
  [ErrorCodes.CONNECTION_TIMEOUT]: 'Connection timed out',
  [ErrorCodes.HOST_NOT_ALLOWED]: 'Host is not in the allowlist',

  [ErrorCodes.AUTH_FAILED]: 'Authentication failed',
  [ErrorCodes.AUTH_NOT_REGISTERED]: 'Token is not registered with OnSong',
  [ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid token format or length',
  [ErrorCodes.AUTH_NOT_ACCEPTING]: 'OnSong is not accepting new connections',

  [ErrorCodes.API_ERROR]: 'OnSong API returned an error',
  [ErrorCodes.API_NOT_FOUND]: 'Requested resource not found',
  [ErrorCodes.API_INVALID_RESPONSE]: 'Invalid response from OnSong API',

  [ErrorCodes.IMPORT_DISABLED]: 'Import operations are disabled in configuration',
  [ErrorCodes.IMPORT_FAILED]: 'Failed to import chart into OnSong',
  [ErrorCodes.EXPORT_TIMEOUT]: 'Export callback timed out',
  [ErrorCodes.EXPORT_FAILED]: 'Failed to export from OnSong',

  [ErrorCodes.URL_SCHEME_FAILED]: 'Failed to invoke OnSong URL scheme',
  [ErrorCodes.URL_SCHEME_UNSUPPORTED]: 'URL scheme not supported on this platform',

  [ErrorCodes.INVALID_INPUT]: 'Invalid input parameters',
  [ErrorCodes.INVALID_TARGET]: 'Invalid connection target',
  [ErrorCodes.INVALID_CONFIG]: 'Invalid configuration',

  [ErrorCodes.FILE_NOT_FOUND]: 'File not found',
  [ErrorCodes.FILE_READ_ERROR]: 'Failed to read file',
  [ErrorCodes.FILE_WRITE_ERROR]: 'Failed to write file',

  [ErrorCodes.UNKNOWN_ERROR]: 'An unknown error occurred',
}

export class OnSongError extends Error {
  readonly code: ErrorCode
  readonly details: Record<string, unknown> | undefined

  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(ErrorMessages[code])
    this.name = 'OnSongError'
    this.code = code
    this.details = details
  }

  toJSON(): { code: ErrorCode; message: string; details?: Record<string, unknown> | undefined } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    }
  }
}

export function formatError(error: unknown): string {
  if (error instanceof OnSongError) {
    return JSON.stringify(error.toJSON())
  }
  if (error instanceof Error) {
    return JSON.stringify({
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
    })
  }
  return JSON.stringify({
    code: ErrorCodes.UNKNOWN_ERROR,
    message: String(error),
  })
}

export function mcpError(error: unknown): {
  content: [{ type: 'text'; text: string }]
  isError: true
} {
  return {
    content: [{ type: 'text', text: formatError(error) }],
    isError: true,
  }
}
