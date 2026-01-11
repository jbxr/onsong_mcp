import { randomBytes } from 'node:crypto'
import { createChildLogger } from '../lib/logger.js'

const TOKEN_LENGTH = 32
const logger = createChildLogger({ service: 'token-cache' })

const tokenCache = new Map<string, string>()

function buildKey(host: string, port: number): string {
  return `${host}:${port}`
}

function generateToken(): string {
  return randomBytes(TOKEN_LENGTH / 2).toString('hex')
}

export function getOrCreateToken(host: string, port: number): string {
  const key = buildKey(host, port)

  const existingToken = tokenCache.get(key)
  if (existingToken !== undefined) {
    logger.debug({ host, port }, 'Reusing cached token')
    return existingToken
  }

  const newToken = generateToken()
  tokenCache.set(key, newToken)
  logger.info({ host, port }, 'Generated and cached new token')
  return newToken
}

export function setToken(host: string, port: number, token: string): void {
  const key = buildKey(host, port)
  tokenCache.set(key, token)
  logger.debug({ host, port }, 'Token stored in cache')
}

export function getToken(host: string, port: number): string | undefined {
  const key = buildKey(host, port)
  return tokenCache.get(key)
}

export function clearToken(host: string, port: number): void {
  const key = buildKey(host, port)
  tokenCache.delete(key)
  logger.debug({ host, port }, 'Token cleared from cache')
}

export function clearAllTokens(): void {
  tokenCache.clear()
  logger.debug('All tokens cleared from cache')
}

export function getCacheSize(): number {
  return tokenCache.size
}
