import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Config } from './lib/schemas.js'
import { createLogger, setLogger } from './lib/logger.js'
import { registerAllTools } from './tools/index.js'
import { registerAllPrompts } from './prompts/index.js'

export interface ServerOptions {
  config: Config
}

export function createMcpServer(options: ServerOptions): McpServer {
  const { config } = options

  const logger = createLogger(config.logLevel ?? 'info')
  setLogger(logger)

  const server = new McpServer({
    name: 'onsong-mcp',
    version: '0.1.0',
  })

  registerAllTools(server, config)
  registerAllPrompts(server)

  return server
}

export async function startServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
