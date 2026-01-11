import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

const PROMPT_NAME = 'find-chord-chart'
const PROMPT_TITLE = 'Find Chord Chart'
const PROMPT_DESCRIPTION = 'Search for and import a chord chart into OnSong'

const argsSchema = {
  songTitle: z.string().describe('Song title to search for'),
  artist: z.string().optional().describe('Artist name'),
}

export function registerFindChordChartPrompt(server: McpServer): void {
  server.registerPrompt(
    PROMPT_NAME,
    {
      title: PROMPT_TITLE,
      description: PROMPT_DESCRIPTION,
      argsSchema,
    },
    ({ songTitle, artist }) => {
      const artistPart = artist !== undefined ? ` by ${artist}` : ''

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Find a chord chart for "${songTitle}"${artistPart}.

Steps:
1. Search the web for chord charts
2. Find one with accurate chords and complete lyrics
3. Convert to ChordPro format
4. Use the onsong_library_import tool to add it to OnSong

Prefer sources like Ultimate Guitar, Chordie, or official sheet music sites.`,
            },
          },
        ],
      }
    }
  )
}
