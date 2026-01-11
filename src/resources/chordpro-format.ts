import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const CHORDPRO_GUIDE = `# ChordPro Format Guide

## Basic Structure
A ChordPro file consists of:
1. Metadata directives (title, artist, key, etc.)
2. Lyrics with inline chord markers

## Metadata Directives
{title: Song Title}
{artist: Artist Name}
{key: G}
{tempo: 120}
{time: 4/4}
{capo: 2}

## Section Markers
{comment: Verse 1}
{comment: Chorus}
{comment: Bridge}

## Chord Placement
Place chords in square brackets before the syllable:
[G]Amazing [D]grace, how [C]sweet the [G]sound

## Chord Notation
- Major: G, C, D
- Minor: Am, Em, Dm
- Seventh: G7, Cmaj7, Dm7
- Slash: G/B, C/E, D/F#
- Suspended: Gsus4, Dsus2

## Example
{title: Amazing Grace}
{artist: Traditional}
{key: G}

{comment: Verse 1}
[G]Amazing [G/B]grace, how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
`

export function registerChordProResource(server: McpServer): void {
  server.registerResource(
    'chordpro-format',
    'docs://chordpro-format',
    {
      title: 'ChordPro Format Reference',
      description: 'Guide for formatting chord charts for OnSong import',
      mimeType: 'text/markdown',
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: CHORDPRO_GUIDE,
        },
      ],
    })
  )
}
