import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerFormatChordProPrompt } from './format-chordpro.js'
import { registerFindChordChartPrompt } from './find-chord-chart.js'

export function registerAllPrompts(server: McpServer): void {
  registerFormatChordProPrompt(server)
  registerFindChordChartPrompt(server)
}
