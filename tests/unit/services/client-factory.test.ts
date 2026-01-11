import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAuthenticatedClient, type Target } from '../../../src/services/client-factory.js'
import { ConnectClient } from '../../../src/services/connect-client.js'
import * as tokenCache from '../../../src/services/token-cache.js'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('../../../src/services/token-cache.js', () => ({
  getOrCreateToken: vi.fn(),
  setToken: vi.fn(),
}))

describe('createAuthenticatedClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('with explicit token', () => {
    it('uses provided token without calling token cache', async () => {
      const target: Target = {
        host: '10.0.0.1',
        port: 5076,
        token: 'a'.repeat(32),
      }

      const client = await createAuthenticatedClient(target)

      expect(client.getToken()).toBe(target.token)
      expect(tokenCache.getOrCreateToken).not.toHaveBeenCalled()
    })

    it('does not call authenticate when token is provided', async () => {
      const target: Target = {
        host: '10.0.0.1',
        port: 5076,
        token: 'a'.repeat(32),
      }

      const authenticateSpy = vi.spyOn(ConnectClient.prototype, 'authenticate')

      await createAuthenticatedClient(target)

      expect(authenticateSpy).not.toHaveBeenCalled()
    })

    it('creates client with correct host and port', async () => {
      const target: Target = {
        host: '192.168.1.50',
        port: 8080,
        token: 'b'.repeat(32),
      }

      const client = await createAuthenticatedClient(target)

      expect(client.getHost()).toBe('192.168.1.50')
      expect(client.getPort()).toBe(8080)
    })
  })

  describe('without explicit token', () => {
    it('retrieves token from cache via getOrCreateToken', async () => {
      const cachedToken = 'c'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.2',
        port: 5076,
      }

      const client = await createAuthenticatedClient(target)

      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.2', 5076)
      expect(client.getToken()).toBe(cachedToken)
    })

    it('calls authenticate when no token is provided', async () => {
      const cachedToken = 'd'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.3',
        port: 5076,
      }

      const authenticateSpy = vi.spyOn(ConnectClient.prototype, 'authenticate')

      await createAuthenticatedClient(target, 'test-device')

      expect(authenticateSpy).toHaveBeenCalledWith('test-device')
      expect(authenticateSpy).toHaveBeenCalledTimes(1)
    })

    it('uses default device name when not provided', async () => {
      const cachedToken = 'e'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.4',
        port: 5076,
      }

      const authenticateSpy = vi.spyOn(ConnectClient.prototype, 'authenticate')

      await createAuthenticatedClient(target)

      expect(authenticateSpy).toHaveBeenCalledWith('onsong-mcp')
    })

    it('passes custom device name to authenticate', async () => {
      const cachedToken = 'f'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.5',
        port: 5076,
      }

      const authenticateSpy = vi.spyOn(ConnectClient.prototype, 'authenticate')

      await createAuthenticatedClient(target, 'my-custom-device')

      expect(authenticateSpy).toHaveBeenCalledWith('my-custom-device')
    })
  })

  describe('token cache integration', () => {
    it('reuses cached token for same host:port', async () => {
      const cachedToken = 'g'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.6',
        port: 5076,
      }

      const client1 = await createAuthenticatedClient(target)
      const client2 = await createAuthenticatedClient(target)

      expect(client1.getToken()).toBe(cachedToken)
      expect(client2.getToken()).toBe(cachedToken)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledTimes(2)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.6', 5076)
    })

    it('generates different tokens for different hosts', async () => {
      const token1 = 'h'.repeat(32)
      const token2 = 'i'.repeat(32)

      vi.mocked(tokenCache.getOrCreateToken).mockReturnValueOnce(token1).mockReturnValueOnce(token2)

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target1: Target = { host: '10.0.0.7', port: 5076 }
      const target2: Target = { host: '10.0.0.8', port: 5076 }

      const client1 = await createAuthenticatedClient(target1)
      const client2 = await createAuthenticatedClient(target2)

      expect(client1.getToken()).toBe(token1)
      expect(client2.getToken()).toBe(token2)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.7', 5076)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.8', 5076)
    })

    it('generates different tokens for different ports', async () => {
      const token1 = 'j'.repeat(32)
      const token2 = 'k'.repeat(32)

      vi.mocked(tokenCache.getOrCreateToken).mockReturnValueOnce(token1).mockReturnValueOnce(token2)

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target1: Target = { host: '10.0.0.9', port: 5076 }
      const target2: Target = { host: '10.0.0.9', port: 8080 }

      const client1 = await createAuthenticatedClient(target1)
      const client2 = await createAuthenticatedClient(target2)

      expect(client1.getToken()).toBe(token1)
      expect(client2.getToken()).toBe(token2)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.9', 5076)
      expect(tokenCache.getOrCreateToken).toHaveBeenCalledWith('10.0.0.9', 8080)
    })
  })

  describe('authentication flow', () => {
    it('authenticates successfully with cached token', async () => {
      const cachedToken = 'l'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.10',
        port: 5076,
      }

      const client = await createAuthenticatedClient(target)

      expect(client).toBeInstanceOf(ConnectClient)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('propagates authentication errors', async () => {
      const cachedToken = 'm'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Not Accepting Users' }),
      })

      const target: Target = {
        host: '10.0.0.11',
        port: 5076,
      }

      await expect(createAuthenticatedClient(target)).rejects.toThrow()
    })

    it('returns client that can make API calls', async () => {
      const cachedToken = 'n'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: 'Token Registered' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pong: 'pong' }),
        })

      const target: Target = {
        host: '10.0.0.12',
        port: 5076,
      }

      const client = await createAuthenticatedClient(target)
      const result = await client.ping()

      expect(result.pong).toBe('pong')
    })
  })

  describe('edge cases', () => {
    it('handles undefined token correctly', async () => {
      const cachedToken = 'o'.repeat(32)
      vi.mocked(tokenCache.getOrCreateToken).mockReturnValue(cachedToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const target: Target = {
        host: '10.0.0.13',
        port: 5076,
        token: undefined,
      }

      const authenticateSpy = vi.spyOn(ConnectClient.prototype, 'authenticate')

      await createAuthenticatedClient(target)

      expect(tokenCache.getOrCreateToken).toHaveBeenCalled()
      expect(authenticateSpy).toHaveBeenCalled()
    })

    it('handles empty string as valid token', async () => {
      const target: Target = {
        host: '10.0.0.14',
        port: 5076,
        token: '',
      }

      const client = await createAuthenticatedClient(target)

      expect(client.getToken()).toBe('')
      expect(tokenCache.getOrCreateToken).not.toHaveBeenCalled()
    })

    it('creates client with IPv6 address', async () => {
      const target: Target = {
        host: 'fe80::1',
        port: 5076,
        token: 'p'.repeat(32),
      }

      const client = await createAuthenticatedClient(target)

      expect(client.getHost()).toBe('fe80::1')
    })

    it('handles non-standard port numbers', async () => {
      const target: Target = {
        host: '10.0.0.15',
        port: 12345,
        token: 'q'.repeat(32),
      }

      const client = await createAuthenticatedClient(target)

      expect(client.getPort()).toBe(12345)
    })
  })
})
