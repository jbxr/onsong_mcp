# Feature Specification: OnSong MCP Server

**Feature Branch**: `001-onsong-mcp-server`  
**Created**: 2026-01-10  
**Status**: Draft  
**Input**: User description: "based on @docs/prd.md"

## Overview

Build a locally running MCP (Model Context Protocol) server that enables LLM clients to query state, search, export/import charts, and trigger navigation/control actions in the OnSong app via OnSong Connect (local REST) and URL schemes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover OnSong Devices (Priority: P1)

As a musician (Joe), I want to discover OnSong devices on my local network so that I can connect to my songbook app from my AI assistant.

**Why this priority**: Device discovery is the foundational capability - without finding OnSong, no other features can work. This is the gateway to all other functionality.

**Independent Test**: Can be fully tested by starting the MCP server and verifying it detects OnSong instances on the LAN, delivering immediate value by confirming network connectivity.

**Acceptance Scenarios**:

1. **Given** OnSong is running with Connect enabled on an iPad on the same LAN, **When** I invoke the discover tool, **Then** the server returns a list of devices with name, host, port, and addresses.
2. **Given** no OnSong devices are on the network, **When** I invoke the discover tool, **Then** the server returns an empty list within the timeout period without errors.
3. **Given** multiple OnSong devices are on the network, **When** I invoke the discover tool, **Then** all devices are listed with unique identifiers.

---

### User Story 2 - Query Current Performance State (Priority: P1)

As Joe, I want to ask my AI assistant "What's our current setlist?" and receive the setlist data from OnSong.

**Why this priority**: Reading state is the most common use case and enables awareness of what's currently loaded in OnSong without manual checking.

**Independent Test**: Can be tested by connecting to a discovered OnSong instance and querying the current song/set state.

**Acceptance Scenarios**:

1. **Given** OnSong has a set loaded with Song A currently displayed, **When** I query the performance state, **Then** the response includes current_song="Song A" and the current_set name.
2. **Given** OnSong is open but no song is selected, **When** I query the performance state, **Then** the response indicates no current song is loaded.
3. **Given** the OnSong Connect endpoint does not support state queries, **When** I query the performance state, **Then** the response clearly indicates "unsupported" with a remediation message.

---

### User Story 3 - Search Song Library (Priority: P2)

As Joe, I want to ask "Find songs with 'wheel' or artist 'Eagles'" and get search results with song IDs and metadata.

**Why this priority**: Searching enables finding songs quickly which is essential before importing, opening, or exporting specific content.

**Independent Test**: Can be tested by sending search queries to OnSong and verifying matching results are returned.

**Acceptance Scenarios**:

1. **Given** OnSong library contains "Take It Easy" by Eagles, **When** I search for artist "Eagles", **Then** the result includes that song with title, artist, and any available metadata.
2. **Given** a search query with no matches, **When** I perform the search, **Then** an empty result set is returned without errors.
3. **Given** search is not supported by the Connect API, **When** I attempt to search, **Then** a clear "unsupported" message with remediation is returned.

---

### User Story 4 - Trigger Performance Actions (Priority: P2)

As Joe, I want to say "Next song" or "Jump to chorus" and have OnSong navigate accordingly during a performance.

**Why this priority**: Remote control actions enable hands-free performance navigation, which is valuable during live performance scenarios.

**Independent Test**: Can be tested by triggering actions (next song, previous song, scroll) and observing OnSong responds.

**Acceptance Scenarios**:

1. **Given** OnSong has multiple songs in a set, **When** I trigger "next song" action, **Then** OnSong advances to the next song and the response confirms success.
2. **Given** I am on the last song in a set, **When** I trigger "next song" action, **Then** OnSong handles the boundary appropriately (loops, stops, or shows warning).
3. **Given** the action name is invalid, **When** I attempt to run it, **Then** an error message lists valid action names.

---

### User Story 5 - Import Song Charts (Priority: P2)

As Joe, I want to say "Add Everlong acoustic chart in key D with capo 0" and have the server import a chart into OnSong.

**Why this priority**: Import enables adding new content to OnSong, which is essential for building and updating the song library.

**Independent Test**: Can be tested by creating a ChordPro or text chart file and importing it into OnSong via the MCP server.

**Acceptance Scenarios**:

1. **Given** a valid ChordPro file at a specified path, **When** I invoke the import tool with that file, **Then** OnSong imports the song and the response confirms success.
2. **Given** base64-encoded content and filename, **When** I invoke the import tool with that content, **Then** the chart is imported to OnSong.
3. **Given** import is disabled in configuration, **When** I attempt to import, **Then** the operation is blocked with a message explaining how to enable imports.

---

### User Story 6 - Export Songs to Files (Priority: P3)

As Joe, I want to say "Export our Month 1 micro-set to a folder as PDFs/text" and have those files saved locally.

**Why this priority**: Export is valuable for backup and sharing, but is dependent on OnSong's export capabilities which may have limitations.

**Independent Test**: Can be tested by requesting export of a specific song or set and verifying files are written to the output directory.

**Acceptance Scenarios**:

1. **Given** OnSong has a set named "Month 1", **When** I export it in txt format to ~/exports, **Then** text files for each song are created in that directory.
2. **Given** the export format is not supported, **When** I attempt the export, **Then** a clear error lists supported formats.
3. **Given** export callback mechanisms are not available, **When** I attempt to export, **Then** a clear "unsupported" message explains the limitation.

---

### User Story 7 - Open Specific Song or Set (Priority: P3)

As Joe, I want to say "Open the song 'Freebird'" and have OnSong navigate directly to that song.

**Why this priority**: Direct navigation complements search by allowing immediate access to known songs.

**Independent Test**: Can be tested by invoking open with a song identifier and observing OnSong displays that song.

**Acceptance Scenarios**:

1. **Given** a song named "Freebird" exists in the library, **When** I invoke open with type="song" and identifier="Freebird", **Then** OnSong displays that song.
2. **Given** the identifier does not match any song, **When** I invoke open, **Then** an error message indicates the song was not found.

---

### Edge Cases

- What happens when OnSong Connect is not enabled in app settings? - Server returns connection error with guidance to enable Connect.
- How does the system handle network disconnections mid-operation? - Operations timeout gracefully and return descriptive errors.
- What happens when the OnSong app is closed during a request? - Connection refused errors are caught and reported clearly.
- How does the system handle very large libraries during search? - Results are paginated/limited to prevent memory issues.
- What happens when import payload exceeds URL scheme size limits? - Error message indicates size limit and suggests alternative approaches.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST discover OnSong Connect servers on the local network using Bonjour/mDNS within a configurable timeout.
- **FR-002**: System MUST validate connectivity to a selected OnSong device before performing operations.
- **FR-003**: System MUST query current performance state (current song, set, position) when the OnSong Connect API supports it.
- **FR-004**: System MUST search the song library by title, artist, or text query when the OnSong Connect API supports it.
- **FR-005**: System MUST trigger navigation actions (next song, previous song, scroll) via URL scheme or Connect API.
- **FR-006**: System MUST import song charts in txt, ChordPro, or OnSong formats via URL scheme with base64-encoded content.
- **FR-007**: System MUST export songs/sets to local files in supported formats when OnSong provides export capabilities.
- **FR-008**: System MUST open specific songs or sets in OnSong via URL scheme.
- **FR-009**: System MUST provide a dry-run mode that logs intended actions without executing them.
- **FR-010**: System MUST log all tool invocations with timestamp, tool name, target host, and parameters (with secrets redacted).
- **FR-011**: System MUST require explicit configuration flag to enable import/write operations (safety by default).
- **FR-012**: System MUST return structured JSON responses with clear error codes and remediation steps for all tool calls.
- **FR-013**: System MUST support an allowlist of target hosts/ports for security.
- **FR-014**: System MUST implement timeouts on all network calls.
- **FR-015**: System MUST gracefully degrade - if Connect lacks a feature, fall back to URL scheme where possible.

### Key Entities

- **OnSong Device**: A discovered OnSong instance with name, host, port, addresses, and optional metadata.
- **Song**: A musical chart with title, artist, key, and content; identified by ID or path within OnSong.
- **Set**: A collection of songs organized for performance; identified by name.
- **Performance State**: Current runtime state including active song, set, position within song, and mode.
- **Capabilities**: Feature flags indicating what the connected OnSong instance supports (state, search, import, export, actions, open).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can discover OnSong devices on the local network within 3 seconds.
- **SC-002**: Users can query current performance state and receive a response within 2 seconds.
- **SC-003**: Users can search the song library and receive results within 2 seconds.
- **SC-004**: Users can trigger navigation actions (next/previous song) and see OnSong respond within 1 second.
- **SC-005**: Users can import a standard ChordPro chart successfully on first attempt 95% of the time.
- **SC-006**: All unsupported operations return clear, actionable error messages within 1 second.
- **SC-007**: System operates entirely on local network with zero cloud dependencies.
- **SC-008**: Configuration can be completed in under 5 minutes using provided documentation.

## Assumptions

- OnSong Connect is enabled in the OnSong app settings on the target device.
- The MCP server and OnSong devices are on the same local network (LAN).
- macOS is the primary server platform with `open` command available for URL scheme invocation.
- The user has appropriate permissions to create files in the export output directory.
- Network latency on local LAN is negligible (< 50ms).
- OnSong Connect API capabilities may vary by OnSong version; the system will probe and adapt.

## Constraints

- All operations must remain local-network only; no cloud sync or external connections.
- The MCP server cannot delete or rename songs within OnSong (not supported by official interfaces).
- Export capabilities depend on OnSong's callback mechanisms which may have limitations.
- URL scheme payloads have size limits which may restrict large imports.
- Some operations may require user interaction on iOS due to OS security prompts.

## Dependencies

- OnSong app with Connect feature enabled on target device(s).
- Local network connectivity between server and OnSong devices.
- macOS for URL scheme invocation (via `open` command or AppleScript).

## Out of Scope (v1)

- Full CRUD operations (delete/rename) within OnSong.
- Cloud sync across multiple locations.
- Auto-generating musical content (AI composition).
- MIDI SysEx ingestion for metadata broadcast.
- Windows or Linux server support.
