# Spec: OnSong MCP Server (Local) — AI-Controlled Songbook Bridge
owner: Joe
status: draft
version: 0.1.0
last_updated: 2026-01-10
tags: mcp, onsong, ios, macos, local-network, bonjour, rest, url-scheme, automation

## Summary
Build a locally running **MCP server** that enables an LLM client (Claude/Desktop, Cursor, etc.) to **query state, search, export/import charts, and trigger navigation/control actions** in the OnSong app using OnSong’s developer interfaces:
- **OnSong Connect** (local REST server in-app, discoverable on LAN)
- **OnSong URL schemes / Actions** (onsong:// URLs for actions, open, import/export)
- Optional: **MIDI SysEx** (read-only metadata broadcast) — out of scope for v1

The MCP server runs on macOS (MacBook) and exposes a tool surface for:
- Discovering reachable OnSong instances on the LAN
- Querying current song/set state
- Searching songs
- Exporting songs/sets/library data (where supported)
- Importing or updating song charts by generating files and invoking OnSong import flows
- Triggering remote control actions (next/prev song, scroll, jump sections) via Connect and/or URL Actions

---

## Goals
1. Provide a stable MCP tool interface that an LLM can use to:
   - Discover OnSong devices
   - Read current state and search the library
   - Export song/set content into local files
   - Import new/updated charts back into OnSong
   - Trigger performance/navigation actions
2. Keep all operation **local-network only** (no cloud dependence).
3. Ensure operations are auditable, safe, and require explicit configuration of the target OnSong instance(s).

## Non-Goals (v1)
- Full CRUD (delete/rename) within OnSong if not supported by official interfaces
- Cloud sync across multiple locations
- Auto-generating musical content (that’s a separate AI feature; MCP just enables I/O and control)
- MIDI SysEx ingestion (nice-to-have, later)

---

## Target Platforms
- Server: macOS (Apple Silicon preferred), Node.js 20+
- Clients: any MCP-capable client (Claude Desktop, Cursor, custom)
- OnSong devices: iPad/iPhone/Mac running OnSong (same LAN)

---

## Assumptions / Constraints
- OnSong exposes developer interfaces documented at: https://onsongapp.com/developers/
- OnSong Connect is LAN-local and may require enabling in app settings.
- URL scheme invocation (onsong://) may require:
  - Running on macOS with app installed
  - Or invoking via AppleScript/`open` command to trigger OnSong
- Some export/import operations may require user interaction (iOS OS prompts) depending on scheme and OS restrictions.
- The MCP server must never exfiltrate content off-machine unless explicitly configured by the user.

---

## Primary User Stories
1. As Joe, I can ask an LLM: “What’s our current setlist?” and the MCP server returns setlist data.
2. As Joe, I can ask: “Add Everlong acoustic chart in key D with capo 0,” and the server imports it into OnSong.
3. As Joe, I can ask: “Export our Month 1 micro-set to a folder as PDFs/text,” and the server saves them locally.
4. As Joe, I can ask: “Next song / previous song / jump to chorus,” and the server triggers OnSong actions.
5. As Joe, I can ask: “Find songs with ‘wheel’ or artist ‘Eagles’,” and get results with IDs/paths.

---

## UX / Operational Requirements
- CLI `onsong-mcp` to run the MCP server locally
- Configuration via `~/.config/onsong-mcp/config.json` (or env vars)
- Human-readable logs and a `--dry-run` mode
- Optional `--interactive` mode to select a target device from discovered instances
- All tool calls return structured JSON, with clear error codes and remediation steps

---

## MCP Tool Surface (v1)

### Tool: `onsong.discover`
Discover OnSong Connect servers on the LAN (Bonjour/mDNS).
**Input**
- `timeout_ms` (default 2000)
**Output**
- `devices[]`: `{ name, host, port, addresses[], metadata? }`

### Tool: `onsong.connect_test`
Validate that a chosen device is reachable and authenticated (if applicable).
**Input**
- `host`, `port`
**Output**
- `{ ok, version?, capabilities? }`

### Tool: `onsong.state.get`
Get current performance state (current song, set, position) when available.
**Input**
- `target` `{ host, port }`
**Output**
- `{ current_song?, current_set?, song_position?, mode?, timestamp }`

### Tool: `onsong.library.search`
Search songs by title/artist/text query via Connect where possible.
**Input**
- `target`
- `query`
- `limit` (default 25)
**Output**
- `songs[]`: `{ id?, title, artist?, key?, path?, match_fields[] }`

### Tool: `onsong.library.export`
Export songs/sets/library via supported mechanism (Connect if supported; otherwise URL export callback flow).
**Input**
- `target`
- `scope`: `song | set | library`
- `identifier` (song id/name or set name)
- `format`: `onsong | chordpro | txt | pdf` (pdf if supported)
- `output_dir`
**Output**
- `{ exported_files[], warnings[] }`

### Tool: `onsong.library.import`
Import a chart/file into OnSong using URL scheme import (base64 payload or file reference).
**Input**
- `file_path` OR `content_base64` + `filename`
- `destination` (optional: song collection/set)
- `open_after_import` (default false)
**Output**
- `{ ok, onsong_result?, warnings[] }`

### Tool: `onsong.action.run`
Trigger a named OnSong action (e.g., next song, previous song, pedal forward) via URL actions and/or Connect.
**Input**
- `action_name`
- `args?`
**Output**
- `{ ok, performed_via: "connect" | "url_scheme", warnings[] }`

### Tool: `onsong.open`
Open a song/set in OnSong via URL scheme.
**Input**
- `type`: `song | set`
- `identifier`
**Output**
- `{ ok }`

---

## Architecture

### Components
1. **MCP Server**
   - Implements MCP protocol transport (stdio or HTTP, depending on your MCP client)
   - Exposes tools listed above
2. **Discovery Module**
   - mDNS/Bonjour discovery for OnSong Connect servers
3. **Connect Client**
   - HTTP client for OnSong Connect endpoints
   - Capability detection (what endpoints exist)
4. **URL Scheme Invoker**
   - macOS: uses `open "onsong://..."` to invoke OnSong actions/import/export
   - Handles percent-encoding, payload sizing limits, and retries
5. **Export/Import Pipeline**
   - Export: receive callback data (if supported) and write to files
   - Import: convert content to base64, generate URL, invoke, confirm
6. **Local Callback Receiver (if needed)**
   - Local HTTP server to receive OnSong callback URLs for export results
   - Must be configurable (port, token, bind address)

### Data Flow (Typical)
- Discover -> Select target -> Connect test
- Search / State query -> Return JSON
- Export -> trigger export -> receive callback -> decode -> persist -> return file list
- Import -> read file -> base64 -> invoke import -> confirm -> return status
- Action -> invoke -> return ok

---

## Security & Safety
- Store configuration locally only.
- Support an allowlist of target hosts/ports.
- Require explicit `--enable-import` flag (or config) to allow modifying operations.
- Log every action invocation including:
  - timestamp
  - tool name
  - target host
  - parameters (redact secrets)
- Optional `confirm_actions` mode: for destructive/large operations, require a second call with a nonce.

---

## Reliability
- Timeouts on all network calls
- Retries with exponential backoff for transient errors
- Graceful degradation:
  - If Connect lacks a feature, fall back to URL scheme where possible
  - If export callback not supported, return “unsupported” with suggestion

---

## Compatibility / Unknowns to Validate Early
- Exact OnSong Connect endpoint paths and authentication (if any)
- Whether Connect supports library listing/search vs only performance state
- URL scheme capabilities for:
  - exporting songs/sets/library
  - importing content on macOS without user prompts
- Maximum safe payload size for base64 in URL scheme imports
- Callback URL handling feasibility on macOS (custom scheme vs localhost http)

Define a `capabilities` object after probing:
- `connect.state`
- `connect.search`
- `url.import`
- `url.export`
- `url.actions`
- `url.open`

---

## Acceptance Criteria
1. `onsong.discover` reliably finds at least one OnSong instance on the LAN (when available).
2. `onsong.state.get` returns the currently loaded song (or a clear unsupported error).
3. `onsong.library.search` returns results for a query (or clear unsupported error).
4. `onsong.library.import` can import a simple TXT/ChordPro chart into OnSong on macOS.
5. `onsong.action.run` can trigger at least:
   - next/previous song
   - forward/back (pedal equivalent)
6. Export: either works end-to-end OR returns a clear, actionable unsupported message.

---

## Implementation Details (Guidance)
- Language: TypeScript (Node.js)
- Packages:
  - mDNS discovery: `bonjour-service` or equivalent
  - HTTP client: `undici` or `node-fetch`
  - CLI: `commander`
  - Logging: `pino`
- Use a strict schema validator for tool inputs/outputs (e.g., `zod`)
- Provide a minimal test harness that can run without OnSong by mocking the Connect server.

---

## Deliverables
- `README.md` with setup steps:
  - enabling OnSong Connect
  - network requirements
  - running the MCP server
  - example tool calls
- `config.example.json`
- Fully working MCP server exposing the tools above
- Basic integration tests (mock server + optional live test)

---

## Open Questions (Track in Issues)
1. What are the exact Connect endpoints available in the current OnSong version?
2. Does Connect provide library CRUD or only control/state?
3. What export routes exist (URL scheme / connect) and what formats are supported?
4. What is the safest cross-platform callback mechanism for exports?

---

## Milestones
1. **Spike (Day 1)**
   - Discover OnSong via Bonjour
   - Connect test
2. **Read-only Tools (Week 1)**
   - state.get
   - library.search (if available)
3. **Control Tools (Week 1–2)**
   - action.run via URL scheme
4. **Import Tool (Week 2)**
   - library.import via URL scheme
5. **Export Tool (Week 3)**
   - library.export via callback receiver + decoding (if feasible)
6. **Hardening (Week 3)**
   - config, logs, dry-run, tests