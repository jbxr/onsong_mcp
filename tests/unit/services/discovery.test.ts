import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'

interface MockBrowser extends EventEmitter {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

let currentBrowser: MockBrowser | null = null

vi.mock('bonjour-service', () => {
  return {
    Bonjour: class {
      find() {
        const browser = new EventEmitter() as MockBrowser
        browser.start = vi.fn()
        browser.stop = vi.fn()
        currentBrowser = browser
        return browser
      }
      destroy() {}
    },
  }
})

import { DiscoveryService } from '../../../src/services/discovery.js'
import type { OnSongDevice } from '../../../src/lib/schemas.js'

describe('DiscoveryService', () => {
  let service: DiscoveryService

  beforeEach(() => {
    vi.useFakeTimers()
    service = new DiscoveryService()
    currentBrowser = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('discover', () => {
    it('returns empty array when no devices found', async () => {
      const promise = service.discover(500)
      vi.advanceTimersByTime(500)
      const devices = await promise
      expect(devices).toEqual([])
    })

    it('uses default timeout of 2000ms', async () => {
      const promise = service.discover()
      vi.advanceTimersByTime(2000)
      const devices = await promise
      expect(devices).toEqual([])
    })

    it('discovers device from Bonjour service', async () => {
      const promise = service.discover(1000)

      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: "John's iPad",
        host: '10.0.0.68',
        port: 56700,
        addresses: ['10.0.0.68'],
        txt: { displayName: 'Worship iPad' },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices).toHaveLength(1)
      expect(devices[0]).toEqual({
        name: 'Worship iPad',
        host: '10.0.0.68',
        port: 80,
        addresses: ['10.0.0.68'],
      })
    })

    it('uses displayName from TXT record when available', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'device-uuid',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: { displayName: 'My iPad Pro' },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].name).toBe('My iPad Pro')
    })

    it('falls back to _d TXT field for displayName', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'device-uuid',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: { _d: 'Alternative Name' },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].name).toBe('Alternative Name')
    })

    it('falls back to service name when no displayName', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'OnSong-iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].name).toBe('OnSong-iPad')
    })

    it('overrides advertised port with REST API port 80', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].port).toBe(80)
    })

    it('deduplicates devices by host', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'First',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      currentBrowser?.emit('up', {
        name: 'Duplicate',
        host: '10.0.0.1',
        port: 56701,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices).toHaveLength(1)
      expect(devices[0].name).toBe('First')
    })

    it('extracts metadata from TXT record', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {
          model: 'iPad Pro',
          deviceId: 'abc123',
          version: '2024.1',
          role: 'server',
        },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].metadata).toEqual({
        model: 'iPad Pro',
        deviceId: 'abc123',
        version: '2024.1',
        role: 'server',
      })
    })

    it('handles deviceid (lowercase) in TXT record', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: { deviceid: 'lowercase-id' },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].metadata?.deviceId).toBe('lowercase-id')
    })

    it('omits metadata when TXT record is empty', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].metadata).toBeUndefined()
    })

    it('validates role field accepts only client or server', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: { role: 'invalid' },
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].metadata).toBeUndefined()
    })

    it('discovers multiple devices', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad 1',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      currentBrowser?.emit('up', {
        name: 'iPad 2',
        host: '10.0.0.2',
        port: 56701,
        addresses: ['10.0.0.2'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices).toHaveLength(2)
      expect(devices.map((d: OnSongDevice) => d.host)).toEqual(['10.0.0.1', '10.0.0.2'])
    })

    it('handles missing addresses array', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices[0].addresses).toEqual([])
    })

    it('handles browser error without crashing', async () => {
      const promise = service.discover(1000)
      await vi.advanceTimersByTimeAsync(0)

      currentBrowser?.emit('error', new Error('Browser error'))
      currentBrowser?.emit('up', {
        name: 'iPad',
        host: '10.0.0.1',
        port: 56700,
        addresses: ['10.0.0.1'],
        txt: {},
      })

      await vi.advanceTimersByTimeAsync(1000)
      const devices = await promise

      expect(devices).toHaveLength(1)
    })
  })
})
