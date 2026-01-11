import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateToken,
  setToken,
  getToken,
  clearToken,
  clearAllTokens,
  getCacheSize,
} from '../../../src/services/token-cache.js'

describe('TokenCache', () => {
  beforeEach(() => {
    clearAllTokens()
  })

  describe('getOrCreateToken', () => {
    it('generates a 32-character hex token for new host:port', () => {
      const token = getOrCreateToken('10.0.0.1', 80)

      expect(token).toHaveLength(32)
      expect(token).toMatch(/^[0-9a-f]+$/)
    })

    it('returns same token for same host:port on subsequent calls', () => {
      const token1 = getOrCreateToken('10.0.0.1', 80)
      const token2 = getOrCreateToken('10.0.0.1', 80)

      expect(token1).toBe(token2)
    })

    it('generates different tokens for different hosts', () => {
      const token1 = getOrCreateToken('10.0.0.1', 80)
      const token2 = getOrCreateToken('10.0.0.2', 80)

      expect(token1).not.toBe(token2)
    })

    it('generates different tokens for different ports', () => {
      const token1 = getOrCreateToken('10.0.0.1', 80)
      const token2 = getOrCreateToken('10.0.0.1', 5076)

      expect(token1).not.toBe(token2)
    })
  })

  describe('setToken', () => {
    it('stores token for host:port', () => {
      const customToken = 'a'.repeat(32)
      setToken('10.0.0.1', 80, customToken)

      expect(getToken('10.0.0.1', 80)).toBe(customToken)
    })

    it('overwrites existing token', () => {
      const token1 = 'a'.repeat(32)
      const token2 = 'b'.repeat(32)

      setToken('10.0.0.1', 80, token1)
      setToken('10.0.0.1', 80, token2)

      expect(getToken('10.0.0.1', 80)).toBe(token2)
    })
  })

  describe('getToken', () => {
    it('returns undefined for unknown host:port', () => {
      expect(getToken('unknown', 80)).toBeUndefined()
    })

    it('returns stored token', () => {
      const token = getOrCreateToken('10.0.0.1', 80)
      expect(getToken('10.0.0.1', 80)).toBe(token)
    })
  })

  describe('clearToken', () => {
    it('removes token for specific host:port', () => {
      getOrCreateToken('10.0.0.1', 80)
      getOrCreateToken('10.0.0.2', 80)

      clearToken('10.0.0.1', 80)

      expect(getToken('10.0.0.1', 80)).toBeUndefined()
      expect(getToken('10.0.0.2', 80)).toBeDefined()
    })

    it('does not throw for unknown host:port', () => {
      expect(() => clearToken('unknown', 80)).not.toThrow()
    })
  })

  describe('clearAllTokens', () => {
    it('removes all cached tokens', () => {
      getOrCreateToken('10.0.0.1', 80)
      getOrCreateToken('10.0.0.2', 80)
      getOrCreateToken('10.0.0.3', 5076)

      clearAllTokens()

      expect(getCacheSize()).toBe(0)
    })
  })

  describe('getCacheSize', () => {
    it('returns 0 for empty cache', () => {
      expect(getCacheSize()).toBe(0)
    })

    it('returns correct count after adding tokens', () => {
      getOrCreateToken('10.0.0.1', 80)
      getOrCreateToken('10.0.0.2', 80)

      expect(getCacheSize()).toBe(2)
    })
  })
})
