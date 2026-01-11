import { ConnectClient, type ConnectClientOptions } from './connect-client.js'
import { getOrCreateToken, setToken } from './token-cache.js'

export interface Target {
  host: string
  port: number
  token?: string | undefined
}

export async function createAuthenticatedClient(
  target: Target,
  deviceName: string = 'onsong-mcp'
): Promise<ConnectClient> {
  const token = target.token ?? getOrCreateToken(target.host, target.port)

  const options: ConnectClientOptions = {
    host: target.host,
    port: target.port,
    token,
  }

  const client = new ConnectClient(options)

  if (target.token === undefined) {
    await client.authenticate(deviceName)
    setToken(target.host, target.port, client.getToken())
  }

  return client
}
