# Tasks: OnSong MCP Server

**Input**: Design documents from `/specs/001-onsong-mcp-server/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted (can be added later if needed).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic TypeScript/Node.js structure

- [ ] T001 Create project structure per plan.md (src/, tests/, lib/ directories)
- [ ] T002 Initialize TypeScript project with package.json and tsconfig.json
- [ ] T003 [P] Install core dependencies: @modelcontextprotocol/sdk, zod, bonjour-service, pino, commander
- [ ] T004 [P] Configure ESLint with TypeScript rules in .eslintrc.json
- [ ] T005 [P] Configure Prettier for code formatting in .prettierrc
- [ ] T006 [P] Setup vitest for testing in vitest.config.ts
- [ ] T007 Create .gitignore for Node.js/TypeScript project

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define error codes and messages in src/lib/errors.ts
- [ ] T009 [P] Define TypeScript types/interfaces from data-model.md in src/lib/types.ts
- [ ] T010 [P] Define Zod schemas for all entities from contracts/ in src/lib/schemas.ts
- [ ] T011 Implement configuration loading/validation in src/config.ts
- [ ] T012 Implement pino structured logging setup in src/lib/logger.ts
- [ ] T013 Implement MCP server setup with StdioServerTransport in src/server.ts
- [ ] T014 Implement CLI entry point with commander in src/index.ts
- [ ] T015 Create tool registration barrel export in src/tools/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Discover OnSong Devices (Priority: P1) MVP

**Goal**: Enable musicians to discover OnSong devices on their local network via Bonjour/mDNS

**Independent Test**: Start MCP server, invoke onsong.discover, verify it detects OnSong instances on LAN and returns device list with name, host, port, addresses

### Implementation for User Story 1

- [ ] T016 [US1] Implement Bonjour discovery service for _onsong._tcp in src/services/discovery.ts
- [ ] T017 [US1] Implement onsong.discover tool with timeout parameter in src/tools/discover.ts
- [ ] T018 [US1] Register discover tool in src/tools/index.ts
- [ ] T019 [US1] Add discovery logging with device details in src/services/discovery.ts

**Checkpoint**: User Story 1 complete - can discover OnSong devices on network

---

## Phase 4: User Story 2 - Query Current Performance State (Priority: P1)

**Goal**: Enable querying what song/setlist is currently loaded in OnSong

**Independent Test**: Connect to discovered OnSong instance, invoke onsong.state.get, receive current song/set/position data

### Implementation for User Story 2

- [ ] T020 [US2] Implement OnSong Connect HTTP client with fetch in src/services/connect-client.ts
- [ ] T021 [US2] Implement token generation and authentication flow in src/services/connect-client.ts
- [ ] T022 [US2] Implement onsong.connect_test tool for connectivity validation in src/tools/connect.ts
- [ ] T023 [US2] Register connect_test tool in src/tools/index.ts
- [ ] T024 [US2] Implement onsong.state.get tool in src/tools/state.ts
- [ ] T025 [US2] Register state.get tool in src/tools/index.ts
- [ ] T026 [US2] Add HTTP client logging with request/response details in src/services/connect-client.ts

**Checkpoint**: User Stories 1 AND 2 complete - can discover devices and query state

---

## Phase 5: User Story 3 - Search Song Library (Priority: P2)

**Goal**: Enable searching OnSong library by title, artist, or text query

**Independent Test**: Invoke onsong.library.search with query "Eagles", verify matching songs returned with metadata

### Implementation for User Story 3

- [ ] T027 [US3] Extend connect-client with songs search endpoint in src/services/connect-client.ts
- [ ] T028 [US3] Implement onsong.library.search tool with query/limit params in src/tools/search.ts
- [ ] T029 [US3] Register search tool in src/tools/index.ts
- [ ] T030 [US3] Handle search pagination and result limiting in src/tools/search.ts

**Checkpoint**: User Story 3 complete - can search song library

---

## Phase 6: User Story 4 - Trigger Performance Actions (Priority: P2)

**Goal**: Enable remote control of OnSong (next song, scroll, pedal actions) via URL schemes

**Independent Test**: Invoke onsong.action.run with action "NextSongWasRequested", observe OnSong advances to next song

### Implementation for User Story 4

- [ ] T031 [US4] Implement macOS URL scheme invoker using child_process in src/services/url-scheme.ts
- [ ] T032 [US4] Implement onsong.action.run tool with action_name and args in src/tools/action.ts
- [ ] T033 [US4] Register action.run tool in src/tools/index.ts
- [ ] T034 [US4] Add action validation against known action names in src/tools/action.ts
- [ ] T035 [US4] Add URL scheme invocation logging in src/services/url-scheme.ts

**Checkpoint**: User Story 4 complete - can trigger performance actions

---

## Phase 7: User Story 5 - Import Song Charts (Priority: P2)

**Goal**: Enable importing ChordPro/text charts into OnSong via URL scheme

**Independent Test**: Invoke onsong.library.import with base64-encoded ChordPro content, verify song appears in OnSong

### Implementation for User Story 5

- [ ] T036 [US5] Extend url-scheme service with import URL construction in src/services/url-scheme.ts
- [ ] T037 [US5] Implement onsong.library.import tool with file_path or content_base64 in src/tools/import.ts
- [ ] T038 [US5] Add enableImport configuration check (safety gate) in src/tools/import.ts
- [ ] T039 [US5] Register import tool in src/tools/index.ts
- [ ] T040 [US5] Handle file reading and base64 encoding in src/tools/import.ts

**Checkpoint**: User Story 5 complete - can import song charts

---

## Phase 8: User Story 6 - Export Songs to Files (Priority: P3)

**Goal**: Enable exporting songs/sets from OnSong to local files

**Independent Test**: Invoke onsong.library.export with set name and output_dir, verify files written to directory

### Implementation for User Story 6

- [ ] T041 [US6] Implement local HTTP callback server for export data in src/services/callback-server.ts
- [ ] T042 [US6] Extend url-scheme service with export URL construction in src/services/url-scheme.ts
- [ ] T043 [US6] Implement onsong.library.export tool with scope/format/output_dir in src/tools/export.ts
- [ ] T044 [US6] Register export tool in src/tools/index.ts
- [ ] T045 [US6] Handle callback data parsing and file writing in src/tools/export.ts
- [ ] T046 [US6] Add export timeout handling and cleanup in src/services/callback-server.ts

**Checkpoint**: User Story 6 complete - can export songs to files

---

## Phase 9: User Story 7 - Open Specific Song or Set (Priority: P3)

**Goal**: Enable direct navigation to a specific song or set in OnSong

**Independent Test**: Invoke onsong.open with type="song" and identifier="Freebird", verify OnSong displays that song

### Implementation for User Story 7

- [ ] T047 [US7] Extend url-scheme service with open URL construction in src/services/url-scheme.ts
- [ ] T048 [US7] Implement onsong.open tool with type and identifier in src/tools/open.ts
- [ ] T049 [US7] Register open tool in src/tools/index.ts

**Checkpoint**: All user stories complete - full OnSong MCP integration

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T050 [P] Add dry-run mode support across all tools per FR-009
- [ ] T051 [P] Implement host allowlist validation per FR-013
- [ ] T052 [P] Add configurable timeouts on all network calls per FR-014
- [ ] T053 Implement graceful degradation (Connect API fallback to URL scheme) per FR-015
- [ ] T054 [P] Create mock OnSong Connect server for testing in tests/integration/mock-onsong/
- [ ] T055 [P] Add unit tests for discovery service in tests/unit/services/discovery.test.ts
- [ ] T056 [P] Add unit tests for connect-client in tests/unit/services/connect-client.test.ts
- [ ] T057 [P] Add MCP protocol compliance tests in tests/contract/mcp.test.ts
- [ ] T058 Update AGENTS.md with project-specific commands and conventions
- [ ] T059 Validate quickstart.md instructions work end-to-end
- [ ] T060 Add npm scripts: build, start, dev, test, lint, format, typecheck, check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - can proceed in parallel after Foundational
  - US3-US5 are P2 priority - proceed after P1 stories or in parallel with team
  - US6-US7 are P3 priority - proceed after P2 stories or in parallel with team
- **Polish (Phase 10)**: Can start after US1 complete, fully execute after all stories done

### User Story Dependencies

| Story | Priority | Depends On | Can Parallelize With |
|-------|----------|------------|---------------------|
| US1 (Discover) | P1 | Foundational | US2 |
| US2 (State) | P1 | Foundational | US1 |
| US3 (Search) | P2 | US2 (connect-client) | US4, US5 |
| US4 (Actions) | P2 | Foundational | US3, US5 |
| US5 (Import) | P2 | US4 (url-scheme) | US3 |
| US6 (Export) | P3 | US4 (url-scheme) | US7 |
| US7 (Open) | P3 | US4 (url-scheme) | US6 |

### Within Each User Story

- Services before tools
- Core implementation before registration
- Validation/logging after core logic
- Story complete before checkpoint

### Parallel Opportunities

- Setup: T003, T004, T005, T006 can run in parallel
- Foundational: T009, T010 can run in parallel
- User Stories US1 and US2 can start simultaneously after Foundational
- User Stories US3, US4, US5 can proceed in parallel (different files, minimal overlap)
- User Stories US6 and US7 can proceed in parallel
- Polish: T050-T057 can all run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all parallel setup tasks together:
Task T003: "Install core dependencies: @modelcontextprotocol/sdk, zod, bonjour-service, pino, commander"
Task T004: "Configure ESLint with TypeScript rules in .eslintrc.json"
Task T005: "Configure Prettier for code formatting in .prettierrc"
Task T006: "Setup vitest for testing in vitest.config.ts"
```

---

## Parallel Example: User Stories 1 & 2 (P1 Priority)

```bash
# After Foundational completes, launch both P1 stories:

# Developer A - User Story 1:
Task T016: "Implement Bonjour discovery service for _onsong._tcp in src/services/discovery.ts"
Task T017: "Implement onsong.discover tool with timeout parameter in src/tools/discover.ts"

# Developer B - User Story 2:
Task T020: "Implement OnSong Connect HTTP client with fetch in src/services/connect-client.ts"
Task T024: "Implement onsong.state.get tool in src/tools/state.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Discover)
4. Complete Phase 4: User Story 2 (State Query)
5. **STOP and VALIDATE**: Test discovering devices and querying state
6. Deploy/demo MVP - musician can discover OnSong and see current song

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Discover + Query State → **MVP!**
3. Add US3 → Search Library → Enhanced discovery
4. Add US4 → Trigger Actions → Remote control enabled
5. Add US5 → Import Charts → Content creation enabled
6. Add US6 + US7 → Export + Open → Full bidirectional integration

### Performance Goals (from spec)

- Discovery < 3s (SC-001)
- State/Search < 2s (SC-002, SC-003)
- Actions < 1s (SC-004)
- Configuration < 5 minutes (SC-008)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Test tasks omitted - can be added via Phase 10 or separate request
