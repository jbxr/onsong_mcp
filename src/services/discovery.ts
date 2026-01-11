import { Bonjour, type Service } from 'bonjour-service'
import type { OnSongDevice, DeviceMetadata } from '../lib/schemas.js'
import { createChildLogger } from '../lib/logger.js'

// OnSong advertises as _onsongapp._tcp (not _onsong._tcp as documented)
const SERVICE_TYPE = 'onsongapp'
const DEFAULT_TIMEOUT_MS = 2000
// The Bonjour port is for sync protocol; the REST API runs on port 80
const DEFAULT_API_PORT = 80

export class DiscoveryService {
  private readonly logger = createChildLogger({ service: 'discovery' })

  async discover(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<OnSongDevice[]> {
    const devices: OnSongDevice[] = []
    const seen = new Set<string>()
    const bonjour = new Bonjour()

    return new Promise((resolve) => {
      const browser = bonjour.find({ type: SERVICE_TYPE })

      setTimeout(() => {
        browser.stop()
        bonjour.destroy()
        this.logger.info({ count: devices.length, timeoutMs }, 'Discovery complete')
        resolve(devices)
      }, timeoutMs)

      browser.on('up', (service: Service) => {
        // Dedupe by host (not port, since we override port to API port)
        const key = service.host
        if (seen.has(key)) return
        seen.add(key)

        const device = this.serviceToDevice(service)
        devices.push(device)
        this.logger.debug({ device }, 'Device discovered')
      })

      browser.on('error', (err: Error) => {
        this.logger.warn({ err }, 'Discovery browser error')
      })

      browser.start()
    })
  }

  private serviceToDevice(service: Service): OnSongDevice {
    const txt = service.txt as Record<string, string> | undefined
    const metadata: DeviceMetadata | undefined = this.extractMetadata(txt)

    // Use displayName from TXT record if available, otherwise fall back to service name
    const displayName = txt?.['displayName'] ?? txt?.['_d']
    const name = displayName ?? service.name

    return {
      name,
      host: service.host,
      // The advertised port is for sync protocol; REST API is on port 80
      port: DEFAULT_API_PORT,
      addresses: service.addresses ?? [],
      ...(metadata && { metadata }),
    }
  }

  private extractMetadata(txt: Record<string, string> | undefined): DeviceMetadata | undefined {
    if (txt === undefined || Object.keys(txt).length === 0) return undefined

    const metadata: DeviceMetadata = {}

    const model = txt['model']
    if (model !== undefined && model !== '') metadata.model = model

    const deviceId = txt['deviceId'] ?? txt['deviceid']
    if (deviceId !== undefined && deviceId !== '') metadata.deviceId = deviceId

    const version = txt['version']
    if (version !== undefined && version !== '') metadata.version = version

    const role = txt['role']
    if (role === 'client' || role === 'server') metadata.role = role

    return Object.keys(metadata).length > 0 ? metadata : undefined
  }
}
