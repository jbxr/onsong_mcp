import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Config } from '../lib/schemas.js'
import { DiscoveryService } from '../services/discovery.js'
import { registerDiscoverTool } from './discover.js'
import { registerConnectTestTool } from './connect.js'
import { registerStateGetTool } from './state.js'
import { registerSearchTool } from './search.js'
import { registerActionRunTool } from './action.js'
import { registerImportTool } from './import.js'
import { registerExportTool } from './export.js'
import { registerOpenTool } from './open.js'
import { registerSetsTools } from './sets.js'

export function registerAllTools(server: McpServer, config: Config): void {
  const discovery = new DiscoveryService()

  registerDiscoverTool(server, discovery)
  registerConnectTestTool(server)
  registerStateGetTool(server)
  registerSearchTool(server)
  registerActionRunTool(server)
  registerImportTool(server, config)
  registerExportTool(server, config)
  registerOpenTool(server)
  registerSetsTools(server)
}
