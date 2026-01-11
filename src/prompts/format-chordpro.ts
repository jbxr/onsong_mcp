import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

const PROMPT_NAME = 'format-as-chordpro'
const PROMPT_TITLE = 'Format as ChordPro'
const PROMPT_DESCRIPTION = 'Convert raw chord/lyrics text to ChordPro format for OnSong import'

const argsSchema = {
  rawContent: z.string().describe('Raw chord chart content (lyrics with chords)'),
  title: z.string().optional().describe('Song title if known'),
  artist: z.string().optional().describe('Artist name if known'),
  key: z.string().optional().describe('Musical key if known'),
}

export function registerFormatChordProPrompt(server: McpServer): void {
  server.registerPrompt(
    PROMPT_NAME,
    {
      title: PROMPT_TITLE,
      description: PROMPT_DESCRIPTION,
      argsSchema,
    },
    ({ rawContent, title, artist, key }) => {
      const metadataLines = []
      if (title !== undefined) {
        metadataLines.push(`Title: ${title}`)
      }
      if (artist !== undefined) {
        metadataLines.push(`Artist: ${artist}`)
      }
      if (key !== undefined) {
        metadataLines.push(`Key: ${key}`)
      }

      const metadataSection = metadataLines.length > 0 ? `\n${metadataLines.join('\n')}\n` : ''

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Convert the following raw chord chart into proper ChordPro format.

Requirements:
1. Add metadata directives at the top ({title:}, {artist:}, {key:}, etc.)
2. Place chords in [brackets] directly before the syllable where the chord change occurs
3. Add section markers using {comment: Verse 1}, {comment: Chorus}, etc.
4. Preserve the original lyrics exactly
5. Use standard chord notation (G, Am, D7, G/B, etc.)
${metadataSection}
Raw content:
${rawContent}

Output only the ChordPro formatted text, no explanations.`,
            },
          },
        ],
      }
    }
  )
}
