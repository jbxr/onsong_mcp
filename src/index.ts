#!/usr/bin/env node

import { Command } from 'commander'
import { loadConfig } from './config.js'
import { createMcpServer, startServer } from './server.js'
import { getLogger } from './lib/logger.js'

const program = new Command()

program.name('onsong-mcp').description('MCP server for OnSong app integration').version('0.1.0')

program
  .command('serve', { isDefault: true })
  .description('Start the MCP server')
  .option('--dry-run', 'Log actions without executing them')
  .option('--log-level <level>', 'Log level (error, warn, info, debug, trace)')
  .action(async (options: { dryRun?: boolean; logLevel?: string }) => {
    try {
      const config = await loadConfig()

      if (options.dryRun === true) {
        config.dryRun = true
      }
      if (options.logLevel !== undefined) {
        config.logLevel = options.logLevel as 'error' | 'warn' | 'info' | 'debug' | 'trace'
      }

      const server = createMcpServer({ config })
      await startServer(server)
    } catch (error) {
      const logger = getLogger()
      logger.error({ error }, 'Failed to start server')
      process.exit(1)
    }
  })

program.parse()
