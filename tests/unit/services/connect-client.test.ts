import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConnectClient, type CreateSongParams } from '../../../src/services/connect-client.js'
import { OnSongError, ErrorCodes } from '../../../src/lib/errors.js'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ConnectClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('uses provided host, port, and token', () => {
      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      expect(client.getHost()).toBe('10.0.0.1')
      expect(client.getPort()).toBe(80)
      expect(client.getToken()).toBe('a'.repeat(32))
    })

    it('generates token when not provided', () => {
      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
      })

      const token = client.getToken()
      expect(token).toHaveLength(32)
      expect(token).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('authenticate', () => {
    it('registers token successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Token Registered' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.authenticate()

      expect(result.success).toBe('Token Registered')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('throws on auth error response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Not Accepting Users' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.authenticate()).rejects.toMatchObject({
        code: ErrorCodes.AUTH_FAILED,
      })
    })
  })

  describe('createSong', () => {
    it('creates song with title only', async () => {
      const songResponse = {
        success: {
          ID: 'song-123',
          title: 'Amazing Grace',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => songResponse,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.createSong({ title: 'Amazing Grace' })

      expect(result.success?.ID).toBe('song-123')
      expect(result.success?.title).toBe('Amazing Grace')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Amazing Grace' }),
        })
      )
    })

    it('creates song with full metadata', async () => {
      const params: CreateSongParams = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        tempo: 72,
        timeSignature: '4/4',
      }

      const songResponse = {
        success: {
          ID: 'song-456',
          title: 'Amazing Grace',
          artist: 'John Newton',
          key: 'G',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => songResponse,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.createSong(params)

      expect(result.success?.ID).toBe('song-456')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs'),
        expect.objectContaining({
          body: JSON.stringify(params),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Song already exists' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.createSong({ title: 'Test' })).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
      })
    })
  })

  describe('updateSongContent', () => {
    it('updates song content successfully', async () => {
      const updateResponse = {
        success: {
          ID: 'song-123',
          title: 'Amazing Grace',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updateResponse,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const content = '{title: Amazing Grace}\n\n[Verse]\nAmazing [G]grace'
      const result = await client.updateSongContent('song-123', content)

      expect(result.success?.ID).toBe('song-123')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs/song-123/content'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: content,
        })
      )
    })

    it('throws on content update error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Invalid content format' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.updateSongContent('song-123', 'bad content')).rejects.toThrow(OnSongError)
    })

    it('URL-encodes song ID in path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: { ID: 'song with spaces', title: 'Test' } }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.updateSongContent('song with spaces', 'content')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs/song%20with%20spaces/content'),
        expect.any(Object)
      )
    })
  })

  describe('importSong', () => {
    it('creates song and updates content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: { ID: 'new-song-id', title: 'Amazing Grace' },
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: { ID: 'new-song-id', title: 'Amazing Grace' },
        }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const content = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 72}

[Verse]
Amazing [G]grace how [C]sweet the [G]sound`

      const result = await client.importSong(content)

      expect(result.songId).toBe('new-song-id')
      expect(result.title).toBe('Amazing Grace')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws when createSong returns no song ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.importSong('{title: Test}')).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
      })
    })
  })

  describe('parseChartMetadata (via importSong)', () => {
    const createClientAndImport = async (content: string) => {
      let capturedBody: CreateSongParams | undefined

      mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/songs') && init?.method === 'PUT') {
          capturedBody = JSON.parse(init.body as string)
          return {
            ok: true,
            json: async () => ({ success: { ID: 'test-id', title: capturedBody?.title } }),
          }
        }
        return {
          ok: true,
          json: async () => ({ success: { ID: 'test-id', title: 'Test' } }),
        }
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.importSong(content)
      return capturedBody
    }

    it('extracts title from ChordPro format', async () => {
      const params = await createClientAndImport('{title: Amazing Grace}')
      expect(params?.title).toBe('Amazing Grace')
    })

    it('extracts artist from ChordPro format', async () => {
      const params = await createClientAndImport(`{title: Song}
{artist: John Newton}`)
      expect(params?.artist).toBe('John Newton')
    })

    it('extracts key from ChordPro format', async () => {
      const params = await createClientAndImport(`{title: Song}
{key: G}`)
      expect(params?.key).toBe('G')
    })

    it('extracts tempo from ChordPro format', async () => {
      const params = await createClientAndImport(`{title: Song}
{tempo: 120}`)
      expect(params?.tempo).toBe(120)
    })

    it('handles case-insensitive directives', async () => {
      const params = await createClientAndImport(`{TITLE: Song}
{Artist: Someone}
{KEY: C}
{TEMPO: 100}`)
      expect(params?.title).toBe('Song')
      expect(params?.artist).toBe('Someone')
      expect(params?.key).toBe('C')
      expect(params?.tempo).toBe(100)
    })

    it('defaults to Untitled when no title found', async () => {
      const params = await createClientAndImport(`Just lyrics without metadata`)
      expect(params?.title).toBe('Untitled')
    })

    it('stops parsing at first non-directive line', async () => {
      const params = await createClientAndImport(`{title: Real Title}

{artist: Should Not Be Parsed}`)
      expect(params?.title).toBe('Real Title')
      expect(params?.artist).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('throws CONNECTION_REFUSED on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.ping()).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_REFUSED,
      })
    })

    it('throws CONNECTION_TIMEOUT on abort', async () => {
      mockFetch.mockImplementation(async () => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        throw error
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
        timeoutMs: 100,
      })

      await expect(client.ping()).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_TIMEOUT,
      })
    })

    it('throws CONNECTION_REFUSED on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.ping()).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_REFUSED,
      })
    })
  })

  describe('searchSongs', () => {
    it('builds query string correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.searchSongs({ q: 'amazing', limit: 10, start: 5 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/songs\?q=amazing&limit=10&start=5$/),
        expect.any(Object)
      )
    })

    it('URL-encodes query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.searchSongs({ q: 'amazing grace & love' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=amazing%20grace%20%26%20love'),
        expect.any(Object)
      )
    })
  })

  describe('getSongContent', () => {
    it('fetches song content successfully', async () => {
      const songContent = '{title: Amazing Grace}\n\n[Verse]\nAmazing grace'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => songContent,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.getSongContent('song-123')

      expect(result).toBe(songContent)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs/song-123/content'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('URL-encodes song ID in path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content',
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.getSongContent('song with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/songs/song%20with%20spaces/content'),
        expect.any(Object)
      )
    })

    it('throws API_NOT_FOUND on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.getSongContent('nonexistent')).rejects.toMatchObject({
        code: ErrorCodes.API_NOT_FOUND,
      })
    })

    it('throws API_ERROR on other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.getSongContent('song-123')).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
      })
    })

    it('throws CONNECTION_TIMEOUT on abort', async () => {
      mockFetch.mockImplementation(async () => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        throw error
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
        timeoutMs: 100,
      })

      await expect(client.getSongContent('song-123')).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_TIMEOUT,
      })
    })

    it('throws CONNECTION_REFUSED on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.getSongContent('song-123')).rejects.toMatchObject({
        code: ErrorCodes.CONNECTION_REFUSED,
      })
    })
  })

  describe('listSets', () => {
    it('fetches sets successfully', async () => {
      const setsResponse = {
        count: 2,
        results: [
          { ID: 'set-1', name: 'Sunday Morning', quantity: 5 },
          { ID: 'set-2', name: 'Wednesday Night', quantity: 3 },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => setsResponse,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.listSets()

      expect(result.count).toBe(2)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]?.name).toBe('Sunday Morning')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('createSet', () => {
    it('creates set successfully', async () => {
      const createResponse = {
        success: { ID: 'new-set-id', name: 'New Set' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createResponse,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.createSet('New Set')

      expect(result.success?.ID).toBe('new-set-id')
      expect(result.success?.name).toBe('New Set')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'New Set' }),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Set already exists' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.createSet('Duplicate')).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
      })
    })
  })

  describe('getSet', () => {
    it('fetches set details with songs', async () => {
      const setDetail = {
        ID: 'set-123',
        name: 'Sunday Morning',
        archived: false,
        songs: [
          { ID: 'song-1', title: 'Amazing Grace', artist: 'Traditional' },
          { ID: 'song-2', title: 'How Great Thou Art', artist: 'Traditional' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => setDetail,
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.getSet('set-123')

      expect(result.ID).toBe('set-123')
      expect(result.name).toBe('Sunday Morning')
      expect(result.songs).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets/set-123'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('URL-encodes set ID in path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test Set' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.getSet('set with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets/set%20with%20spaces'),
        expect.any(Object)
      )
    })
  })

  describe('addSongToSet', () => {
    it('adds song to set successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Song added' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      const result = await client.addSongToSet('set-123', 'song-456')

      expect(result.success).toBe('Song added')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets/set-123/songs'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ songID: 'song-456' }),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Song not found' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await expect(client.addSongToSet('set-123', 'invalid-song')).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
      })
    })

    it('URL-encodes set ID in path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 'Song added' }),
      })

      const client = new ConnectClient({
        host: '10.0.0.1',
        port: 80,
        token: 'a'.repeat(32),
      })

      await client.addSongToSet('set with spaces', 'song-123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sets/set%20with%20spaces/songs'),
        expect.any(Object)
      )
    })
  })
})
