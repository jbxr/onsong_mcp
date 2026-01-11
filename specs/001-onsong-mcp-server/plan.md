# Implementation Plan: OnSong MCP Server

**Branch**: `001-onsong-mcp-server` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-onsong-mcp-server/spec.md`

## Summary

Build a locally running MCP server that enables LLM clients to discover, query, search, import/export, and control the OnSong app via OnSong Connect REST API and URL schemes. The server implements 8 MCP tools providing full bidirectional integration with OnSong's developer interfaces.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: @modelcontextprotocol/sdk, zod, bonjour-service, pino, commander  
**Storage**: JSON config file at `~/.config/onsong-mcp/config.json`  
**Testing**: vitest for unit/integration, mock OnSong Connect server  
**Target Platform**: macOS (Apple Silicon preferred), Node.js runtime  
**Project Type**: single - CLI MCP server  
**Performance Goals**: Discovery < 3s, State/Search < 2s, Actions < 1s  
**Constraints**: Local network only, no cloud dependencies, explicit import enablement  
**Scale/Scope**: Single user, 1-5 OnSong devices, ~10k song library support

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains template placeholders rather than project-specific rules. Applying reasonable defaults:

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | PASS | Each tool module is standalone and testable |
| CLI Interface | PASS | All tools return structured JSON, CLI entry point |
| Test-First | WILL APPLY | Tests defined before implementation in Phase 2 |
| Integration Testing | WILL APPLY | Mock OnSong server for contract tests |
| Observability | PASS | Structured logging via pino, all actions logged |
| Simplicity | PASS | Single project, minimal dependencies, clear boundaries |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-onsong-mcp-server/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output - API research
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - getting started guide
├── contracts/           # Phase 1 output - API schemas
│   ├── mcp-tools.json   # MCP tool definitions
│   └── onsong-connect.json # OnSong Connect API types
└── tasks.md             # Phase 2 output (not created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.ts              # CLI entry point
├── server.ts             # MCP server setup
├── config.ts             # Configuration loading/validation
├── tools/
│   ├── index.ts          # Tool registration
│   ├── discover.ts       # onsong.discover
│   ├── connect.ts        # onsong.connect_test
│   ├── state.ts          # onsong.state.get
│   ├── search.ts         # onsong.library.search
│   ├── import.ts         # onsong.library.import
│   ├── export.ts         # onsong.library.export
│   ├── action.ts         # onsong.action.run
│   └── open.ts           # onsong.open
├── services/
│   ├── discovery.ts      # Bonjour/mDNS discovery
│   ├── connect-client.ts # OnSong Connect HTTP client
│   ├── url-scheme.ts     # macOS URL scheme invoker
│   └── callback-server.ts # Export callback receiver
└── lib/
    ├── schemas.ts        # Zod schemas for all tools
    ├── types.ts          # TypeScript types/interfaces
    └── errors.ts         # Error codes and messages

tests/
├── unit/
│   ├── services/
│   └── tools/
├── integration/
│   ├── mock-onsong/      # Mock OnSong Connect server
│   └── tools.test.ts
└── contract/
    └── mcp.test.ts
```

**Structure Decision**: Single project structure selected. This is a standalone CLI/MCP server with no frontend/backend split required. All modules reside in `src/` with clear separation between tools (MCP interface), services (OnSong communication), and lib (shared utilities).

## Complexity Tracking

> No violations requiring justification - project follows simplicity principle.

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| Library-First | PASS | 8 tool modules in `src/tools/`, 4 service modules in `src/services/` - each independently testable |
| CLI Interface | PASS | `src/index.ts` CLI entry point; all tools return structured JSON per contracts |
| Test-First | READY | Test structure defined in `tests/`; mock server pattern established |
| Integration Testing | READY | `tests/integration/mock-onsong/` structure defined; contract tests at `tests/contract/mcp.test.ts` |
| Observability | PASS | Pino logger configured; FR-010 requires logging all invocations |
| Simplicity | PASS | Single project, 5 runtime dependencies, clear module boundaries |

**Post-Design Gate Result**: PASS - Design adheres to constitution principles. Ready for Phase 2 task generation.

## Phase Outputs Summary

| Phase | Output | Status |
|-------|--------|--------|
| Phase 0 | research.md | Complete |
| Phase 1 | data-model.md | Complete |
| Phase 1 | contracts/mcp-tools.json | Complete |
| Phase 1 | contracts/onsong-connect.json | Complete |
| Phase 1 | quickstart.md | Complete |
| Phase 2 | tasks.md | Not in scope (created by /speckit.tasks) |
