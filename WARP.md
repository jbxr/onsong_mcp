# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

OnSong MCP Server is a locally-running **Model Context Protocol (MCP) server** that enables LLM clients (Claude Desktop, Cursor, etc.) to interact with the OnSong app on iOS/macOS devices. The server runs on macOS and communicates with OnSong via:

- **OnSong Connect**: Local REST API server (discoverable via Bonjour/mDNS on LAN)
- **OnSong URL Schemes**: `onsong://` URLs for actions, import/export, and navigation
- **Optional MIDI SysEx**: Read-only metadata broadcast (future feature)

The MCP server exposes tools for discovering OnSong devices, querying song/setlist state, searching songs, exporting/importing charts, and triggering navigation/control actions.

**Key constraints:**
- All operations are local-network only (no cloud dependencies)
- Operations must be auditable and require explicit configuration
- Server runs on macOS (Apple Silicon preferred) with Node.js 20+

## Architecture

### Technology Stack (Planned)
- **Language**: TypeScript (Node.js)
- **Key Dependencies**: 
  - mDNS discovery: `bonjour-service`
  - HTTP client: `undici` or `node-fetch`
  - CLI: `commander`
  - Logging: `pino`
  - Schema validation: `zod`

### Core Components (Design)

1. **MCP Server**: Implements MCP protocol transport (stdio or HTTP) and exposes tool interface
2. **Discovery Module**: Bonjour/mDNS discovery for OnSong Connect servers on LAN
3. **Connect Client**: HTTP client for OnSong Connect REST endpoints with capability detection
4. **URL Scheme Invoker**: Invokes `onsong://` URLs via `open` command on macOS (handles encoding, limits, retries)
5. **Export/Import Pipeline**: 
   - Export: receives callback data, writes to local files
   - Import: converts content to base64, generates URL, invokes, confirms
6. **Local Callback Receiver**: HTTP server for receiving OnSong export callback URLs (configurable port/token)

### MCP Tool Surface

The server exposes these tools to LLM clients:

- `onsong.discover`: Find OnSong Connect servers via Bonjour/mDNS
- `onsong.connect_test`: Validate device reachability and authentication
- `onsong.state.get`: Get current performance state (song, set, position)
- `onsong.library.search`: Search songs by title/artist/text query
- `onsong.library.export`: Export songs/sets/library in various formats (OnSong, ChordPro, TXT, PDF)
- `onsong.library.import`: Import charts using URL scheme (base64 payload or file reference)
- `onsong.action.run`: Trigger named OnSong actions (next/prev song, scroll, pedal forward)
- `onsong.open`: Open a song/set in OnSong via URL scheme

## Development Environment

### Setup
```bash
# Python virtual environment is present but project will be TypeScript/Node.js
# Currently only configuration exists - implementation pending

# Once Node.js implementation begins:
# npm install
# npm run build
# npm run dev
```

### Configuration
- Configuration file: `~/.config/onsong-mcp/config.json` (or environment variables)
- Will support `--dry-run` mode and `--interactive` mode for device selection
- Requires explicit `--enable-import` flag for modifying operations

### Testing
```bash
# Tests will use mock OnSong Connect server
# npm test
# npm run test:integration  # Optional live tests with real OnSong device
```

## API Reference

### OnSong Connect API
The `docs/OnSong Connect API/` directory contains HTML documentation for the OnSong REST API endpoints:

- **Authentication** (`auth.html`): Authentication flows
- **Songs** (`songs.html`): Chord chart access and search
- **Sets** (`sets.html`): Setlist management
- **State** (`state.html`): Current performance state (song, set)
- **Books** (`books.html`): Song collections
- **Folders** (`folders.html`): Set organization by venue
- **Convert** (`convert.html`): Format conversion utilities
- **Hooks** (`hooks.html`): Webhook notifications
- **Media** (`media.html`): Audio/video/image resources
- **Settings** (`settings.html`): Library configuration
- **Instruments** (`instruments.html`): Chord diagrams and instrument info
- **Ping** (`ping.html`): Server availability check
- **Video** (`video.html`): External video preferences

### OnSong URL Scheme
OnSong supports `onsong://` URLs for:
- Opening songs/sets
- Importing content (base64 payloads)
- Triggering actions (next/prev, scroll, jump sections)
- Exporting content (callback-based)

Reference: https://onsongapp.com/developers/

## Key Design Decisions

### Security & Safety
- Configuration stored locally only
- Support allowlist of target hosts/ports
- Explicit opt-in for modifying operations (`--enable-import`)
- Comprehensive logging with timestamps, tool names, targets, parameters (secrets redacted)
- Optional `confirm_actions` mode for destructive operations (requires nonce)

### Reliability Patterns
- Timeouts on all network calls
- Retries with exponential backoff for transient errors
- Graceful degradation: Fall back from Connect to URL schemes where possible
- Capability detection: Probe and track supported features per device

### Data Flow
1. **Discovery**: Find OnSong devices → select target → validate connection
2. **Query**: Search/state query → return structured JSON
3. **Export**: Trigger export → receive callback → decode → persist → return file list
4. **Import**: Read file → encode base64 → invoke URL scheme → confirm → return status
5. **Action**: Invoke action → return confirmation

## Implementation Status

**Current state**: Early planning phase
- ✅ PRD documented (`docs/prd.md`)
- ✅ OnSong Connect API documentation available
- ✅ Python virtual environment configured (but will use TypeScript/Node.js)
- ⏳ Source code implementation pending

**Milestones** (from PRD):
1. Spike (Day 1): Bonjour discovery + connect test
2. Read-only Tools (Week 1): state.get, library.search
3. Control Tools (Week 1-2): action.run via URL scheme
4. Import Tool (Week 2): library.import via URL scheme
5. Export Tool (Week 3): library.export via callback receiver
6. Hardening (Week 3): config, logs, dry-run, tests

## Open Questions

Track in issues as implementation progresses:
1. Exact OnSong Connect endpoints available in current OnSong version
2. Does Connect provide library CRUD or only control/state?
3. What export routes exist and what formats are supported?
4. Safest cross-platform callback mechanism for exports
5. Maximum safe payload size for base64 in URL scheme imports
6. Whether OnSong Connect supports library listing/search vs only performance state

## Important Notes for Development

- **Never exfiltrate content** off-machine unless explicitly configured by user
- **Local network only**: All operations use local REST API or URL schemes
- **User interaction**: Some export/import operations may require iOS OS prompts depending on scheme and restrictions
- **Tool output**: All tool calls must return structured JSON with clear error codes and remediation steps
- **Capability probing**: Detect and cache what each OnSong device supports (connect.state, connect.search, url.import, url.export, url.actions, url.open)
