# Research: OnSong MCP Server

**Date**: 2026-01-10  
**Feature**: 001-onsong-mcp-server

## Executive Summary

Research confirms that OnSong provides comprehensive developer APIs sufficient for all planned MCP tools. The OnSong Connect REST API supports device discovery, state queries, library search, and CRUD operations. URL schemes handle import, export, and navigation actions. TypeScript with the official MCP SDK is the optimal implementation stack.

---

## 1. OnSong Connect REST API

### Discovery (Bonjour/mDNS)

**Decision**: Use `bonjour-service` npm package to discover OnSong devices advertising `_onsong._tcp` service type.

**Rationale**: 
- OnSong Connect advertises via Bonjour/mDNS with service type `_onsong._tcp`
- Default port is 5076 (configurable)
- TXT record contains: model, deviceid, version, role (client/server)
- `bonjour-service` is TypeScript-native, actively maintained, and has built-in timeout support

**Alternatives considered**:
- `multicast-dns` - Lower-level, requires manual record parsing
- `bonjour` (original) - Deprecated, archived

### Authentication

**Decision**: Generate and register a 32+ character authentication token per device.

**Rationale**:
- OnSong Connect requires token registration before API access
- Token flow: `PUT /api/<token>/auth` to register, `GET` to verify
- Token can include friendly name for identification
- Store token in configuration file for persistence

**Flow**:
```
1. GET /api/<token>/auth → 404 "Not Registered"
2. PUT /api/<token>/auth (body: {name: "MCP Server"}) → "Token Registered"
3. Subsequent calls with token → "Token Accepted"
```

### State Endpoint

**Decision**: Use `GET /api/<token>/state` for current performance state.

**Rationale**: Endpoint returns comprehensive state object:
- `song` - Current song (ID, title, artist, key, favorite, usefile)
- `set` - Current set object
- `book` - Current book/collection
- `position` - Scroll position (0-100%)
- `section` - Current section index
- `autoScroll` - Boolean status

**Change detection**: `HEAD /api/<token>/state` returns Last-Modified header for polling.

### Library Search

**Decision**: Use `GET /api/<token>/songs` with query parameters.

**Rationale**: Full-featured search API with:
- `q` - Keyword search (title, artist, keywords, lyrics)
- `title`, `artist`, `key`, `topic` - Field-specific filters
- `set`, `book` - Collection filters
- `sort` - Multiple sort options (title, artist, favorite, added, updated, etc.)
- `limit`, `start` - Pagination support
- Default limit: 100 results

### CRUD Operations

**Decision**: Implement read operations for v1, defer delete/rename.

**Rationale**:
- Songs: `GET /songs/<id>` for details, `PUT /songs` creates new
- Sets: Full CRUD available via `/sets` endpoints
- v1 scope excludes delete/rename per PRD non-goals

---

## 2. URL Schemes

### Import

**Decision**: Use `onsong://ImportData/<filename>?<base64_data>` for chart import.

**Rationale**:
- Supports inline Base64-encoded content
- Alternative: `onsong://<url>` for remote file import
- No user confirmation required on macOS
- Size limit: URL schemes have practical limits (~2MB encoded data)

**Implementation**: Use macOS `open` command:
```bash
open "onsong://ImportData/song.txt?<base64>"
```

### Export

**Decision**: Use `onsong://export/songs?collection=<id>&returnURL=<callback>` with local HTTP callback.

**Rationale**:
- Export requires callback URL to receive data
- Returns Base64-encoded tab-delimited data
- Configurable columns: ID, title, artist, key, transposedKey, capo, etc.
- Requires local HTTP server to receive callback

### Navigation Actions

**Decision**: Use URL scheme actions for navigation control.

**Rationale**: 170+ actions available including:
- `onsong://action/ForwardPedalWasPressed` - Next section
- `onsong://action/BackwardPedalWasPressed` - Previous section
- `onsong://action/PositionWasAdjusted?amount=0.5` - Scroll position
- `onsong://action/SongSectionWasPressed?sectionID=Chorus` - Jump to section
- `onsong://open/songs?index=next` - Next song
- `onsong://open/songs?index=previous` - Previous song

### Open Song/Set

**Decision**: Use `onsong://open/songs?song=<id>` for direct navigation.

**Rationale**:
- Supports song ID or title
- Can open by set: `?set=<name>` or `?set=current-set`
- Index navigation: `?index=first|last|next|previous|<number>`

---

## 3. Technology Stack

### Language & Runtime

**Decision**: TypeScript with Node.js 20+

**Rationale**:
- PRD explicitly specifies TypeScript/Node.js
- MCP SDK is TypeScript-native
- Strong typing for API contracts
- ESM modules for modern Node.js

**Note**: Existing pyproject.toml should be removed or repurposed; primary implementation is TypeScript.

### MCP SDK

**Decision**: Use `@modelcontextprotocol/sdk` (official SDK)

**Rationale**:
- Official Anthropic-maintained SDK
- High-level `McpServer` API with Zod schema integration
- `StdioServerTransport` for standard MCP client communication
- Built-in error handling patterns

**Dependencies**:
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "zod": "^3.25.0",
  "bonjour-service": "^1.0.0",
  "pino": "^8.0.0",
  "commander": "^12.0.0"
}
```

### HTTP Client

**Decision**: Use native `fetch` API (Node.js 20+ built-in)

**Rationale**:
- No additional dependency needed
- Sufficient for OnSong Connect REST calls
- Built-in timeout support via AbortController

### Configuration

**Decision**: JSON config file at `~/.config/onsong-mcp/config.json`

**Rationale**:
- Standard XDG location
- Human-readable and editable
- Supports multiple device targets
- Environment variable overrides for CI/automation

**Schema**:
```json
{
  "defaultTarget": { "host": "192.168.1.100", "port": 5076, "token": "..." },
  "targets": {},
  "enableImport": false,
  "logLevel": "info",
  "allowedHosts": []
}
```

### Logging

**Decision**: Use `pino` for structured JSON logging

**Rationale**:
- Fast, low-overhead
- JSON output for machine parsing
- Human-readable with `pino-pretty`
- Supports log levels and redaction

---

## 4. Project Structure

**Decision**: Single TypeScript project with modular source layout

```
src/
├── index.ts              # Entry point, CLI
├── server.ts             # MCP server setup
├── config.ts             # Configuration loading
├── tools/
│   ├── discover.ts       # onsong.discover tool
│   ├── connect.ts        # onsong.connect_test tool
│   ├── state.ts          # onsong.state.get tool
│   ├── search.ts         # onsong.library.search tool
│   ├── import.ts         # onsong.library.import tool
│   ├── export.ts         # onsong.library.export tool
│   ├── action.ts         # onsong.action.run tool
│   └── open.ts           # onsong.open tool
├── services/
│   ├── discovery.ts      # Bonjour discovery service
│   ├── connect-client.ts # OnSong Connect HTTP client
│   ├── url-scheme.ts     # URL scheme invoker
│   └── callback-server.ts # Local callback HTTP server
└── lib/
    ├── schemas.ts        # Zod schemas for all tools
    ├── types.ts          # TypeScript types
    └── errors.ts         # Error codes and messages

tests/
├── unit/
│   ├── tools/
│   └── services/
├── integration/
│   ├── mock-onsong/      # Mock OnSong Connect server
│   └── tools.test.ts
└── contract/
    └── mcp.test.ts       # MCP protocol compliance
```

---

## 5. Open Questions Resolved

| Question (from PRD) | Resolution |
|---------------------|------------|
| Exact Connect endpoint paths | Documented: `/api/<token>/{state,songs,sets,hooks,...}` |
| Authentication method | 32+ char token in URL path, registered via `/auth` endpoint |
| Connect supports search? | Yes: `GET /songs` with `q`, `title`, `artist`, etc. params |
| URL scheme for export | Yes: `onsong://export/songs?collection=<id>&returnURL=<callback>` |
| URL scheme for import | Yes: `onsong://ImportData/<name>?<base64>` |
| Callback mechanism | HTTP callback URL; requires local HTTP server |
| Bonjour service type | `_onsong._tcp` with metadata in TXT records |

---

## 6. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| URL scheme size limits | Document limits; chunk large imports; provide file path alternative |
| OnSong not responding | Configurable timeouts; clear error messages; retry logic |
| Export callback race | Timeout with pending state; correlation via request ID |
| Version differences | Probe capabilities at connect time; graceful degradation |
| Network isolation | Discovery timeout returns empty list; manual host entry supported |
