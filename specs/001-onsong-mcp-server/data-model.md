# Data Model: OnSong MCP Server

**Feature**: 001-onsong-mcp-server  
**Date**: 2026-01-10

## Overview

This document defines the data entities used by the OnSong MCP Server. These are TypeScript interfaces representing data structures exchanged between the MCP server, OnSong Connect API, and MCP clients.

---

## Core Entities

### OnSongDevice

Represents a discovered OnSong instance on the local network.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Device display name from Bonjour |
| host | string | Yes | IP address or hostname |
| port | number | Yes | TCP port (default: 5076) |
| addresses | string[] | Yes | All resolved IP addresses |
| metadata | DeviceMetadata | No | TXT record data |

### DeviceMetadata

Metadata from Bonjour TXT records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | No | Device model (iPad, iPhone, Mac) |
| deviceId | string | No | Unique device identifier |
| version | string | No | OnSong app version |
| role | "client" \| "server" | No | Connect role |

### Target

Connection target for API operations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| host | string | Yes | IP address or hostname |
| port | number | Yes | TCP port |
| token | string | No | Auth token (loaded from config if not provided) |

---

## OnSong Data Entities

### Song

A musical chart in the OnSong library.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | No | Unique song identifier (UUID) |
| title | string | Yes | Song title |
| artist | string | No | Artist name |
| key | string | No | Musical key (e.g., "G", "Am") |
| transposedKey | string | No | Transposed key if different from original |
| capo | number | No | Capo position (0-12) |
| tempo | number | No | BPM tempo |
| timeSignature | string | No | Time signature (e.g., "4/4") |
| duration | number | No | Duration in seconds |
| favorite | boolean | No | Starred/favorite flag |
| keywords | string[] | No | Tags/topics |
| content | string | No | Full chart content (lyrics + chords) |
| usefile | boolean | No | Uses external file |
| path | string | No | File path if external |

### SongSearchResult

Abbreviated song info returned from search.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | No | Song identifier |
| title | string | Yes | Song title |
| artist | string | No | Artist name |
| key | string | No | Musical key |
| favorite | boolean | No | Favorite flag |
| matchFields | string[] | No | Fields that matched the query |

### Set

A collection of songs organized for performance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | No | Unique set identifier |
| name | string | Yes | Set display name |
| songs | Song[] | No | Songs in the set (if expanded) |
| songCount | number | No | Number of songs |
| archived | boolean | No | Archived status |
| createdAt | string | No | ISO timestamp |
| updatedAt | string | No | ISO timestamp |

### Book

A song collection/category.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Book/collection name |
| songCount | number | No | Number of songs in book |

---

## State Entities

### PerformanceState

Current runtime state from OnSong.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentSong | Song | No | Currently displayed song |
| currentSet | Set | No | Currently loaded set |
| book | string | No | Active book ("all", "unbound", or name) |
| position | number | No | Scroll position (0-100 as float) |
| section | number | No | Current section index |
| autoScroll | boolean | No | Autoscroll enabled |
| timestamp | string | Yes | State retrieval timestamp |

### Capabilities

Feature flags indicating OnSong Connect support.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| connectState | boolean | Yes | State endpoint available |
| connectSearch | boolean | Yes | Songs search available |
| connectSets | boolean | Yes | Sets endpoint available |
| urlImport | boolean | Yes | URL scheme import works |
| urlExport | boolean | Yes | URL scheme export works |
| urlActions | boolean | Yes | URL scheme actions work |
| urlOpen | boolean | Yes | URL scheme open works |

---

## Request/Response Entities

### DiscoverInput

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| timeoutMs | number | No | 2000 | Discovery timeout |

### DiscoverOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| devices | OnSongDevice[] | Yes | Discovered devices |

### ConnectTestInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| host | string | Yes | Target host |
| port | number | Yes | Target port |

### ConnectTestOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ok | boolean | Yes | Connection successful |
| version | string | No | OnSong version |
| capabilities | Capabilities | No | Feature support |

### StateGetInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| target | Target | Yes | Connection target |

### StateGetOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentSong | Song | No | Current song |
| currentSet | Set | No | Current set |
| position | number | No | Scroll position |
| section | number | No | Section index |
| mode | string | No | App mode |
| timestamp | string | Yes | ISO timestamp |

### SearchInput

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| target | Target | Yes | - | Connection target |
| query | string | Yes | - | Search query |
| limit | number | No | 25 | Max results |

### SearchOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| songs | SongSearchResult[] | Yes | Matching songs |
| totalCount | number | No | Total matches (if paginated) |

### ImportInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| filePath | string | No | Path to chart file |
| contentBase64 | string | No | Base64-encoded content |
| filename | string | No | Filename (required with contentBase64) |
| destination | string | No | Target set/collection |
| openAfterImport | boolean | No | Open song after import |

### ImportOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ok | boolean | Yes | Import successful |
| onsongResult | string | No | OnSong response |
| warnings | string[] | No | Non-fatal warnings |

### ExportInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| target | Target | Yes | Connection target |
| scope | "song" \| "set" \| "library" | Yes | Export scope |
| identifier | string | Yes | Song/set name or ID |
| format | "onsong" \| "chordpro" \| "txt" \| "pdf" | Yes | Output format |
| outputDir | string | Yes | Output directory path |

### ExportOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| exportedFiles | string[] | Yes | Written file paths |
| warnings | string[] | No | Non-fatal warnings |

### ActionInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| actionName | string | Yes | Action identifier |
| args | Record<string, unknown> | No | Action parameters |

### ActionOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ok | boolean | Yes | Action executed |
| performedVia | "connect" \| "url_scheme" | No | Execution method |
| warnings | string[] | No | Non-fatal warnings |

### OpenInput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | "song" \| "set" | Yes | What to open |
| identifier | string | Yes | Song/set name or ID |

### OpenOutput

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ok | boolean | Yes | Open successful |

---

## Configuration Entities

### Config

Server configuration schema.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| defaultTarget | Target | No | - | Default connection target |
| targets | Record<string, Target> | No | {} | Named targets |
| enableImport | boolean | No | false | Allow import operations |
| logLevel | string | No | "info" | Log level |
| allowedHosts | string[] | No | [] | Host allowlist (empty = all) |
| callbackPort | number | No | 9876 | Export callback server port |
| dryRun | boolean | No | false | Log actions without executing |

---

## State Transitions

### Device Connection Flow

```
Discovered → Testing → Connected → Authenticated
     ↓          ↓           ↓             ↓
  Timeout   Unreachable  Auth Failed  Ready
```

### Export Flow

```
Requested → Callback Pending → Callback Received → Writing → Complete
     ↓              ↓                  ↓              ↓          ↓
  Invalid      Timeout            Decode Error   Write Error  Success
```

---

## Validation Rules

1. **Target.host**: Valid IPv4, IPv6, or hostname
2. **Target.port**: 1-65535
3. **Target.token**: Minimum 32 characters when provided
4. **Song.key**: Valid musical key (A-G with optional # or b, optional m for minor)
5. **ExportInput.format**: Must be one of supported formats
6. **Config.logLevel**: One of: error, warn, info, debug, trace
