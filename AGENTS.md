# OnSong MCP Server - Development Guidelines

> Guidelines for AI coding agents working in this repository.

## Project Overview

TypeScript MCP (Model Context Protocol) server enabling LLM clients to interact with the OnSong app via local network REST API and URL schemes.

**Stack**: TypeScript 5.x, Node.js 20+, ESM modules
**Key Dependencies**: @modelcontextprotocol/sdk, zod, bonjour-service, pino, commander

## Commands

### Build & Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm start            # Run the MCP server
npm run dev          # Run with tsx (development)
```

### Testing

```bash
npm test                           # Run all tests
npm test -- --run                  # Run once without watch
npm test -- tests/unit/            # Run unit tests only
npm test -- tests/integration/     # Run integration tests only
npm test -- -t "discover"          # Run tests matching pattern
npm test -- tests/unit/tools/discover.test.ts  # Run single test file
```

### Linting & Formatting

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm run typecheck    # TypeScript type checking only
```

### Combined Checks

```bash
npm run check        # lint + typecheck + test (CI command)
```

## Project Structure

```
src/
├── index.ts              # CLI entry point (commander)
├── server.ts             # MCP server setup (McpServer, StdioServerTransport)
├── config.ts             # Config loading from ~/.config/onsong-mcp/
├── tools/                # MCP tool implementations (one file per tool)
├── services/             # Business logic (discovery, HTTP client, URL schemes)
└── lib/                  # Shared utilities (schemas, types, errors)

tests/
├── unit/                 # Unit tests (mocked dependencies)
├── integration/          # Integration tests (mock OnSong server)
└── contract/             # MCP protocol compliance tests
```

## Code Style

### TypeScript Conventions

- **Strict mode**: All strict flags enabled in tsconfig.json
- **ESM only**: Use `.js` extensions in imports (`import { foo } from './bar.js'`)
- **No enums**: Use `as const` objects or union types instead
- **Explicit return types**: Always declare return types on exported functions
- **No `any`**: Use `unknown` and narrow with type guards

### Imports Order

```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises'
import { exec } from 'node:child_process'

// 2. External packages
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import pino from 'pino'

// 3. Internal modules (absolute from src/)
import { Config } from './config.js'
import { DiscoveryService } from './services/discovery.js'

// 4. Types (if separate)
import type { OnSongDevice, Target } from './lib/types.js'
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `connect-client.ts` |
| Classes | PascalCase | `DiscoveryService` |
| Functions | camelCase | `discoverDevices()` |
| Constants | SCREAMING_SNAKE | `DEFAULT_TIMEOUT_MS` |
| Types/Interfaces | PascalCase | `OnSongDevice` |
| Zod schemas | camelCase + Schema | `targetSchema` |

### Zod Schemas

Define schemas in `src/lib/schemas.ts` and derive types:

```typescript
import { z } from 'zod'

export const targetSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  token: z.string().min(32).optional(),
})

export type Target = z.infer<typeof targetSchema>
```

### Error Handling

Return errors via MCP's `isError` pattern, don't throw:

```typescript
// Good - MCP tool error response
return {
  content: [{ type: 'text', text: `Error: ${message}` }],
  isError: true,
}

// Good - service layer throws, tool catches and wraps
try {
  const result = await service.doThing()
  return { content: [{ type: 'text', text: JSON.stringify(result) }] }
} catch (error) {
  return {
    content: [{ type: 'text', text: formatError(error) }],
    isError: true,
  }
}
```

Define error codes in `src/lib/errors.ts`:

```typescript
export const ErrorCodes = {
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  AUTH_FAILED: 'AUTH_FAILED',
  TIMEOUT: 'TIMEOUT',
} as const
```

### Logging

Use pino logger, inject via dependency:

```typescript
import pino from 'pino'

const logger = pino({ name: 'onsong-mcp' })

// In tools/services
logger.info({ host, port }, 'Connecting to OnSong')
logger.error({ err, deviceId }, 'Connection failed')
logger.debug({ response }, 'API response')  // Verbose, only at debug level
```

## MCP Tool Pattern

Each tool in `src/tools/` follows this structure:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { discoverInputSchema } from '../lib/schemas.js'
import { DiscoveryService } from '../services/discovery.js'

export function registerDiscoverTool(
  server: McpServer,
  discovery: DiscoveryService
): void {
  server.tool(
    'onsong.discover',
    {
      timeout_ms: z.number().int().min(500).max(30000).default(2000)
        .describe('Discovery timeout in milliseconds'),
    },
    async ({ timeout_ms }) => {
      const devices = await discovery.discover(timeout_ms)
      return {
        content: [{ type: 'text', text: JSON.stringify({ devices }) }],
      }
    }
  )
}
```

## Testing Guidelines

### Unit Tests

- One test file per source file: `src/tools/discover.ts` → `tests/unit/tools/discover.test.ts`
- Mock all external dependencies (services, fetch, child_process)
- Test error cases and edge conditions

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('DiscoveryService', () => {
  it('returns empty array when no devices found', async () => {
    // ...
  })

  it('respects timeout parameter', async () => {
    // ...
  })
})
```

### Integration Tests

- Use mock OnSong server in `tests/integration/mock-onsong/`
- Test full tool execution flow
- Test MCP protocol compliance

## Key Constraints

1. **Local network only**: Never make external HTTP calls except to OnSong on LAN
2. **No cloud dependencies**: All operations work offline
3. **Import safety**: Require `enableImport: true` in config for write operations
4. **Structured responses**: All tools return JSON with consistent schema
5. **Timeout everything**: All network calls must have configurable timeouts

## OnSong API Quick Reference

```
Base URL: http://<host>:5076/api/<token>/

GET  /ping              # Health check
GET  /state             # Current song/set/position
GET  /songs?q=<query>   # Search library
GET  /songs/<id>        # Song details
GET  /sets              # List sets

URL Schemes:
onsong://ImportData/<filename>?<base64>     # Import chart
onsong://action/<action_name>               # Trigger action
onsong://open/songs?song=<id>               # Open song
```

## Specs & Documentation

Feature specs live in `specs/001-onsong-mcp-server/`:
- `spec.md` - Feature requirements
- `plan.md` - Implementation plan
- `research.md` - API research findings
- `data-model.md` - Entity definitions
- `contracts/` - JSON schemas for tools and API

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
